import { describe, expect, it } from 'vitest';

import { countByStatus } from '@/modules/fleet/domain/fleet-summary';
import { buildShip } from '@/shared/api/__tests__/fixtures';

describe('countByStatus', () => {
  it('counts the ships of the page in each status', () => {
    const ships = [
      buildShip({ symbol: 'A-1', nav: { status: 'DOCKED' } }),
      buildShip({ symbol: 'A-2', nav: { status: 'IN_ORBIT' } }),
      buildShip({ symbol: 'A-3', nav: { status: 'IN_TRANSIT' } }),
      buildShip({ symbol: 'A-4', nav: { status: 'IN_TRANSIT' } }),
    ];

    expect(countByStatus(ships)).toEqual({ DOCKED: 1, IN_ORBIT: 1, IN_TRANSIT: 2 });
  });

  it('reports every status on an empty page rather than an empty object', () => {
    expect(countByStatus([])).toEqual({ DOCKED: 0, IN_ORBIT: 0, IN_TRANSIT: 0 });
  });
});
