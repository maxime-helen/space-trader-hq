import { describe, expect, it } from 'vitest';

import { canDock, canNavigate, canOrbit } from '@/modules/fleet/domain/ship-actions';

describe('ship actions by status', () => {
  it('offers orbit to a docked ship, dock to an orbiting one, and neither in transit', () => {
    expect(canOrbit('DOCKED')).toBe(true);
    expect(canOrbit('IN_ORBIT')).toBe(false);
    expect(canOrbit('IN_TRANSIT')).toBe(false);

    expect(canDock('IN_ORBIT')).toBe(true);
    expect(canDock('DOCKED')).toBe(false);
    expect(canDock('IN_TRANSIT')).toBe(false);
  });

  it('offers navigation only from orbit, which is what the endpoint requires', () => {
    expect(canNavigate('IN_ORBIT')).toBe(true);
    expect(canNavigate('DOCKED')).toBe(false);
    expect(canNavigate('IN_TRANSIT')).toBe(false);
  });
});
