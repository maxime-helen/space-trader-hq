// Error normalization.
//
// The vendored OpenAPI document declares only 200/201 responses, so nothing about the error body
// is guaranteed by the generated types. Everything here parses defensively: the documented
// `{ error: { message } }` shape is treated as a hint, never as a contract, and any body that
// doesn't match still produces a usable ApiError.

// The four cases the app tells apart: a page shows not-found for the first, the query client
// retries the next two, and everything else surfaces as the server's own message.
type ApiErrorKind = 'not-found' | 'server' | 'network' | 'other';

export const HTTP_UNAUTHORIZED = 401;
export const HTTP_TOO_MANY_REQUESTS = 429;

const kindForStatus = (status: number): ApiErrorKind => {
  if (status === 404) return 'not-found';
  if (status >= 500) return 'server';
  return 'other';
};

// Used only when the server sent no usable message.
const NETWORK_MESSAGE = 'Could not reach the SpaceTraders API. Check your connection.';
const FALLBACK_MESSAGE = 'The SpaceTraders API returned an error without saying why.';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// The server's own message, out of `{ error: { message } }` or a bare `{ message }`. Undefined
// for anything else: strings, arrays, `null`, HTML error pages, an empty or unreadable body.
export const readErrorMessage = async (response: Response): Promise<string | undefined> => {
  let body: unknown;
  try {
    body = JSON.parse(await response.text()) as unknown;
  } catch {
    return undefined;
  }
  if (!isRecord(body)) return undefined;
  const envelope = isRecord(body.error) ? body.error : body;
  return typeof envelope.message === 'string' && envelope.message.length > 0 ? envelope.message : undefined;
};

// The 429 `Retry-After` header in milliseconds, which the API sends in delta-seconds.
export const retryAfterMs = (headers: Headers): number | undefined => {
  const header = headers.get('Retry-After')?.trim();
  if (header === undefined || header.length === 0) return undefined;
  const seconds = Number(header);
  if (!Number.isFinite(seconds) || seconds < 0) return undefined;
  return Math.round(seconds * 1000);
};

type ApiErrorInit = {
  // HTTP status, or `0` when the request never reached the server.
  status: number;
  message?: string | undefined;
  kind?: ApiErrorKind;
};

// The single error type every query, mutation and component sees.
export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;

  constructor(init: ApiErrorInit) {
    const kind = init.kind ?? kindForStatus(init.status);
    super(init.message ?? (kind === 'network' ? NETWORK_MESSAGE : FALLBACK_MESSAGE));
    this.name = 'ApiError';
    this.status = init.status;
    this.kind = kind;
  }

  // 5xx and lost connections are worth another attempt; a dead token or a 404 never is.
  get isRetryable(): boolean {
    return this.kind === 'server' || this.kind === 'network';
  }
}

export const isApiError = (value: unknown): value is ApiError => value instanceof ApiError;

// Normalize a non-OK `Response` into an `ApiError`. Consumes the body: pass a clone to keep it.
export const toApiError = async (response: Response): Promise<ApiError> =>
  new ApiError({ status: response.status, message: await readErrorMessage(response) });

// Normalize a thrown transport failure (DNS, offline, abort) into an `ApiError`. The raw message
// ("fetch failed") is noise for users, so the friendly fallback is used instead.
export const toNetworkError = (): ApiError => new ApiError({ status: 0, kind: 'network' });
