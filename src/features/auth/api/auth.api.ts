import { api } from '@shared/api';

import type {
  AuthTokensResponse,
  LoginInput,
  MeResponse,
  RefreshSessionResponse,
  RegisterInput,
} from '../types/auth.types';

export async function login(input: LoginInput): Promise<AuthTokensResponse> {
  const { data } = await api.post<AuthTokensResponse>('/auth/login', input, {
    skipAuth: true,
  });
  return data;
}

export async function register(
  input: RegisterInput,
): Promise<AuthTokensResponse> {
  const { data } = await api.post<AuthTokensResponse>('/auth/register', input, {
    skipAuth: true,
  });
  return data;
}

export async function getMe(): Promise<MeResponse['user']> {
  const { data } = await api.get<MeResponse>('/users/me');
  return data.user;
}

export async function refreshSession(
  refreshToken: string,
): Promise<RefreshSessionResponse> {
  const { data } = await api.post<RefreshSessionResponse>(
    '/auth/refresh',
    { refreshToken },
    { skipAuth: true },
  );
  return data;
}

export async function logout(): Promise<void> {
  await api.get('/auth/logout');
}
