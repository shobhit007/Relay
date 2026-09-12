import { api } from '@shared/api';

export type RemoteMessageDto = {
  id: string;
  clientId: string;
  conversationId: string;
  senderId: string;
  content: string;
  contentType: string;
  createdAt: string;
};

type MessagesResponse = {
  messages: RemoteMessageDto[];
};

export async function fetchConversationMessages(input: {
  serverConversationId: string;
  after?: string;
  limit?: number;
}): Promise<RemoteMessageDto[]> {
  const params: Record<string, string | number> = {};
  if (input.after) {
    params.after = input.after;
  }
  if (input.limit !== undefined) {
    params.limit = input.limit;
  }

  const { data } = await api.get<MessagesResponse>(
    `/conversations/${input.serverConversationId}/messages`,
    { params },
  );

  return data.messages;
}
