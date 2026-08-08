import { api } from '@shared/api';

import type {
  AuthTokensResponse,
  LoginInput,
  MeResponse,
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
