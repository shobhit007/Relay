export type ConversationParticipantUserDto = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type ConversationParticipantDto = {
  userId: string;
  joinedAt: string;
  user: ConversationParticipantUserDto;
};

export type ConversationDto = {
  id: string;
  type: string;
  directKey: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipantDto[];
};

export type ConversationsResponse = {
  conversations: ConversationDto[];
};

export type ChatListItem = {
  conversationId: string;
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
  lastMessage: {
    id: string;
    preview: string;
    createdAt: string;
  } | null;
  unreadCount: number;
};
