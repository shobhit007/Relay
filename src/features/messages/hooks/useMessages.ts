import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';

import { db } from '@/core/db/client';

import { messages, type LocalMessage } from '../db/schema';

export function useMessages(conversationId: string | undefined): LocalMessage[] {
  const { data } = useLiveQuery(
    db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId ?? ''))
      .orderBy(messages.clientCreatedAt),
    [conversationId],
  );

  if (!conversationId) {
    return [];
  }

  return data ?? [];
}
