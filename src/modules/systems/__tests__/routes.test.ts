import { describe, expect, it } from 'vitest';

import * as systemsModule from '@/modules/systems';
import { systemKeys, systemsRoutes } from '@/modules/systems';

const SYSTEM = 'X1-AB12';
const WAYPOINT = 'X1-AB12-A1';

describe('the systems module index', () => {
  it('exports the routes, the five queries, the keys and the domain functions', () => {
    expect(Object.keys(systemsModule).sort()).toEqual([
      'buildWaypointTree',
      'filterTreeByType',
      'hasTrait',
      'systemKeys',
      'systemsOfInterest',
      'systemsRoutes',
      'useShipyardQuery',
      'useSystemQuery',
      'useSystemsQuery',
      'useWaypointQuery',
      'useWaypointsQuery',
    ]);
  });
});

describe('systemsRoutes', () => {
  it('owns the list, the system and the waypoint, in that order', () => {
    expect(systemsRoutes.map((route) => route.path)).toEqual([
      '/systems',
      '/systems/:systemSymbol',
      '/systems/:systemSymbol/waypoints/:waypointSymbol',
    ]);
  });

  it('loads every page lazily and names the page half of the tab title', () => {
    for (const route of systemsRoutes) {
      expect(typeof route.component).toBe('function');
      expect(typeof route.meta?.title).toBe('string');
    }
    expect(systemsRoutes[0]?.meta?.title).toBe('Systems');
  });

  it('leaves the guard to the shell, which stamps `meta.access` on what it composes', () => {
    for (const route of systemsRoutes) {
      expect(route.meta?.access).toBeUndefined();
    }
  });
});

describe('systemKeys', () => {
  it('keys each request by what identifies it', () => {
    expect(systemKeys.list({ page: 2 })).toEqual(['systems', 'list', { page: 2 }]);
    expect(systemKeys.detail(SYSTEM)).toEqual(['systems', 'detail', SYSTEM]);
    expect(systemKeys.waypoint(SYSTEM, WAYPOINT)).toEqual([
      'systems',
      'detail',
      SYSTEM,
      'waypoints',
      'detail',
      WAYPOINT,
    ]);
    expect(systemKeys.shipyard(SYSTEM, WAYPOINT)).toEqual([...systemKeys.waypoint(SYSTEM, WAYPOINT), 'shipyard']);
  });

  it('separates one filtered waypoint list from another, so a filter never reads the wrong cache', () => {
    const marketplaces = systemKeys.waypoints(SYSTEM, { traits: ['MARKETPLACE'] });
    const shipyards = systemKeys.waypoints(SYSTEM, { traits: ['SHIPYARD'] });

    expect(marketplaces).not.toEqual(shipyards);
    expect(marketplaces.slice(0, 5)).toEqual(systemKeys.waypointsAll(SYSTEM));
  });

  it('nests every entry under one system prefix, so one system can be invalidated alone', () => {
    const prefix = systemKeys.detail(SYSTEM);

    expect(systemKeys.waypointsAll(SYSTEM).slice(0, prefix.length)).toEqual(prefix);
    expect(systemKeys.waypoint(SYSTEM, WAYPOINT).slice(0, prefix.length)).toEqual(prefix);
    expect(prefix.slice(0, 1)).toEqual(systemKeys.all());
  });
});
