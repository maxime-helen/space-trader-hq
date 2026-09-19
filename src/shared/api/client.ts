import createClient, { type Client, type Middleware } from 'openapi-fetch';

import {
  ApiError,
  HTTP_TOO_MANY_REQUESTS,
  HTTP_UNAUTHORIZED,
  retryAfterMs,
  toApiError,
  toNetworkError,
} from './errors';
import { createRateLimiter, sleep } from './rate-limiter';
import type { paths } from './types';

export const API_BASE_URL = 'https://api.spacetraders.io/v2';

type TokenSource = () => string | null | undefined;

const NO_TOKEN: TokenSource = () => undefined;
let tokenSource: TokenSource = NO_TOKEN;

export const setTokenSource = (source: TokenSource): void => {
  tokenSource = source;
};

// A 401 means token expired
export type SessionExpiryReason = 'unauthorized';
type SessionExpiryHandler = (reason: SessionExpiryReason) => void;

const IGNORE_EXPIRY: SessionExpiryHandler = () => undefined;
let sessionExpiryHandler: SessionExpiryHandler = IGNORE_EXPIRY;

export const setSessionExpiryHandler = (handler: SessionExpiryHandler): void => {
  sessionExpiryHandler = handler;
};

// Normalize, notify the session on a 401, and throw. The single place a request fails.
const failWith = async (response: Response): Promise<never> => {
  const error = await toApiError(response);
  if (error.status === HTTP_UNAUTHORIZED) sessionExpiryHandler('unauthorized');
  throw error;
};

// Middleware 1: auth

// A request that already carries its own header keeps it: validating a candidate token must not
// be silently rewritten to the session's.
const authMiddleware: Middleware = {
  onRequest: ({ request }) => {
    if (request.headers.has('Authorization')) return undefined;
    const token = tokenSource();
    if (token === null || token === undefined || token.length === 0) return undefined;
    request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },
};

// Middleware 2: rate limit

const MAX_RETRIES = 3;
const FALLBACK_DELAY_MS = 1000;
const MAX_DELAY_MS = 10_000;

const createRateLimitMiddleware = (): Middleware => {
  const limiter = createRateLimiter();

  // A Request is disturbed once it has been sent, so an unsent copy is kept for retries, and
  // cloned again for each attempt so the body can be read more than once. The map is weak: when
  // the original request is garbage collected, its copy goes with it.
  const retryTemplates = new WeakMap<Request, Request>();

  const delayFor = (response: Response): number =>
    Math.min(retryAfterMs(response.headers) ?? FALLBACK_DELAY_MS, MAX_DELAY_MS);

  return {
    onRequest: async ({ request }) => {
      retryTemplates.set(request, request.clone());
      await limiter.waitForSlot();
    },

    onResponse: async ({ request, response, options }) => {
      if (response.status !== HTTP_TOO_MANY_REQUESTS) return undefined;

      const template = retryTemplates.get(request) ?? request;
      retryTemplates.delete(request);
      let current = response;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
        await sleep(delayFor(current));
        await limiter.waitForSlot();
        // `onError` only covers the first fetch; a retry that never reaches the server is
        // normalized here so callers still see one error type.
        try {
          current = await options.fetch(template.clone());
        } catch {
          throw toNetworkError();
        }
        if (current.status !== HTTP_TOO_MANY_REQUESTS) break;
      }

      if (!current.ok) return failWith(current);
      return current;
    },
  };
};

// Middleware 3: errors

// Normalizes `{ error: { message, code, data } }` into `ApiError` and throws it, and turns a 401
// into a session expiry. 429s are left alone: the rate-limit middleware retries them first.
const errorMiddleware: Middleware = {
  onResponse: async ({ response }) => {
    if (response.ok || response.status === HTTP_TOO_MANY_REQUESTS) return undefined;
    return failWith(response);
  },

  // A transport failure (offline, DNS, abort) never reaches `onResponse`; normalize it here so
  // callers only ever see one error type.
  onError: () => toNetworkError(),
};

// The client

export const apiClient: Client<paths> = createClient<paths>({
  baseUrl: API_BASE_URL,
  headers: { Accept: 'application/json' },
  fetch: (request: Request) => globalThis.fetch(request),
});

apiClient.use(authMiddleware, createRateLimitMiddleware(), errorMiddleware);

// Unwraps openapi-fetch's `{ data, error, response }` envelope into the response body. Failures
// were already rejected by the error middleware, so reaching here with no data means an empty 2xx
// body, which no endpoint this app calls is allowed to return.
export const unwrap = <T>(result: { data?: T | undefined; response: Response }): T => {
  if (result.data === undefined) {
    throw new ApiError({ status: result.response.status });
  }
  return result.data;
};
