import { describe, expect, it } from 'vitest';

import { marketPath, shipPath, systemPath, waypointPath, waypointPathFor } from '@/shared/lib/paths';

describe('paths', () => {
  it('builds the system, waypoint, ship and market paths', () => {
    expect(systemPath('X1-AB12')).toBe('/systems/X1-AB12');
    expect(waypointPath('X1-AB12', 'X1-AB12-A1')).toBe('/systems/X1-AB12/waypoints/X1-AB12-A1');
    expect(shipPath('ALICE-1')).toBe('/fleet/ALICE-1');
    expect(marketPath('X1-DF55', 'X1-DF55-A2')).toBe('/systems/X1-DF55/waypoints/X1-DF55-A2?tab=market');
  });
});

describe('waypointPathFor', () => {
  it('builds the waypoint page path from a bare symbol, whatever its case', () => {
    expect(waypointPathFor('X1-DF55-20250Z')).toBe('/systems/X1-DF55/waypoints/X1-DF55-20250Z');
    expect(waypointPathFor('x1-df55-20250z')).toBe('/systems/X1-DF55/waypoints/X1-DF55-20250Z');
  });

  it('has no link for a symbol that is not a waypoint', () => {
    expect(waypointPathFor('X1-DF55')).toBeUndefined();
    expect(waypointPathFor('')).toBeUndefined();
  });
});
