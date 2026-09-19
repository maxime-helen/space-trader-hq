import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MAX_PAGE_LIMIT } from '@/shared/api/types';

import { buildAgent, buildMarketTradeGood, buildShip, TEST_SYSTEM_SYMBOL, TEST_WAYPOINT_SYMBOL } from './fixtures';
import {
  apiUrl,
  createRequestCounter,
  failThenSucceed,
  mockGet,
  rateLimitResponse,
  unauthorizedResponse,
} from './handlers';
import { setupApiMocks } from './server';
import { fakeClock, settle } from './test-support';

const server = setupApiMocks();

type ClientModule = typeof import('@/shared/api/client');
type ErrorsModule = typeof import('@/shared/api/errors');

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
  vi.useRealTimers();
});

describe('a typed request through the whole stack', () => {
  it('GET / returns the server status and takes a rate-limit slot', async () => {
    const status = api.unwrap(await settle(api.apiClient.GET('/')));

    expect(status.version).toBe('v2.3.0');
    expect(status.serverResets.next).toBe('2026-09-27T00:00:00.000Z');
    expect(clock.sleeps()).toEqual([]);
  });

  it('throttles a burst of typed calls to the sustained rate', async () => {
    await settle(Promise.all(Array.from({ length: 5 }, () => api.apiClient.GET('/'))));

    expect(clock.sleeps()).toEqual([500, 1000, 1500]);
  });

  it('sends the token from the seam on a real request', async () => {
    api.setTokenSource(() => 'jwt-from-session-store');
    const seen: (string | null)[] = [];
    server.use(
      mockGet('/my/agent', ({ request }) => {
        seen.push(request.headers.get('Authorization'));
        return { data: buildAgent() };
      }),
    );

    await api.apiClient.GET('/my/agent');

    expect(seen).toEqual(['Bearer jwt-from-session-store']);
  });

  it('retries a real 429 and then succeeds', async () => {
    server.use(failThenSucceed('/my/agent', 1, () => rateLimitResponse(2), { data: buildAgent({ symbol: 'LATE' }) }));

    const result = api.unwrap(await settle(api.apiClient.GET('/my/agent')));

    expect(clock.sleeps()).toEqual([2000]);
    expect(result.data.symbol).toBe('LATE');
  });

  it('falls back to a fixed delay when the 429 carries no Retry-After header', async () => {
    server.use(
      failThenSucceed('/my/agent', 1, () => rateLimitResponse(2, { retryAfterHeader: false }), { data: buildAgent() }),
    );

    await settle(api.apiClient.GET('/my/agent'));

    expect(clock.sleeps()).toEqual([1000]);
  });

  it('expires the session on a real 401', async () => {
    const expire = vi.fn();
    api.setSessionExpiryHandler(expire);
    server.use(mockGet('/my/agent', () => unauthorizedResponse()));

    await expect(api.apiClient.GET('/my/agent')).rejects.toSatisfy(
      (error: unknown) => errors.isApiError(error) && error.status === 401,
    );
    expect(expire).toHaveBeenCalledExactlyOnceWith('unauthorized');
  });
});

describe('default handlers', () => {
  it('serve a paginated fleet', async () => {
    const page = api.unwrap(
      await api.apiClient.GET('/my/ships', { params: { query: { page: 1, limit: MAX_PAGE_LIMIT } } }),
    );

    expect(page.data).toHaveLength(2);
    // `limit` is capped at 20 upstream: never "fetch all ships".
    expect(MAX_PAGE_LIMIT).toBe(20);
    expect(page.meta).toEqual({ total: 2, page: 1, limit: MAX_PAGE_LIMIT });
  });

  it('echo path parameters back, so detail pages get the entity they asked for', async () => {
    const ship = api.unwrap(
      await api.apiClient.GET('/my/ships/{shipSymbol}', { params: { path: { shipSymbol: 'ALICE-9' } } }),
    );
    const waypoint = api.unwrap(
      await api.apiClient.GET('/systems/{systemSymbol}/waypoints/{waypointSymbol}', {
        params: { path: { systemSymbol: TEST_SYSTEM_SYMBOL, waypointSymbol: TEST_WAYPOINT_SYMBOL } },
      }),
    );

    expect(ship.data.symbol).toBe('ALICE-9');
    expect(waypoint.data.symbol).toBe(TEST_WAYPOINT_SYMBOL);
  });

  it('serve a market in its catalogue state, with no live prices', async () => {
    const market = api.unwrap(
      await api.apiClient.GET('/systems/{systemSymbol}/waypoints/{waypointSymbol}/market', {
        params: { path: { systemSymbol: TEST_SYSTEM_SYMBOL, waypointSymbol: TEST_WAYPOINT_SYMBOL } },
      }),
    );

    expect(market.data.imports).not.toHaveLength(0);
    // No ship at the waypoint means no tradeGoods at all, which is not the same as an empty list.
    expect(market.data.tradeGoods).toBeUndefined();
  });
});

describe('fixture factories', () => {
  it('deep-merge overrides instead of replacing whole branches', () => {
    const ship = buildShip({ nav: { status: 'IN_TRANSIT' } });

    expect(ship.nav.status).toBe('IN_TRANSIT');
    // Everything else about nav survives the override.
    expect(ship.nav.waypointSymbol).toBe(TEST_WAYPOINT_SYMBOL);
    expect(ship.nav.route.destination.symbol).toBe(TEST_WAYPOINT_SYMBOL);
    expect(ship.frame.symbol).toBe('FRAME_FRIGATE');
  });

  it('replace arrays wholesale, because merging them by index is never what a test means', () => {
    const market = buildShip({ cargo: { units: 3, inventory: [] } });
    expect(market.cargo.units).toBe(3);
    expect(buildMarketTradeGood({ supply: 'SCARCE' }).purchasePrice).toBe(92);
  });

  it('build independent objects', () => {
    const first = buildShip();
    const second = buildShip({ symbol: 'OTHER' });
    expect(first.symbol).not.toBe(second.symbol);
    expect(first.nav).not.toBe(second.nav);
  });
});

describe('createRequestCounter', () => {
  it('counts requests without answering them, for "no extra GET" assertions', async () => {
    const counter = createRequestCounter();
    server.use(counter.handler);

    await api.apiClient.GET('/');
    await api.apiClient.GET('/my/agent');

    expect(counter.count()).toBe(2);
  });
});

describe('apiUrl', () => {
  it('translates OpenAPI path templates into MSW path patterns', () => {
    expect(apiUrl('/systems/{systemSymbol}/waypoints/{waypointSymbol}')).toBe(
      'https://api.spacetraders.io/v2/systems/:systemSymbol/waypoints/:waypointSymbol',
    );
  });
});
