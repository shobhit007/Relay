import { useEffect } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';

import { useUser } from '@features/user';

import { conversationRepository } from '../db/repository';
import { conversationService } from '../services/conversation.service';
import type { ChatListItem } from '../types/conversations.types';

function mapRowsToChatList(
  rows: Array<{
    conversationId: string;
    lastMessageId: string | null;
    lastMessagePreview: string | null;
    lastMessageAt: string | null;
    unreadCount: number;
    userId: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  }>,
): ChatListItem[] {
  return rows.map((row) => ({
    conversationId: row.conversationId,
    user: {
      id: row.userId,
      displayName: row.displayName,
      username: row.username,
      avatarUrl: row.avatarUrl,
    },
    lastMessage:
      row.lastMessageId && row.lastMessagePreview && row.lastMessageAt
        ? {
            id: row.lastMessageId,
            preview: row.lastMessagePreview,
            createdAt: row.lastMessageAt,
          }
        : null,
    unreadCount: row.unreadCount,
  }));
}

export function useChatList(): ChatListItem[] {
  const { currentUserId } = useUser();

  const { data } = useLiveQuery(
    conversationRepository.chatListQuery(currentUserId ?? ''),
    [currentUserId],
  );

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    void conversationService.syncConversations().catch((error) => {
      console.warn('Conversation sync failed', error);
    });
  }, [currentUserId]);

  if (!currentUserId) {
    return [];
  }

  return mapRowsToChatList(data);
}
