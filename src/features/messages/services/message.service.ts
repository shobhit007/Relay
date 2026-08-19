import { db } from '@/core/db/client';
import { conversationService } from '@features/conversations';
import { createLocalId } from '@shared/utils/id';
import {
  SOCKET_EVENTS,
  socketManager,
  type MessageAckPayload,
  type MessageErrorPayload,
  type MessageSendPayload,
} from '@shared/socket';

import { messageRepository } from '../db/repository';
import { MESSAGE_STATUS } from '../db/schema';
import { buildMessagePreview } from '../utils/message-preview';
import {
  validateIncomingMessagePayload,
  type IncomingMessagePayload,
} from '../validator/message.validator';

export type SendMessageInput = {
  currentUserId: string;
  content: string;
  conversationId?: string;
  recipientId?: string;
};

export type SendMessageResult = {
  localConversationId: string;
  clientId: string;
};

function toIsoString(value: string | Date): string {
  if (typeof value === 'string') {
    return value;
  }
  return value.toISOString();
}

export class MessageService {
  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    const content = input.content.trim();
    if (!content) {
      throw new Error('Message content is required');
    }

    let localConversationId = input.conversationId;
    let serverId: string | null = null;
    let recipientId = input.recipientId;

    if (localConversationId) {
      const existing = await conversationService.findById(localConversationId);
      if (!existing) {
        throw new Error('Conversation not found');
      }
      serverId = existing.serverId;
      if (!recipientId) {
        const peer = await conversationService.getChatPeer(input.currentUserId, {
          conversationId: localConversationId,
        });
        recipientId = peer?.id;
      }
    } else if (recipientId) {
      const ensured = await conversationService.ensureLocalDirectConversation(
        input.currentUserId,
        recipientId,
      );
      localConversationId = ensured.id;
      serverId = ensured.serverId;
    } else {
      throw new Error('conversationId or recipientId is required');
    }

    const clientId = createLocalId();
    const clientCreatedAt = new Date().toISOString();

    await db.transaction(async (tx) => {
      await messageRepository.insertPending(
        {
          id: null,
          clientId,
          conversationId: localConversationId!,
          senderId: input.currentUserId,
          content,
          contentType: 'TEXT',
          status: MESSAGE_STATUS.PENDING,
          clientCreatedAt,
          serverCreatedAt: null,
        },
        tx,
      );

      await conversationService.updateLastMessage(
        {
          conversationId: localConversationId!,
          lastMessageId: clientId,
          lastMessagePreview: buildMessagePreview(content),
          lastMessageAt: clientCreatedAt,
          updatedAt: clientCreatedAt,
        },
        tx,
      );
    });

    const payload: MessageSendPayload = {
      clientId,
      content,
      contentType: 'TEXT',
    };

    if (serverId) {
      payload.conversationId = serverId;
    } else if (recipientId) {
      payload.recipientId = recipientId;
    }

    socketManager.emit(SOCKET_EVENTS.MESSAGE_SEND, payload);

    return {
      localConversationId: localConversationId!,
      clientId,
    };
  }

  async handleIncomingMessage(
    payload: unknown,
    currentUserId: string,
  ): Promise<void> {
    const message = validateIncomingMessagePayload(payload);
    await this.persistIncomingMessage(message, currentUserId);
  }

  async handleMessageAck(payload: unknown): Promise<void> {
    if (!payload || typeof payload !== 'object') {
      return;
    }

    const data = payload as MessageAckPayload;
    const message = data.message;
    if (!message?.clientId || !message.id) {
      return;
    }

    const createdAt = toIsoString(message.createdAt);

    await db.transaction(async (tx) => {
      const local = await messageRepository.findByClientId(message.clientId, tx);
      if (!local) {
        return;
      }

      await messageRepository.markSent(
        {
          clientId: message.clientId,
          id: message.id,
          serverCreatedAt: createdAt,
        },
        tx,
      );

      const conversation = await conversationService.findById(
        local.conversationId,
        tx,
      );
      if (conversation && !conversation.serverId && message.conversationId) {
        await conversationService.setServerId(
          local.conversationId,
          message.conversationId,
          tx,
        );
      }

      await conversationService.updateLastMessage(
        {
          conversationId: local.conversationId,
          lastMessageId: message.id,
          lastMessagePreview: buildMessagePreview(message.content),
          lastMessageAt: createdAt,
          updatedAt: createdAt,
        },
        tx,
      );
    });
  }

  async handleMessageError(payload: unknown): Promise<void> {
    if (!payload || typeof payload !== 'object') {
      return;
    }

    const data = payload as MessageErrorPayload;
    if (!data.clientId) {
      return;
    }

    await messageRepository.markFailed(data.clientId);
  }

  private async persistIncomingMessage(
    message: IncomingMessagePayload,
    currentUserId: string,
  ): Promise<void> {
    await db.transaction(async (tx) => {
      const localConversationId =
        await conversationService.applyIncomingMessageSideEffects(
          {
            serverConversationId: message.conversationId,
            messageId: message.id,
            preview: buildMessagePreview(message.content),
            messageAt: message.createdAt,
            currentUserId,
            senderId: message.senderId,
          },
          tx,
        );

      if (!localConversationId) {
        console.warn(
          '[messages] Skipping inbound message; local conversation not found for server id',
          message.conversationId,
        );
        return;
      }

      await messageRepository.upsertIncoming(
        {
          id: message.id,
          clientId: message.clientId,
          conversationId: localConversationId,
          senderId: message.senderId,
          content: message.content,
          contentType: message.contentType,
          status: MESSAGE_STATUS.SENT,
          clientCreatedAt: message.createdAt,
          serverCreatedAt: message.createdAt,
        },
        tx,
      );
    });
  }
}

export const messageService = new MessageService();
