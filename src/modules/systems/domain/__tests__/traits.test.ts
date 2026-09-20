import { describe, expect, it } from 'vitest';

import { hasTrait } from '@/modules/systems/domain/traits';
import { buildWaypoint, buildWaypointTrait } from '@/shared/api/__tests__/fixtures';

describe('hasTrait', () => {
  const waypoint = buildWaypoint({
    traits: [buildWaypointTrait({ symbol: 'MARKETPLACE' }), buildWaypointTrait({ symbol: 'SHIPYARD' })],
  });

  it('finds a trait the waypoint carries', () => {
    expect(hasTrait(waypoint, 'MARKETPLACE')).toBe(true);
    expect(hasTrait(waypoint, 'SHIPYARD')).toBe(true);
  });

  it('is false for a trait it does not carry', () => {
    expect(hasTrait(waypoint, 'BLACK_MARKET')).toBe(false);
  });

  it('is false rather than throwing when there are no traits to look at', () => {
    expect(hasTrait(buildWaypoint({ traits: [] }), 'MARKETPLACE')).toBe(false);
    expect(hasTrait(undefined, 'MARKETPLACE')).toBe(false);
    expect(hasTrait({}, 'MARKETPLACE')).toBe(false);
  });
});
