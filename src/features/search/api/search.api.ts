import { api } from '@shared/api';

import type { SearchUser, SearchUsersResponse } from '../types/search.types';

export async function searchUsers(q: string): Promise<SearchUser[]> {
  const { data } = await api.get<SearchUsersResponse>('/users/search', {
    params: { q },
  });
  return data.users;
}
