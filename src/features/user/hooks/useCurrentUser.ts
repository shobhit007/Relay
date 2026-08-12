import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';

import { db } from '@/core/db/client';

import { useUser } from '../context/UserContext';
import { users, type LocalUser } from '../db/schema';

export function useCurrentUser(): LocalUser | null {
  const { currentUserId } = useUser();

  const { data } = useLiveQuery(
    db
      .select()
      .from(users)
      .where(eq(users.id, currentUserId ?? ''))
      .limit(1),
    [currentUserId],
  );

  if (!currentUserId) {
    return null;
  }

  return data[0] ?? null;
}
