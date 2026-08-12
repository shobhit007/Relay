import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Local cache of user profiles: the logged-in user and conversation participants.
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  updatedAt: text('updated_at').notNull(),
});

export type LocalUser = typeof users.$inferSelect;
export type UpsertLocalUserInput = typeof users.$inferInsert;
