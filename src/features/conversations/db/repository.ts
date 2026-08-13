import { and, desc, eq, ne, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import { db } from '@/core/db/client';
import { users } from '@features/user';

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
  async upsertConversation(
    input: UpsertLocalConversationInput,
  ): Promise<void> {
    await db
      .insert(conversations)
      .values(input)
      .onConflictDoUpdate({
        target: conversations.id,
        set: {
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
