import { conversationService } from '@features/conversations';
import {
  SOCKET_EVENTS,
  socketManager,
  type MessageSendPayload,
} from '@shared/socket';

import { messageRepository } from '../db/repository';
import type { LocalMessage } from '../db/schema';
import { backoffMsForAttempt, isPermanentError } from './classify-error';
import {
  MAX_ATTEMPTS_PER_CYCLE,
  MAX_CONCURRENT_CONVERSATIONS,
  MESSAGE_ERROR_CODE,
  SEND_TIMEOUT_MS,
} from './constants';

type AckWaiter = {
  resolve: () => void;
  reject: (code: string) => void;
};

function sleep(ms: number, isAborted: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    if (isAborted()) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, ms);
    const interval = setInterval(() => {
      if (isAborted()) {
        clearTimeout(timer);
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}

function groupByConversation(
  rows: LocalMessage[],
): Map<string, LocalMessage[]> {
  const groups = new Map<string, LocalMessage[]>();
  for (const row of rows) {
    const list = groups.get(row.conversationId);
    if (list) {
      list.push(row);
    } else {
      groups.set(row.conversationId, [row]);
    }
  }
  return groups;
}

class MessageRetryCoordinator {
  private started = false;
  private flushRunning = false;
  private flushQueued = false;
  private readonly inFlight = new Set<string>();
  private readonly ackWaiters = new Map<string, AckWaiter>();
  private aborted = false;

  start(): void {
    this.started = true;
    this.aborted = false;
  }

  stop(): void {
    this.started = false;
    this.aborted = true;

    for (const [clientId, waiter] of this.ackWaiters) {
      waiter.reject(MESSAGE_ERROR_CODE.ABORTED);
      this.ackWaiters.delete(clientId);
    }
    this.inFlight.clear();
    this.flushRunning = false;
    this.flushQueued = false;
  }

  enqueue(_clientId: string): void {
    this.kick('send');
  }

  kick(_reason: string): void {
    if (!this.started) {
      return;
    }

    if (this.flushRunning) {
      this.flushQueued = true;
      return;
    }

    void this.runFlush();
  }

  /** Called after ack DB writes succeed. */
  notifyAck(clientId: string): boolean {
    const waiter = this.ackWaiters.get(clientId);
    if (!waiter) {
      return false;
    }
    this.ackWaiters.delete(clientId);
    waiter.resolve();
    return true;
  }

  /**
   * Returns true when an in-flight delivery owns the outcome (caller should
   * not write status itself).
   */
  notifyError(clientId: string, code: string): boolean {
    const waiter = this.ackWaiters.get(clientId);
    if (!waiter) {
      return false;
    }
    this.ackWaiters.delete(clientId);
    waiter.reject(code);
    return true;
  }

  private isAborted = () => this.aborted;

  private async runFlush(): Promise<void> {
    this.flushRunning = true;
    this.flushQueued = false;

    try {
      if (socketManager.getConnectionState() !== 'connected') {
        return;
      }

      await messageRepository.resetExhaustedCycles();

      const retryable = await messageRepository.listRetryable();
      if (retryable.length === 0) {
        return;
      }

      const groups = groupByConversation(retryable);
      const conversationIds = [...groups.keys()];
      let nextIndex = 0;

      const worker = async () => {
        while (!this.aborted) {
          const index = nextIndex;
          nextIndex += 1;
          if (index >= conversationIds.length) {
            return;
          }

          const conversationId = conversationIds[index]!;
          const queue = groups.get(conversationId) ?? [];
          await this.processConversation(queue);
        }
      };

      const workerCount = Math.min(
        MAX_CONCURRENT_CONVERSATIONS,
        conversationIds.length,
      );
      await Promise.all(Array.from({ length: workerCount }, () => worker()));
    } catch (error) {
      console.error('[messages] Retry flush failed', error);
    } finally {
      this.flushRunning = false;
      if (this.flushQueued && this.started) {
        this.kick('queued');
      }
    }
  }

  private async processConversation(messages: LocalMessage[]): Promise<void> {
    for (const message of messages) {
      if (this.aborted) {
        return;
      }

      if (socketManager.getConnectionState() !== 'connected') {
        return;
      }

      const latest = await messageRepository.findByClientId(message.clientId);
      if (!latest) {
        continue;
      }
      if (latest.status !== 'PENDING' && latest.status !== 'SENDING') {
        continue;
      }
      if (latest.attemptCount >= MAX_ATTEMPTS_PER_CYCLE) {
        continue;
      }

      const ok = await this.deliverWithRetries(latest.clientId);
      if (!ok && socketManager.getConnectionState() !== 'connected') {
        return;
      }
    }
  }

  private async deliverWithRetries(clientId: string): Promise<boolean> {
    while (!this.aborted) {
      if (socketManager.getConnectionState() !== 'connected') {
        const row = await messageRepository.findByClientId(clientId);
        await messageRepository.markTransientFailure({
          clientId,
          attemptCount: row?.attemptCount ?? 0,
          lastAttemptAt: new Date().toISOString(),
          lastError: MESSAGE_ERROR_CODE.SOCKET_DISCONNECTED,
        });
        return false;
      }

      const result = await this.deliverOnce(clientId);

      if (result === 'sent' || result === 'failed_permanent') {
        return true;
      }

      if (result === 'aborted' || result === 'socket_down') {
        return false;
      }

      const row = await messageRepository.findByClientId(clientId);
      if (!row) {
        return true;
      }

      if (row.attemptCount >= MAX_ATTEMPTS_PER_CYCLE) {
        return true;
      }

      await sleep(backoffMsForAttempt(row.attemptCount), this.isAborted);
      if (this.aborted) {
        return false;
      }
    }

    return false;
  }

  private async deliverOnce(
    clientId: string,
  ): Promise<
    'sent' | 'failed_permanent' | 'transient' | 'socket_down' | 'aborted'
  > {
    if (this.inFlight.has(clientId)) {
      return 'aborted';
    }

    if (socketManager.getConnectionState() !== 'connected') {
      return 'socket_down';
    }

    const message = await messageRepository.findByClientId(clientId);
    if (!message) {
      return 'aborted';
    }

    if (message.status === 'SENT') {
      return 'sent';
    }
    if (message.status === 'FAILED') {
      return 'failed_permanent';
    }

    const payload = await this.buildSendPayload(message);
    if (!payload) {
      await messageRepository.markFailed(
        clientId,
        MESSAGE_ERROR_CODE.VALIDATION_ERROR,
      );
      return 'failed_permanent';
    }

    this.inFlight.add(clientId);

    const attemptCount = message.attemptCount + 1;
    const lastAttemptAt = new Date().toISOString();

    try {
      await messageRepository.markSending({
        clientId,
        attemptCount,
        lastAttemptAt,
      });

      const outcome = await this.waitForAckOrTimeout(clientId, () => {
        socketManager.emit(SOCKET_EVENTS.MESSAGE_SEND, payload);
      });

      if (outcome === 'ack') {
        return 'sent';
      }

      const code = outcome;

      if (code === MESSAGE_ERROR_CODE.ABORTED) {
        return 'aborted';
      }

      if (isPermanentError(code)) {
        await messageRepository.markFailed(clientId, code);
        return 'failed_permanent';
      }

      await messageRepository.markTransientFailure({
        clientId,
        attemptCount,
        lastAttemptAt,
        lastError: code,
      });

      if (code === MESSAGE_ERROR_CODE.SOCKET_DISCONNECTED) {
        return 'socket_down';
      }

      return 'transient';
    } finally {
      this.inFlight.delete(clientId);
      this.ackWaiters.delete(clientId);
    }
  }

  private waitForAckOrTimeout(
    clientId: string,
    emit: () => void,
  ): Promise<'ack' | string> {
    return new Promise((resolve) => {
      let settled = false;

      const settle = (value: 'ack' | string) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutId);
        this.ackWaiters.delete(clientId);
        resolve(value);
      };

      this.ackWaiters.set(clientId, {
        resolve: () => settle('ack'),
        reject: (code: string) => settle(code),
      });

      const timeoutId = setTimeout(() => {
        settle(MESSAGE_ERROR_CODE.SEND_TIMEOUT);
      }, SEND_TIMEOUT_MS);

      emit();
    });
  }

  private async buildSendPayload(
    message: LocalMessage,
  ): Promise<MessageSendPayload | null> {
    const conversation = await conversationService.findById(
      message.conversationId,
    );
    if (!conversation) {
      return null;
    }

    const payload: MessageSendPayload = {
      clientId: message.clientId,
      content: message.content,
      contentType: message.contentType,
    };

    if (conversation.serverId) {
      payload.conversationId = conversation.serverId;
      return payload;
    }

    const peer = await conversationService.getChatPeer(message.senderId, {
      conversationId: message.conversationId,
    });
    if (!peer) {
      return null;
    }

    payload.recipientId = peer.id;
    return payload;
  }
}

export const messageRetryCoordinator = new MessageRetryCoordinator();
