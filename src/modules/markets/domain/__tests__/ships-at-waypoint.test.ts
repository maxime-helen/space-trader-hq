import { describe, expect, it } from 'vitest';

import { shipsAtWaypoint } from '@/modules/markets/domain/ships-at-waypoint';
import { buildShip } from '@/shared/api/__tests__/fixtures';

const docked = buildShip({ symbol: 'VOYAGER-7-1', nav: { waypointSymbol: 'X1-DF55-A2', systemSymbol: 'X1-DF55' } });

const inOrbit = buildShip({
  symbol: 'VOYAGER-7-2',
  nav: { waypointSymbol: 'X1-DF55-A2', systemSymbol: 'X1-DF55', status: 'IN_ORBIT' },
});

const leaving = buildShip({
  symbol: 'VOYAGER-7-3',
  nav: { waypointSymbol: 'X1-DF55-A2', systemSymbol: 'X1-DF55', status: 'IN_TRANSIT' },
});

const elsewhere = buildShip({
  symbol: 'VOYAGER-7-4',
  nav: { waypointSymbol: 'X1-KK42-D9', systemSymbol: 'X1-KK42' },
});

const fleet = [docked, inOrbit, leaving, elsewhere];

describe('shipsAtWaypoint', () => {
  it('keeps the ships docked or in orbit at the waypoint', () => {
    expect(shipsAtWaypoint(fleet, 'X1-DF55-A2').map((ship) => ship.symbol)).toEqual(['VOYAGER-7-1', 'VOYAGER-7-2']);
  });

  it('excludes a ship in transit, whose nav still names the waypoint it left', () => {
    expect(shipsAtWaypoint(fleet, 'X1-DF55-A2').map((ship) => ship.symbol)).not.toContain('VOYAGER-7-3');
  });

  it('is empty at a waypoint with none of your ships', () => {
    expect(shipsAtWaypoint(fleet, 'X1-DF55-C4')).toEqual([]);
  });
});
