import axios from 'axios';

export type ApiErrorBody = {
  status?: string;
  code?: string;
  message?: string;
};

export class ApiError extends Error {
  readonly status?: number;
  readonly code: string;
  readonly details?: unknown;
  readonly isNetworkError: boolean;
  readonly isTimeout: boolean;

  constructor({
    message,
    status,
    code = 'UNKNOWN_ERROR',
    details,
    isNetworkError = false,
    isTimeout = false,
  }: {
    message: string;
    status?: number;
    code?: string;
    details?: unknown;
    isNetworkError?: boolean;
    isTimeout?: boolean;
  }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.isNetworkError = isNetworkError;
    this.isTimeout = isTimeout;
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return new ApiError({
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT',
        isTimeout: true,
        details: error,
      });
    }

    if (!error.response) {
      return new ApiError({
        message: 'Unable to reach the server. Check your connection.',
        code: 'NETWORK_ERROR',
        isNetworkError: true,
        details: error,
      });
    }

    const body = error.response.data as ApiErrorBody | undefined;
    const status = error.response.status;

    return new ApiError({
      message: body?.message || error.message || `Request failed with status ${status}`,
      status,
      code: body?.code || `HTTP_${status}`,
      details: body ?? error.response.data,
    });
  }

  if (error instanceof Error) {
    return new ApiError({
      message: error.message,
      code: 'UNKNOWN_ERROR',
      details: error,
    });
  }

  return new ApiError({
    message: 'An unexpected error occurred.',
    code: 'UNKNOWN_ERROR',
    details: error,
  });
}
