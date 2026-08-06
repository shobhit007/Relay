import axios, { type InternalAxiosRequestConfig } from 'axios';

import { getAccessToken } from '@/core/storage/secure-store';

import { normalizeApiError } from './errors';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

type InternalConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean;
};

api.interceptors.request.use(
  async (config: InternalConfig) => {
    if (config.skipAuth) {
      return config;
    }

    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(normalizeApiError(error)),
);

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error)),
);

export default api;
