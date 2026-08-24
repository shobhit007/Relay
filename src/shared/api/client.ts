import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { emitSessionExpired } from "@/core/session/session-bridge";
import { emitAccessTokenRefreshed } from "@/core/session/token-bridge";
import {
  deleteTokens,
  getAccessToken,
  getRefreshToken,
  saveAccessToken,
  saveTokens,
} from "@/core/storage/secure-store";
import { env } from "@core/env";

import { normalizeApiError } from "./errors";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
    _retry?: boolean;
  }
}

type QueuedRequest = {
  config: InternalAxiosRequestConfig;
  resolve: (value: AxiosResponse) => void;
  reject: (reason?: unknown) => void;
};

export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
const refreshQueue: QueuedRequest[] = [];

async function persistRefreshedTokens(data: {
  accessToken: string;
  refreshToken?: string;
}) {
  if (data.refreshToken) {
    await saveTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
  } else {
    await saveAccessToken(data.accessToken);
  }

  emitAccessTokenRefreshed(data.accessToken);
}

async function runSingleFlightRefresh() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error("Missing refresh token");
  }

  const { data } = await api.post<{
    accessToken: string;
    refreshToken?: string;
  }>("/auth/refresh", { refreshToken }, { skipAuth: true });

  await persistRefreshedTokens(data);
}

async function flushQueue(error: unknown | null) {
  const pending = refreshQueue.splice(0, refreshQueue.length);

  if (error) {
    for (const item of pending) {
      item.reject(error);
    }
    return;
  }

  for (const item of pending) {
    try {
      item.config._retry = true;
      const accessToken = await getAccessToken();
      if (accessToken) {
        item.config.headers.Authorization = `Bearer ${accessToken}`;
      }
      const response = await api.request(item.config);
      item.resolve(response);
    } catch (retryError) {
      item.reject(normalizeApiError(retryError));
    }
  }
}

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
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
  async (error: AxiosError) => {
    const config = error.config;

    if (
      !config ||
      config.skipAuth ||
      config._retry ||
      error.response?.status !== 401
    ) {
      return Promise.reject(normalizeApiError(error));
    }

    return new Promise<AxiosResponse>((resolve, reject) => {
      refreshQueue.push({ config, resolve, reject });

      if (isRefreshing) {
        return;
      }

      isRefreshing = true;

      void runSingleFlightRefresh()
        .then(async () => {
          await flushQueue(null);
        })
        .catch(async (refreshError) => {
          await deleteTokens();
          emitSessionExpired();
          await flushQueue(normalizeApiError(refreshError));
        })
        .finally(() => {
          isRefreshing = false;
        });
    });
  },
);

export default api;
