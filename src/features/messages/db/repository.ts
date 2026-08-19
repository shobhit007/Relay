import { eq } from 'drizzle-orm';

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
}

export const messageRepository = new MessageRepository();

export { MESSAGE_STATUS };
