import { and, asc, eq, gte, inArray } from 'drizzle-orm';

import { db } from '@/core/db/client';
import type { DbExecutor } from '@/core/db/types';

import {
  messages,
  MESSAGE_STATUS,
  type LocalMessage,
  type UpsertLocalMessageInput,
} from './schema';
import { MAX_ATTEMPTS_PER_CYCLE } from '../retry/constants';

export class MessageRepository {
  async findByClientId(clientId: string, executor: DbExecutor = db) {
    const [row] = await executor
      .select()
      .from(messages)
      .where(eq(messages.clientId, clientId))
      .limit(1);

    return row ?? null;
  }

  async listRetryable(executor: DbExecutor = db): Promise<LocalMessage[]> {
    return executor
      .select()
      .from(messages)
      .where(
        inArray(messages.status, [
          MESSAGE_STATUS.PENDING,
          MESSAGE_STATUS.SENDING,
        ]),
      )
      .orderBy(asc(messages.clientCreatedAt));
  }

  async upsertIncoming(
    input: UpsertLocalMessageInput,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .insert(messages)
      .values(input)
      .onConflictDoUpdate({
        target: messages.clientId,
        set: {
          id: input.id ?? null,
          conversationId: input.conversationId,
          senderId: input.senderId,
          content: input.content,
          contentType: input.contentType,
          status: input.status,
          clientCreatedAt: input.clientCreatedAt,
          serverCreatedAt: input.serverCreatedAt ?? null,
        },
      });
  }

  async insertPending(
    input: UpsertLocalMessageInput,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor.insert(messages).values(input);
  }

  async markSending(
    input: {
      clientId: string;
      attemptCount: number;
      lastAttemptAt: string;
    },
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .update(messages)
      .set({
        status: MESSAGE_STATUS.SENDING,
        attemptCount: input.attemptCount,
        lastAttemptAt: input.lastAttemptAt,
      })
      .where(eq(messages.clientId, input.clientId));
  }

  async markTransientFailure(
    input: {
      clientId: string;
      attemptCount: number;
      lastAttemptAt: string;
      lastError: string;
    },
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .update(messages)
      .set({
        status: MESSAGE_STATUS.PENDING,
        attemptCount: input.attemptCount,
        lastAttemptAt: input.lastAttemptAt,
        lastError: input.lastError,
      })
      .where(eq(messages.clientId, input.clientId));
  }

  async markSent(
    input: {
      clientId: string;
      id: string;
      serverCreatedAt: string;
    },
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .update(messages)
      .set({
        id: input.id,
        status: MESSAGE_STATUS.SENT,
        serverCreatedAt: input.serverCreatedAt,
        lastError: null,
      })
      .where(eq(messages.clientId, input.clientId));
  }

  async markFailed(
    clientId: string,
    lastError?: string,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .update(messages)
      .set({
        status: MESSAGE_STATUS.FAILED,
        ...(lastError !== undefined ? { lastError } : {}),
      })
      .where(eq(messages.clientId, clientId));
  }

  async resetExhaustedCycles(executor: DbExecutor = db): Promise<void> {
    await executor
      .update(messages)
      .set({
        attemptCount: 0,
        lastError: null,
      })
      .where(
        and(
          eq(messages.status, MESSAGE_STATUS.PENDING),
          gte(messages.attemptCount, MAX_ATTEMPTS_PER_CYCLE),
        ),
      );
  }

  messagesQuery(conversationId: string) {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.clientCreatedAt));
  }
}

export const messageRepository = new MessageRepository();

export { MESSAGE_STATUS };
