import { db } from '@/core/db/client';
import { conversationService } from '@features/conversations';

import { messageRepository } from '../db/repository';
import { MESSAGE_STATUS } from '../db/schema';
import { buildMessagePreview } from '../utils/message-preview';
import {
  validateIncomingMessagePayload,
  type IncomingMessagePayload,
} from '../validator/message.validator';

export class MessageService {
  async handleIncomingMessage(
    payload: unknown,
    currentUserId: string,
  ): Promise<void> {
    const message = validateIncomingMessagePayload(payload);
    await this.persistIncomingMessage(message, currentUserId);
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
