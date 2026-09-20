import { describe, expect, it } from 'vitest';

import { shipsByWaypoint, systemsOfInterest } from '@/modules/systems/domain/systems-of-interest';
import { buildAgent, buildShip } from '@/shared/api/__tests__/fixtures';
import type { Ship } from '@/shared/api/types';

const HOME = 'X1-AB12';
const AWAY = 'X1-ZZ99';

const shipAt = (symbol: string, systemSymbol: string, waypointSymbol: string): Ship =>
  buildShip({ symbol, nav: { systemSymbol, waypointSymbol } });

describe('systemsOfInterest', () => {
  it('lists the headquarters system first, then every system holding a ship', () => {
    const systems = systemsOfInterest(buildAgent({ headquarters: `${HOME}-A1` }), [
      shipAt('S-1', AWAY, `${AWAY}-C3`),
      shipAt('S-2', HOME, `${HOME}-A1`),
    ]);

    expect(systems.map((system) => system.systemSymbol)).toEqual([HOME, AWAY]);
    expect(systems[0]).toEqual({ systemSymbol: HOME, shipCount: 1, isHeadquarters: true });
    expect(systems[1]).toEqual({ systemSymbol: AWAY, shipCount: 1, isHeadquarters: false });
  });

  it('counts the ships in each system and never lists the headquarters twice', () => {
    const systems = systemsOfInterest(buildAgent({ headquarters: `${HOME}-A1` }), [
      shipAt('S-1', HOME, `${HOME}-A1`),
      shipAt('S-2', HOME, `${HOME}-B2`),
      shipAt('S-3', AWAY, `${AWAY}-C3`),
    ]);

    expect(systems).toHaveLength(2);
    expect(systems[0]?.shipCount).toBe(2);
    expect(systems[1]?.shipCount).toBe(1);
  });

  it('keeps the headquarters even when no ship is there, with a count of zero', () => {
    const systems = systemsOfInterest(buildAgent({ headquarters: `${HOME}-A1` }), []);

    expect(systems).toEqual([{ systemSymbol: HOME, shipCount: 0, isHeadquarters: true }]);
  });

  it('orders the systems with ships by symbol, so the list is stable between renders', () => {
    const systems = systemsOfInterest(undefined, [
      shipAt('S-1', 'X1-DF55', 'X1-DF55-A1'),
      shipAt('S-2', 'X1-BB11', 'X1-BB11-A1'),
      shipAt('S-3', 'X1-CC22', 'X1-CC22-A1'),
    ]);

    expect(systems.map((system) => system.systemSymbol)).toEqual(['X1-BB11', 'X1-CC22', 'X1-DF55']);
  });

  it('renders from whichever query has arrived: neither one is required', () => {
    expect(systemsOfInterest(undefined, undefined)).toEqual([]);
    expect(systemsOfInterest(buildAgent({ headquarters: `${HOME}-A1` }), undefined)).toHaveLength(1);
    expect(systemsOfInterest(undefined, [shipAt('S-1', AWAY, `${AWAY}-C3`)])).toHaveLength(1);
  });

  it('ignores a headquarters that is not a waypoint symbol rather than inventing a system', () => {
    expect(systemsOfInterest(buildAgent({ headquarters: 'NOT-A-WAYPOINT-SYMBOL-AT-ALL!' }), [])).toEqual([]);
  });
});

describe('shipsByWaypoint', () => {
  it('counts your ships per waypoint', () => {
    const counts = shipsByWaypoint([
      shipAt('S-1', HOME, `${HOME}-A1`),
      shipAt('S-2', HOME, `${HOME}-A1`),
      shipAt('S-3', HOME, `${HOME}-B2`),
    ]);

    expect(counts.get(`${HOME}-A1`)).toBe(2);
    expect(counts.get(`${HOME}-B2`)).toBe(1);
    expect(counts.get(`${HOME}-C3`)).toBeUndefined();
  });

  it('is empty when nothing has loaded the fleet', () => {
    expect(shipsByWaypoint(undefined).size).toBe(0);
  });
});
