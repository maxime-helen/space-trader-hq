import { describe, expect, it } from 'vitest';

import * as fleetModule from '@/modules/fleet';
import { fleetKeys, fleetRoutes } from '@/modules/fleet';

describe('the fleet module index', () => {
  it('exports the routes, the queries, the key factory, the cache helpers and the ship composables', () => {
    expect(Object.keys(fleetModule).sort()).toEqual([
      'fleetKeys',
      'fleetRoutes',
      'readCachedShips',
      'useFleetShips',
      'useShipQuery',
      'useShipsQuery',
      'writeShipIntoCaches',
    ]);
  });
});

describe('fleetRoutes', () => {
  it('owns the fleet list and one ship', () => {
    expect(fleetRoutes.map((route) => route.path)).toEqual(['/fleet', '/fleet/:shipSymbol']);
  });

  it('loads both pages lazily and names the page half of the tab title', () => {
    for (const route of fleetRoutes) {
      expect(typeof route.component).toBe('function');
      expect(typeof route.meta?.title).toBe('string');
    }
    expect(fleetRoutes[0]?.meta?.title).toBe('Fleet');
  });
});

describe('fleetKeys', () => {
  it('keys a page by its page number and a ship by its symbol', () => {
    expect(fleetKeys.list({ page: 2 })).toEqual(['fleet', 'list', { page: 2 }]);
    expect(fleetKeys.detail('ALICE-1')).toEqual(['fleet', 'detail', 'ALICE-1']);
  });

  it('keeps every fleet entry under one prefix, so a sign-out can clear them together', () => {
    expect(fleetKeys.all()).toEqual(['fleet']);
    expect(fleetKeys.list({ page: 1 }).slice(0, 1)).toEqual(fleetKeys.all());
    expect(fleetKeys.detail('ALICE-1').slice(0, 1)).toEqual(fleetKeys.all());
    expect(fleetKeys.list({ page: 1 }).slice(0, 2)).toEqual(fleetKeys.lists());
    expect(fleetKeys.detail('ALICE-1').slice(0, 2)).toEqual(fleetKeys.details());
  });
});
