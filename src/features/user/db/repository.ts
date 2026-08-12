import { eq } from 'drizzle-orm';

import { db } from '@/core/db/client';

import { users, type LocalUser, type UpsertLocalUserInput } from './schema';

export class UserRepository {
  async upsert(input: UpsertLocalUserInput): Promise<LocalUser> {
    await db
      .insert(users)
      .values(input)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          username: input.username,
          displayName: input.displayName,
          avatarUrl: input.avatarUrl ?? null,
          updatedAt: input.updatedAt,
        },
      });

    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.id, input.id))
      .limit(1);

    if (!row) {
      throw new Error('Failed to persist local user');
    }

    return row;
  }

  async findById(id: string): Promise<LocalUser | null> {
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return row ?? null;
  }

  async deleteAll(): Promise<void> {
    await db.delete(users);
  }
}

export const userRepository = new UserRepository();
