import { api } from '@shared/api';

import type {
  ConversationDto,
  ConversationsResponse,
} from '../types/conversations.types';

export async function fetchConversations(): Promise<ConversationDto[]> {
  const { data } = await api.get<ConversationsResponse>('/conversations');
  return data.conversations;
}
