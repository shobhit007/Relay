import { and, desc, eq, ne, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import { db } from '@/core/db/client';
import type { DbExecutor } from '@/core/db/types';
import { users } from '@features/user';
import { createLocalId } from '@shared/utils/id';

import type { ChatListItem } from '../types/conversations.types';
import {
  conversationParticipants,
  conversations,
  type UpsertLocalConversationInput,
  type UpsertLocalConversationParticipantInput,
} from './schema';

const myParticipant = alias(conversationParticipants, 'my_participant');
const otherParticipant = alias(conversationParticipants, 'other_participant');

export class ConversationRepository {
  async findByServerId(serverId: string, executor: DbExecutor = db) {
    const [row] = await executor
      .select()
      .from(conversations)
      .where(eq(conversations.serverId, serverId))
      .limit(1);

    return row ?? null;
  }

  async updateLastMessage(
    input: {
      conversationId: string;
      lastMessageId: string;
      lastMessagePreview: string;
      lastMessageAt: string;
      updatedAt: string;
    },
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .update(conversations)
      .set({
        lastMessageId: input.lastMessageId,
        lastMessagePreview: input.lastMessagePreview,
        lastMessageAt: input.lastMessageAt,
        updatedAt: input.updatedAt,
      })
      .where(eq(conversations.id, input.conversationId));
  }

  async incrementUnread(
    conversationId: string,
    userId: string,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .update(conversationParticipants)
      .set({
        unreadCount: sql`${conversationParticipants.unreadCount} + 1`,
      })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId),
        ),
      );
  }

  async applyIncomingMessageSideEffects(
    input: {
      serverConversationId: string;
      messageId: string;
      preview: string;
      messageAt: string;
      currentUserId: string;
      senderId: string;
    },
    executor: DbExecutor = db,
  ): Promise<string | null> {
    const conversation = await this.findByServerId(
      input.serverConversationId,
      executor,
    );
    if (!conversation) {
      return null;
    }

    await this.updateLastMessage(
      {
        conversationId: conversation.id,
        lastMessageId: input.messageId,
        lastMessagePreview: input.preview,
        lastMessageAt: input.messageAt,
        updatedAt: input.messageAt,
      },
      executor,
    );

    if (input.senderId !== input.currentUserId) {
      await this.incrementUnread(
        conversation.id,
        input.currentUserId,
        executor,
      );
    }

    return conversation.id;
  }

  async upsertSyncedConversation(input: {
    serverId: string;
    type: string;
    updatedAt: string;
  }): Promise<string> {
    const existing = await this.findByServerId(input.serverId);

    if (existing) {
      await db
        .update(conversations)
        .set({
          type: input.type,
          updatedAt: input.updatedAt,
          serverId: input.serverId,
        })
        .where(eq(conversations.id, existing.id));

      return existing.id;
    }

    const localId = createLocalId();

    await db.insert(conversations).values({
      id: localId,
      serverId: input.serverId,
      type: input.type,
      lastMessageId: null,
      lastMessagePreview: null,
      lastMessageAt: null,
      updatedAt: input.updatedAt,
    });

    return localId;
  }

  async upsertConversation(
    input: UpsertLocalConversationInput,
  ): Promise<void> {
    await db
      .insert(conversations)
      .values(input)
      .onConflictDoUpdate({
        target: conversations.id,
        set: {
          serverId: input.serverId ?? null,
          type: input.type,
          lastMessageId: input.lastMessageId ?? null,
          lastMessagePreview: input.lastMessagePreview ?? null,
          lastMessageAt: input.lastMessageAt ?? null,
          updatedAt: input.updatedAt,
        },
      });
  }

  async upsertParticipant(
    input: UpsertLocalConversationParticipantInput,
  ): Promise<void> {
    await db
      .insert(conversationParticipants)
      .values(input)
      .onConflictDoUpdate({
        target: [
          conversationParticipants.conversationId,
          conversationParticipants.userId,
        ],
        set: {
          unreadCount: input.unreadCount,
          lastReadMessageId: input.lastReadMessageId ?? null,
          joinedAt: input.joinedAt,
        },
      });
  }

  async findDirectConversationId(
    currentUserId: string,
    otherUserId: string,
  ): Promise<string | null> {
    const [row] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .innerJoin(
        myParticipant,
        and(
          eq(myParticipant.conversationId, conversations.id),
          eq(myParticipant.userId, currentUserId),
        ),
      )
      .innerJoin(
        otherParticipant,
        and(
          eq(otherParticipant.conversationId, conversations.id),
          eq(otherParticipant.userId, otherUserId),
        ),
      )
      .where(eq(conversations.type, 'DIRECT'))
      .limit(1);

    return row?.id ?? null;
  }

  async findById(id: string, executor: DbExecutor = db) {
    const [row] = await executor
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);

    return row ?? null;
  }

  async ensureLocalDirectConversation(
    currentUserId: string,
    recipientId: string,
  ): Promise<{ id: string; serverId: string | null }> {
    const existingId = await this.findDirectConversationId(
      currentUserId,
      recipientId,
    );

    if (existingId) {
      const existing = await this.findById(existingId);
      return {
        id: existingId,
        serverId: existing?.serverId ?? null,
      };
    }

    const localId = createLocalId();
    const now = new Date().toISOString();

    await db.insert(conversations).values({
      id: localId,
      serverId: null,
      type: 'DIRECT',
      lastMessageId: null,
      lastMessagePreview: null,
      lastMessageAt: null,
      updatedAt: now,
    });

    await this.upsertParticipant({
      conversationId: localId,
      userId: currentUserId,
      unreadCount: 0,
      lastReadMessageId: null,
      joinedAt: now,
    });

    await this.upsertParticipant({
      conversationId: localId,
      userId: recipientId,
      unreadCount: 0,
      lastReadMessageId: null,
      joinedAt: now,
    });

    return { id: localId, serverId: null };
  }

  async setServerId(
    localId: string,
    serverId: string,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .update(conversations)
      .set({ serverId })
      .where(eq(conversations.id, localId));
  }

  async findOtherParticipantUser(
    conversationId: string,
    currentUserId: string,
  ) {
    const [row] = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(users.id, conversationParticipants.userId))
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          ne(conversationParticipants.userId, currentUserId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async listChatItems(currentUserId: string): Promise<ChatListItem[]> {
    const rows = await db
      .select({
        conversationId: conversations.id,
        lastMessageId: conversations.lastMessageId,
        lastMessagePreview: conversations.lastMessagePreview,
        lastMessageAt: conversations.lastMessageAt,
        unreadCount: myParticipant.unreadCount,
        userId: users.id,
        displayName: users.displayName,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(conversations)
      .innerJoin(
        myParticipant,
        and(
          eq(myParticipant.conversationId, conversations.id),
          eq(myParticipant.userId, currentUserId),
        ),
      )
      .innerJoin(
        otherParticipant,
        and(
          eq(otherParticipant.conversationId, conversations.id),
          ne(otherParticipant.userId, currentUserId),
        ),
      )
      .innerJoin(users, eq(users.id, otherParticipant.userId))
      .orderBy(
        sql`${conversations.lastMessageAt} IS NULL`,
        desc(conversations.lastMessageAt),
      );

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

  chatListQuery(currentUserId: string) {
    return db
      .select({
        conversationId: conversations.id,
        lastMessageId: conversations.lastMessageId,
        lastMessagePreview: conversations.lastMessagePreview,
        lastMessageAt: conversations.lastMessageAt,
        unreadCount: myParticipant.unreadCount,
        userId: users.id,
        displayName: users.displayName,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(conversations)
      .innerJoin(
        myParticipant,
        and(
          eq(myParticipant.conversationId, conversations.id),
          eq(myParticipant.userId, currentUserId),
        ),
      )
      .innerJoin(
        otherParticipant,
        and(
          eq(otherParticipant.conversationId, conversations.id),
          ne(otherParticipant.userId, currentUserId),
        ),
      )
      .innerJoin(users, eq(users.id, otherParticipant.userId))
      .orderBy(
        sql`${conversations.lastMessageAt} IS NULL`,
        desc(conversations.lastMessageAt),
      );
  }
}

export const conversationRepository = new ConversationRepository();
