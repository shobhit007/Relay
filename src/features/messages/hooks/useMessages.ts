import { useEffect } from 'react';
import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';

import { db } from '@/core/db/client';
import { useUser } from '@features/user';

import { messages, type LocalMessage } from '../db/schema';
import { messageService } from '../services/message.service';
import { setActiveChat } from '../sync/active-chat-bridge';

export function useMessages(conversationId: string | undefined): LocalMessage[] {
  const { currentUserId } = useUser();

  const { data } = useLiveQuery(
    db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId ?? ''))
      .orderBy(messages.clientCreatedAt),
    [conversationId],
  );

  useEffect(() => {
    if (!conversationId || !currentUserId) {
      setActiveChat(null);
      return;
    }

    setActiveChat({
      localConversationId: conversationId,
      currentUserId,
    });

    void messageService
      .syncConversationMessages({
        localConversationId: conversationId,
        currentUserId,
      })
      .catch((error) => {
        console.warn('Message sync failed', error);
      });

    return () => {
      setActiveChat(null);
    };
  }, [conversationId, currentUserId]);

  if (!conversationId) {
    return [];
  }

  return data ?? [];
}
