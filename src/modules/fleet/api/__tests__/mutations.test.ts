import { QueryClient } from '@tanstack/vue-query';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fleetKeys } from '@/modules/fleet/api/keys';
import { useNavigateShip, useOrbitShip } from '@/modules/fleet/api/mutations';
import {
  buildPage,
  buildShip,
  buildShipFuel,
  buildShipNav,
  TEST_SHIP_SYMBOL,
  TEST_SYSTEM_SYMBOL,
} from '@/shared/api/__tests__/fixtures';
import { apiErrorResponse, apiUrl, createRequestCounter } from '@/shared/api/__tests__/handlers';
import { setupApiMocks } from '@/shared/api/__tests__/server';
import { recordRequestLines, WAIT, withSetup } from '@/shared/api/__tests__/test-support';
import { isApiError } from '@/shared/api/errors';
import type { Paginated, Ship } from '@/shared/api/types';

const server = setupApiMocks();

const OTHER_SHIP_SYMBOL = `${TEST_SHIP_SYMBOL}-2`;
const DESTINATION = `${TEST_SYSTEM_SYMBOL}-B2`;

const NAVIGATE_URL = `https://api.spacetraders.io/v2/my/ships/${TEST_SHIP_SYMBOL}/navigate`;

// Harness

let client: QueryClient | undefined;

const testQueryClient = (): QueryClient => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return client;
};

const mockPost = (path: Parameters<typeof apiUrl>[0], resolve: () => unknown) =>
  http.post(apiUrl(path), () => {
    const result = resolve();
    return result instanceof Response ? result : HttpResponse.json(result as Record<string, unknown>);
  });

const settle = async (): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, 250);
  });
};

const otherShip = (): Ship => buildShip({ symbol: OTHER_SHIP_SYMBOL, registration: { role: 'SATELLITE' } });

const seedCaches = (queryClient: QueryClient, ship: Ship): void => {
  queryClient.setQueryData(fleetKeys.detail(ship.symbol), ship);
  queryClient.setQueryData(fleetKeys.list({ page: 1 }), buildPage([ship, otherShip()]));
  queryClient.setQueryData(fleetKeys.list({ page: 2 }), buildPage([otherShip(), ship]));
  queryClient.setQueryData(fleetKeys.list({ page: 3 }), buildPage([otherShip()]));
};

const cachedShip = (queryClient: QueryClient, symbol = TEST_SHIP_SYMBOL): Ship | undefined =>
  queryClient.getQueryData<Ship>(fleetKeys.detail(symbol));

const cachedRow = (queryClient: QueryClient, page: number, symbol = TEST_SHIP_SYMBOL): Ship | undefined =>
  queryClient.getQueryData<Paginated<Ship>>(fleetKeys.list({ page }))?.data.find((entry) => entry.symbol === symbol);

const cachedPage = (queryClient: QueryClient, page: number): Paginated<Ship> | undefined =>
  queryClient.getQueryData<Paginated<Ship>>(fleetKeys.list({ page }));

afterEach(async () => {
  server.events.removeAllListeners();
  // A request still in the bucket would land inside the next test and be counted there.
  if (client !== undefined) {
    const queryClient = client;
    await vi.waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
      expect(queryClient.isMutating()).toBe(0);
    }, WAIT);
    client = undefined;
  }
});

// Orbit and dock: the response is a new `nav`

describe('useOrbitShip and useDockShip', () => {
  it('writes the new nav into the ship query and every cached list page, with no follow-up GET', async () => {
    server.use(
      mockPost('/my/ships/{shipSymbol}/orbit', () => ({ data: { nav: buildShipNav({ status: 'IN_ORBIT' }) } })),
    );
    const counter = createRequestCounter();
    server.use(counter.handler);
    const requests = recordRequestLines(server);

    const queryClient = testQueryClient();
    seedCaches(queryClient, buildShip({ nav: { status: 'DOCKED' } }));
    const { result, app } = withSetup(() => useOrbitShip(TEST_SHIP_SYMBOL), queryClient);

    await result.mutateAsync();
    await settle();

    expect(counter.count()).toBe(1);
    expect(requests).toEqual([`POST https://api.spacetraders.io/v2/my/ships/${TEST_SHIP_SYMBOL}/orbit`]);
    expect(cachedShip(queryClient)?.nav.status).toBe('IN_ORBIT');
    expect(cachedRow(queryClient, 1)?.nav.status).toBe('IN_ORBIT');
    expect(cachedRow(queryClient, 2)?.nav.status).toBe('IN_ORBIT');

    app.unmount();
  });
});

