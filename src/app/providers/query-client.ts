// TanStack Query defaults.
//
// Under a ~2 req/s budget the cache is the main optimization, so the defaults are tuned to spend
// as few requests as possible: no speculative refetching, no retrying an error that will never
// succeed, and stale times that match how fast each resource actually changes.

import { QueryClient } from '@tanstack/vue-query';

import { isApiError } from '@/shared/api/errors';
import { STALE_TIMES } from '@/shared/api/stale-times';

// Re-exported so the app shell and its tests keep one import site for query defaults.
export { STALE_TIMES, type StaleTimeKey } from '@/shared/api/stale-times';

const SECOND = 1000;
const MINUTE = 60 * SECOND;

// Attempts beyond the first. The rate limiter already owns 429s, so those never reach here.
export const MAX_QUERY_RETRIES = 2;

// Retry 5xx and lost connections; never retry a dead token, a 404 or a rejected request.
export const shouldRetryQuery = (failureCount: number, error: Error): boolean => {
  if (failureCount >= MAX_QUERY_RETRIES) return false;
  return isApiError(error) ? error.isRetryable : true;
};

// Exponential backoff, capped so a flapping API can't leave a spinner up for a minute.
export const queryRetryDelay = (attemptIndex: number): number => Math.min(SECOND * 2 ** attemptIndex, 10 * SECOND);

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIMES.ships,
        gcTime: 10 * MINUTE,
        retry: shouldRetryQuery,
        retryDelay: queryRetryDelay,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
