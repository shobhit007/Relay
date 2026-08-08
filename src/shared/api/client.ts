import axios, { type InternalAxiosRequestConfig } from "axios";

import { getAccessToken } from "@/core/storage/secure-store";

import { normalizeApiError } from "./errors";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.6:8080";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

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
  (error) => Promise.reject(normalizeApiError(error)),
);

export default api;
