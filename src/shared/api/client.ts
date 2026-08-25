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

const ACCESS_TOKEN_SKEW_MS = 30_000;

export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<void> | null = null;
let isFlushScheduled = false;
const refreshQueue: QueuedRequest[] = [];

function getJwtExpMs(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2 || !parts[1]) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
    const payload = JSON.parse(atob(padded)) as { exp?: unknown };

    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isAccessTokenFresh(token: string): boolean {
  const expMs = getJwtExpMs(token);
  if (expMs === null) {
    return false;
  }
  return expMs - ACCESS_TOKEN_SKEW_MS > Date.now();
}

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
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        throw new Error("Missing refresh token");
      }

      const { data } = await api.post<{
        accessToken: string;
        refreshToken?: string;
      }>("/auth/refresh", { refreshToken }, { skipAuth: true });

      await persistRefreshedTokens(data);
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

function scheduleQueueFlush(promise: Promise<void>) {
  if (isFlushScheduled) {
    return;
  }

  isFlushScheduled = true;
  void promise
    .then(async () => {
      await flushQueue(null);
    })
    .catch(async (refreshError) => {
      await deleteTokens();
      emitSessionExpired();
      await flushQueue(normalizeApiError(refreshError));
    })
    .finally(() => {
      isFlushScheduled = false;
    });
}

/**
 * Returns a usable access token, refreshing via the shared single-flight
 * path when the current token is missing expiry data, expired, or near expiry.
 */
export async function ensureValidAccessToken(): Promise<string | null> {
  const token = await getAccessToken();
  if (!token) {
    return null;
  }

  if (isAccessTokenFresh(token)) {
    return token;
  }

  try {
    await runSingleFlightRefresh();
    return await getAccessToken();
  } catch {
    await deleteTokens();
    emitSessionExpired();
    return null;
  }
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
      scheduleQueueFlush(runSingleFlightRefresh());
    });
  },
);

export default api;
