import {
  BACKOFF_MS,
  MESSAGE_ERROR_CODE,
  PERMANENT_ERROR_CODES,
} from './constants';

export function isPermanentError(code: string): boolean {
  return PERMANENT_ERROR_CODES.has(code);
}

export function isTransientError(code: string): boolean {
  return !isPermanentError(code) && code !== MESSAGE_ERROR_CODE.ABORTED;
}

/** Backoff after a failed attempt (`attemptCount` is 1-based). */
export function backoffMsForAttempt(attemptCount: number): number {
  const index = Math.max(0, attemptCount - 1);
  return (
    BACKOFF_MS[Math.min(index, BACKOFF_MS.length - 1)] ??
    BACKOFF_MS[BACKOFF_MS.length - 1]
  );
}
