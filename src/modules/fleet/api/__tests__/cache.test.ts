import { QueryClient } from '@tanstack/vue-query';
import { describe, expect, it } from 'vitest';

import { readCachedShips, writeShipIntoCaches } from '@/modules/fleet';
import { fleetKeys } from '@/modules/fleet/api/keys';
import { buildPage, buildShip } from '@/shared/api/__tests__/fixtures';
import type { Paginated, Ship } from '@/shared/api/types';

const ONE = 'ALICE-1';
const TWO = 'ALICE-2';
const THREE = 'ALICE-3';

const client = (): QueryClient => new QueryClient();

const listPage = (queryClient: QueryClient, page: number): Paginated<Ship> | undefined =>
  queryClient.getQueryData<Paginated<Ship>>(fleetKeys.list({ page }));

describe('readCachedShips', () => {
  it('finds nothing in an empty cache', () => {
    expect(readCachedShips(client())).toEqual([]);
  });

  it('reads ships from list pages and from individual ship queries alike', () => {
    const queryClient = client();
    queryClient.setQueryData(fleetKeys.list({ page: 1 }), buildPage([buildShip({ symbol: ONE })]));
    queryClient.setQueryData(fleetKeys.list({ page: 2 }), buildPage([buildShip({ symbol: TWO })]));
    queryClient.setQueryData(fleetKeys.detail(THREE), buildShip({ symbol: THREE }));

    expect(
      readCachedShips(queryClient)
        .map((ship) => ship.symbol)
        .sort(),
    ).toEqual([ONE, TWO, THREE]);
  });

  it('counts a ship in both caches once, keeping the most recently updated copy', () => {
    const queryClient = client();
    queryClient.setQueryData(
      fleetKeys.list({ page: 1 }),
      buildPage([buildShip({ symbol: ONE, fuel: { current: 10 } })]),
      {
        updatedAt: 1000,
      },
    );
    queryClient.setQueryData(fleetKeys.detail(ONE), buildShip({ symbol: ONE, fuel: { current: 99 } }), {
      updatedAt: 2000,
    });

    const ships = readCachedShips(queryClient);

    expect(ships).toHaveLength(1);
    expect(ships[0]?.fuel.current).toBe(99);
  });

  it('keeps the list copy when it is the newer of the two', () => {
    const queryClient = client();
    queryClient.setQueryData(fleetKeys.detail(ONE), buildShip({ symbol: ONE, fuel: { current: 99 } }), {
      updatedAt: 1000,
    });
    queryClient.setQueryData(
      fleetKeys.list({ page: 1 }),
      buildPage([buildShip({ symbol: ONE, fuel: { current: 10 } })]),
      {
        updatedAt: 2000,
      },
    );

    expect(readCachedShips(queryClient)[0]?.fuel.current).toBe(10);
  });

  it('ignores cache entries that belong to other modules', () => {
    const queryClient = client();
    queryClient.setQueryData(['agent', 'me'], { symbol: 'ALICE', shipCount: 2 });
    queryClient.setQueryData(['systems', 'list', { page: 1 }], buildPage([{ symbol: 'X1-AB12' }]));

    expect(readCachedShips(queryClient)).toEqual([]);
  });
});

describe('writeShipIntoCaches', () => {
  it('writes the ship into its own query and into its row on every cached page', () => {
    const queryClient = client();
    queryClient.setQueryData(
      fleetKeys.list({ page: 1 }),
      buildPage([buildShip({ symbol: ONE }), buildShip({ symbol: TWO })]),
    );
    queryClient.setQueryData(fleetKeys.detail(ONE), buildShip({ symbol: ONE }));

    const arrived = buildShip({ symbol: ONE, nav: { status: 'IN_ORBIT', waypointSymbol: 'X1-AB12-B7' } });
    writeShipIntoCaches(queryClient, arrived);

    expect(queryClient.getQueryData<Ship>(fleetKeys.detail(ONE))?.nav.status).toBe('IN_ORBIT');
    expect(listPage(queryClient, 1)?.data[0]?.nav.waypointSymbol).toBe('X1-AB12-B7');
    // The neighbouring row is left exactly as it was.
    expect(listPage(queryClient, 1)?.data[1]?.symbol).toBe(TWO);
  });

  it('creates the detail entry for a ship that has only ever been seen in the list', () => {
    const queryClient = client();
    queryClient.setQueryData(fleetKeys.list({ page: 1 }), buildPage([buildShip({ symbol: ONE })]));

    writeShipIntoCaches(queryClient, buildShip({ symbol: ONE, nav: { status: 'IN_ORBIT' } }));

    expect(queryClient.getQueryData<Ship>(fleetKeys.detail(ONE))?.nav.status).toBe('IN_ORBIT');
  });

  it('leaves a page that does not hold the ship untouched, down to the object identity', () => {
    const queryClient = client();
    queryClient.setQueryData(fleetKeys.list({ page: 2 }), buildPage([buildShip({ symbol: TWO })]));
    const before = listPage(queryClient, 2);

    writeShipIntoCaches(queryClient, buildShip({ symbol: ONE }));

    expect(listPage(queryClient, 2)).toBe(before);
  });

  it('never invents a page the user has not loaded', () => {
    const queryClient = client();

    writeShipIntoCaches(queryClient, buildShip({ symbol: ONE }));

    expect(listPage(queryClient, 1)).toBeUndefined();
    expect(queryClient.getQueryData<Ship>(fleetKeys.detail(ONE))?.symbol).toBe(ONE);
  });

  it('is what makes a written ship readable again, with no request in between', () => {
    const queryClient = client();
    queryClient.setQueryData(fleetKeys.list({ page: 1 }), buildPage([buildShip({ symbol: ONE })]));

    writeShipIntoCaches(queryClient, buildShip({ symbol: ONE, nav: { status: 'IN_ORBIT' } }));

    const ships = readCachedShips(queryClient);
    expect(ships).toHaveLength(1);
    expect(ships[0]?.nav.status).toBe('IN_ORBIT');
  });
});