describe('useNavigateShip', () => {
  it('writes the navigate response into the cache without a follow-up GET', async () => {
    const arrival = new Date(Date.now() + 600_000).toISOString();
    const flying = buildShipNav({
      status: 'IN_TRANSIT',
      waypointSymbol: DESTINATION,
      route: { destination: { symbol: DESTINATION }, arrival },
    });
    const burned = buildShipFuel({ current: 336, capacity: 400, consumed: { amount: 64 } });
    server.use(
      mockPost('/my/ships/{shipSymbol}/navigate', () => ({ data: { nav: flying, fuel: burned, events: [] } })),
    );
    const counter = createRequestCounter();
    server.use(counter.handler);
    const requests = recordRequestLines(server);

    const queryClient = testQueryClient();
    seedCaches(queryClient, buildShip({ nav: { status: 'IN_ORBIT' } }));
    const { result, app } = withSetup(() => useNavigateShip(TEST_SHIP_SYMBOL), queryClient);

    await result.mutateAsync({ waypointSymbol: DESTINATION });
    await settle();

    expect(counter.count()).toBe(1);
    expect(requests).toEqual([`POST ${NAVIGATE_URL}`]);
    expect(requests.filter((entry) => entry.startsWith('GET'))).toEqual([]);

    // Both halves of the response land: the route the page counts down, and the fuel it meters.
    expect(cachedShip(queryClient)?.nav.status).toBe('IN_TRANSIT');
    expect(cachedShip(queryClient)?.nav.route.arrival).toBe(arrival);
    expect(cachedShip(queryClient)?.fuel.current).toBe(336);
    expect(cachedRow(queryClient, 1)?.nav.route.destination.symbol).toBe(DESTINATION);
    expect(cachedRow(queryClient, 1)?.fuel.current).toBe(336);
    expect(cachedRow(queryClient, 2)?.fuel.current).toBe(336);

    app.unmount();
  });

  it('sends the destination it was given, in exactly one request', async () => {
    const bodies: { waypointSymbol?: string }[] = [];
    server.use(
      http.post(apiUrl('/my/ships/{shipSymbol}/navigate'), async ({ request }) => {
        bodies.push((await request.json()) as { waypointSymbol?: string });
        return HttpResponse.json({
          data: { nav: buildShipNav({ status: 'IN_TRANSIT' }), fuel: buildShipFuel(), events: [] },
        });
      }),
    );
    const counter = createRequestCounter();
    server.use(counter.handler);

    const queryClient = testQueryClient();
    seedCaches(queryClient, buildShip({ nav: { status: 'IN_ORBIT' } }));
    const { result, app } = withSetup(() => useNavigateShip(TEST_SHIP_SYMBOL), queryClient);

    await result.mutateAsync({ waypointSymbol: DESTINATION });
    await settle();

    expect(bodies).toEqual([{ waypointSymbol: DESTINATION }]);
    expect(counter.count()).toBe(1);

    app.unmount();
  });
});

describe('a mutation that fails', () => {
  it("leaves the cache untouched and carries the API's own message", async () => {
    server.use(
      mockPost('/my/ships/{shipSymbol}/navigate', () =>
        apiErrorResponse(400, { message: 'Ship ALICE-1 has insufficient fuel.', code: 4203 }),
      ),
    );
    const counter = createRequestCounter();
    server.use(counter.handler);
    const requests = recordRequestLines(server);

    const queryClient = testQueryClient();
    const before = buildShip({ nav: { status: 'IN_ORBIT' }, fuel: { current: 0, capacity: 400 } });
    seedCaches(queryClient, before);
    const pages = [1, 2, 3].map((page) => cachedPage(queryClient, page));
    const { result, app } = withSetup(() => useNavigateShip(TEST_SHIP_SYMBOL), queryClient);

    await expect(result.mutateAsync({ waypointSymbol: DESTINATION })).rejects.toThrow('insufficient fuel');
    await settle();

    // One request, and no salvage GET after it either.
    expect(counter.count()).toBe(1);
    expect(requests).toEqual([`POST ${NAVIGATE_URL}`]);

    // Nothing was written: the same objects are still in the cache, not equal copies of them.
    expect(cachedShip(queryClient)).toBe(before);
    expect([1, 2, 3].map((page) => cachedPage(queryClient, page))).toEqual(pages);

    // The message the UI shows is the server's, with the code kept for the error taxonomy.
    const error = result.error.value;
    expect(isApiError(error)).toBe(true);
    expect(error?.message).toBe('Ship ALICE-1 has insufficient fuel.');

    // And the ship is still usable: the same composable can fire again.
    expect(result.isPending.value).toBe(false);

    app.unmount();
  });
});
