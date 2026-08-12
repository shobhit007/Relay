import { userService } from '@features/user';

import { fetchConversations } from '../api/conversations.api';
import { conversationRepository } from '../db/repository';
import type {
  ChatListItem,
  ConversationDto,
} from '../types/conversations.types';

function toIsoString(value: string | Date): string {
  if (typeof value === 'string') {
    return value;
  }
  return value.toISOString();
}

export class ConversationService {
  async syncConversations(): Promise<void> {
    const remote = await fetchConversations();
    await this.persistRemoteConversations(remote);
  }

  async persistRemoteConversations(
    remote: ConversationDto[],
  ): Promise<void> {
    const profileInputs = remote.flatMap((conversation) =>
      conversation.participants.map((participant) => ({
        id: participant.user.id,
        username: participant.user.username,
        displayName: participant.user.displayName,
        avatarUrl: participant.user.avatarUrl,
        updatedAt: toIsoString(conversation.updatedAt),
      })),
    );

    if (profileInputs.length > 0) {
      await userService.upsertUsers(profileInputs);
    }

    for (const conversation of remote) {
      await conversationRepository.upsertConversation({
        id: conversation.id,
        type: conversation.type,
        lastMessageId: null,
        lastMessagePreview: null,
        lastMessageAt: null,
        updatedAt: toIsoString(conversation.updatedAt),
      });

      for (const participant of conversation.participants) {
        await conversationRepository.upsertParticipant({
          conversationId: conversation.id,
          userId: participant.userId,
          unreadCount: 0,
          lastReadMessageId: null,
          joinedAt: toIsoString(participant.joinedAt),
        });
      }
    }
  }

  async listChatItems(currentUserId: string): Promise<ChatListItem[]> {
    return conversationRepository.listChatItems(currentUserId);
  }
}

export const conversationService = new ConversationService();
