import { userService } from '@features/user';

import { fetchConversations } from '../api/conversations.api';
import { conversationRepository } from '../db/repository';
import type {
  ChatListItem,
  ChatPeerUser,
  ConversationDto,
  ResolveChatResult,
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
      const localId = await conversationRepository.upsertSyncedConversation({
        serverId: conversation.id,
        type: conversation.type,
        updatedAt: toIsoString(conversation.updatedAt),
      });

      for (const participant of conversation.participants) {
        await conversationRepository.upsertParticipant({
          conversationId: localId,
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

  async resolveChatWithUser(
    currentUserId: string,
    peer: ChatPeerUser,
  ): Promise<ResolveChatResult> {
    await userService.upsertUser({
      id: peer.id,
      username: peer.username,
      displayName: peer.displayName,
      avatarUrl: peer.avatarUrl,
      updatedAt: new Date().toISOString(),
    });

    const conversationId =
      await conversationRepository.findDirectConversationId(
        currentUserId,
        peer.id,
      );

    if (conversationId) {
      return { mode: 'existing', conversationId };
    }

    return { mode: 'temporary', userId: peer.id };
  }

  async getChatPeer(
    currentUserId: string,
    params: { conversationId?: string; userId?: string },
  ): Promise<ChatPeerUser | null> {
    if (params.conversationId) {
      return conversationRepository.findOtherParticipantUser(
        params.conversationId,
        currentUserId,
      );
    }

    if (params.userId) {
      const user = await userService.getUserById(params.userId);
      if (!user) {
        return null;
      }
      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      };
    }

    return null;
  }
}

export const conversationService = new ConversationService();
