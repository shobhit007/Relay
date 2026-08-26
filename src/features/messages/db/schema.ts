import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const MESSAGE_STATUS = {
  PENDING: 'PENDING',
  SENDING: 'SENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const;

export type MessageStatus =
  (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];

/**
 * Local messages for offline-first chat.
 * `client_id` is the stable local primary key; `id` is set after server ack.
 */
export const messages = sqliteTable(
  'messages',
  {
    id: text('id'),
    clientId: text('client_id').primaryKey(),
    conversationId: text('conversation_id').notNull(),
    senderId: text('sender_id').notNull(),
    content: text('content').notNull(),
    contentType: text('content_type').notNull(),
    status: text('status').notNull(),
    clientCreatedAt: text('client_created_at').notNull(),
    serverCreatedAt: text('server_created_at'),
    attemptCount: integer('attempt_count').notNull().default(0),
    lastAttemptAt: text('last_attempt_at'),
    lastError: text('last_error'),
  },
  (table) => [uniqueIndex('messages_id_unique').on(table.id)],
);

export type LocalMessage = typeof messages.$inferSelect;
export type UpsertLocalMessageInput = typeof messages.$inferInsert;
