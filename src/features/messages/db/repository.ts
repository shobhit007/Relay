import { asc, eq } from 'drizzle-orm';

import { db } from '@/core/db/client';
import type { DbExecutor } from '@/core/db/types';

import {
  messages,
  MESSAGE_STATUS,
  type UpsertLocalMessageInput,
} from './schema';

export class MessageRepository {
  async findByClientId(clientId: string, executor: DbExecutor = db) {
    const [row] = await executor
      .select()
      .from(messages)
      .where(eq(messages.clientId, clientId))
      .limit(1);

    return row ?? null;
  }

  async upsertIncoming(
    input: UpsertLocalMessageInput,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .insert(messages)
      .values(input)
      .onConflictDoUpdate({
        target: messages.clientId,
        set: {
          id: input.id ?? null,
          conversationId: input.conversationId,
          senderId: input.senderId,
          content: input.content,
          contentType: input.contentType,
          status: input.status,
          clientCreatedAt: input.clientCreatedAt,
          serverCreatedAt: input.serverCreatedAt ?? null,
        },
      });
  }

  async insertPending(
    input: UpsertLocalMessageInput,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor.insert(messages).values(input);
  }

  async markSent(
    input: {
      clientId: string;
      id: string;
      serverCreatedAt: string;
    },
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .update(messages)
      .set({
        id: input.id,
        status: MESSAGE_STATUS.SENT,
        serverCreatedAt: input.serverCreatedAt,
      })
      .where(eq(messages.clientId, input.clientId));
  }

  async markFailed(clientId: string, executor: DbExecutor = db): Promise<void> {
    await executor
      .update(messages)
      .set({ status: MESSAGE_STATUS.FAILED })
      .where(eq(messages.clientId, clientId));
  }

  messagesQuery(conversationId: string) {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.clientCreatedAt));
  }
}

export const messageRepository = new MessageRepository();

export { MESSAGE_STATUS };
