import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildAgent, buildErrorBody, buildRateLimitBody } from './fixtures';
import { fakeClock, settle } from './test-support';

const jsonResponse = (body: unknown, init: { status?: number; headers?: Record<string, string> } = {}): Response =>
  new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });

const scriptedFetch = (
  ...responses: (Response | (() => Response))[]
): { fetch: (request: Request) => Promise<Response>; requests: Request[] } => {
  const requests: Request[] = [];
  let index = 0;
  return {
    requests,
    fetch: (request) => {
      requests.push(request);
      const next = responses[Math.min(index, responses.length - 1)];
      index += 1;
      if (next === undefined) throw new Error('scriptedFetch ran out of responses');
      return Promise.resolve(typeof next === 'function' ? next() : next);
    },
  };
};

type ClientModule = typeof import('@/shared/api/client');
type ErrorsModule = typeof import('@/shared/api/errors');

type Harness = {
  client: ClientModule['apiClient'];
  requests: Request[];
};

// The shared client looks `fetch` up on the global per request, so a scripted one can stand in.
const harness = (responses: (Response | (() => Response))[]): Harness => {
  const scripted = scriptedFetch(...responses);
  vi.spyOn(globalThis, 'fetch').mockImplementation(scripted.fetch as typeof fetch);
  return { client: api.apiClient, requests: scripted.requests };
};

let clock: ReturnType<typeof fakeClock>;
let api: ClientModule;
let errors: ErrorsModule;

// A fresh client per test: the shared one carries its rate-limit slot from one test to the next.
beforeEach(async () => {
  clock = fakeClock();
  vi.resetModules();
  api = await import('@/shared/api/client');
  errors = await import('@/shared/api/errors');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('auth middleware', () => {
  it('reads the token at request time, not at client creation', async () => {
    const { client, requests } = harness([
      jsonResponse({ data: buildAgent() }),
      jsonResponse({ data: buildAgent() }),
      jsonResponse({ data: buildAgent() }),
    ]);

    // The client already exists; the auth module wires the seam afterwards.
    await settle(
      (async () => {
        await client.GET('/my/agent');
        api.setTokenSource(() => 'token-one');
        await client.GET('/my/agent');
        api.setTokenSource(() => 'token-two');
        await client.GET('/my/agent');
      })(),
    );

    expect(requests.map((request) => request.headers.get('Authorization'))).toEqual([
      null,
      'Bearer token-one',
      'Bearer token-two',
    ]);
  });

  it('leaves a header the caller set alone, so a candidate token is sent as is', async () => {
    api.setTokenSource(() => 'session-token');
    const { client, requests } = harness([jsonResponse({ data: buildAgent() })]);

    await settle(client.GET('/my/agent', { headers: { Authorization: 'Bearer candidate-token' } }));

    expect(requests[0]?.headers.get('Authorization')).toBe('Bearer candidate-token');
  });
});

describe('rate-limit middleware', () => {
  it('puts every request through the limiter, so a burst is throttled to the sustained rate', async () => {
    const { client } = harness([() => jsonResponse({ data: buildAgent() })]);

    await settle(
      (async () => {
        for (let i = 0; i < 5; i += 1) await client.GET('/my/agent');
      })(),
    );

    // Burst of 2 free, then one 500 ms refill each for requests 3, 4 and 5.
    expect(clock.sleeps()).toEqual([500, 500, 500]);
  });

  it('retries a 429 after the delay hinted by Retry-After', async () => {
    const { client, requests } = harness([
      jsonResponse(buildRateLimitBody(2), { status: 429, headers: { 'Retry-After': '2' } }),
      jsonResponse({ data: buildAgent({ symbol: 'RETRIED' }) }),
    ]);

    const result = await settle(client.GET('/my/agent'));

    expect(clock.sleeps()).toEqual([2000]);
    expect(requests).toHaveLength(2);
    expect(api.unwrap(result).data.symbol).toBe('RETRIED');
  });

  it('gives up after three retries and rejects with a rate-limit error', async () => {
    const { client, requests } = harness([() => jsonResponse(buildRateLimitBody(1), { status: 429 })]);

    await expect(settle(client.GET('/my/agent'))).rejects.toSatisfy(
      (error: unknown) => errors.isApiError(error) && error.status === 429,
    );
    // The original attempt plus three retries.
    expect(requests).toHaveLength(4);
  });

  it('turns a transport failure during a retry into a network ApiError too', async () => {
    const { client } = harness([
      jsonResponse(buildRateLimitBody(1), { status: 429 }),
      () => {
        throw new TypeError('fetch failed');
      },
    ]);

    await expect(settle(client.GET('/my/agent'))).rejects.toSatisfy(
      (error: unknown) => errors.isApiError(error) && error.kind === 'network' && error.status === 0,
    );
  });
});

describe('error middleware', () => {
  it('normalizes { error: { message } } and rejects with an ApiError', async () => {
    const { client } = harness([
      jsonResponse(buildErrorBody({ message: 'Ship is in transit.', code: 4214, data: { ship: 'A' } }), {
        status: 409,
      }),
    ]);

    const error: unknown = await client.GET('/my/agent').catch((caught: unknown) => caught);

    expect(errors.isApiError(error)).toBe(true);
    expect(error).toMatchObject({ status: 409, kind: 'other', message: 'Ship is in transit.' });
  });

  it('still produces a usable error when the body is not the documented shape', async () => {
    const { client } = harness([new Response('<html>502</html>', { status: 502 })]);

    await expect(client.GET('/my/agent')).rejects.toSatisfy(
      (error: unknown) => errors.isApiError(error) && error.kind === 'server',
    );
  });

  it('turns a transport failure into a network ApiError', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));

    await expect(api.apiClient.GET('/my/agent')).rejects.toSatisfy(
      (error: unknown) => errors.isApiError(error) && error.kind === 'network' && error.status === 0,
    );
  });
});

describe('401 handling', () => {
  it('notifies the session-expiry seam and rejects', async () => {
    const expire = vi.fn();
    api.setSessionExpiryHandler(expire);
    const { client } = harness([
      jsonResponse(buildErrorBody({ message: 'Token invalid.', code: 4100 }), { status: 401 }),
    ]);

    await expect(client.GET('/my/agent')).rejects.toBeInstanceOf(errors.ApiError);

    expect(expire).toHaveBeenCalledExactlyOnceWith('unauthorized');
  });
});

describe('unwrap', () => {
  it('returns the payload of a successful response', async () => {
    const { client } = harness([jsonResponse({ data: buildAgent({ symbol: 'ALICE' }) })]);

    expect(api.unwrap(await client.GET('/my/agent')).data.symbol).toBe('ALICE');
  });

  it('throws when a 2xx arrives with no body, which no endpoint here may do', () => {
    expect(() => {
      api.unwrap({ data: undefined, response: new Response(null, { status: 204 }) });
    }).toThrow(errors.ApiError);
  });
});
