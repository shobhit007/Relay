import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  lastMessageId: text('last_message_id'),
  lastMessagePreview: text('last_message_preview'),
  lastMessageAt: text('last_message_at'),
  updatedAt: text('updated_at').notNull(),
});

export const conversationParticipants = sqliteTable(
  'conversation_participants',
  {
    conversationId: text('conversation_id').notNull(),
    userId: text('user_id').notNull(),
    unreadCount: integer('unread_count').notNull().default(0),
    lastReadMessageId: text('last_read_message_id'),
    joinedAt: text('joined_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.userId] }),
  ],
);

export type LocalConversation = typeof conversations.$inferSelect;
export type UpsertLocalConversationInput = typeof conversations.$inferInsert;
export type LocalConversationParticipant =
  typeof conversationParticipants.$inferSelect;
export type UpsertLocalConversationParticipantInput =
  typeof conversationParticipants.$inferInsert;
