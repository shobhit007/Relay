import axios, { type InternalAxiosRequestConfig } from "axios";

import { normalizeApiError } from "./errors";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

type InternalConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean;
};

type TokenGetter = () => string | null | Promise<string | null>;

let getAccessToken: TokenGetter | null = null;

/** Register a token provider used by the request interceptor (e.g. from auth storage). */
export function setAccessTokenGetter(getter: TokenGetter | null) {
  getAccessToken = getter;
}

api.interceptors.request.use(
  async (config: InternalConfig) => {
    if (config.skipAuth) {
      return config;
    }

    if (getAccessToken) {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
