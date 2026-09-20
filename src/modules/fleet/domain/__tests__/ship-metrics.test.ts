import { describe, expect, it } from 'vitest';

import {
  cargoRatio,
  cooldownEndsAt,
  cooldownRemaining,
  etaSeconds,
  fuelRatio,
  isArriving,
  navStatusLabel,
  navStatusVariant,
  needsSystemLink,
  transitProgress,
} from '@/modules/fleet/domain/ship-metrics';
import { buildCooldown, buildShipCargo, buildShipFuel, buildShipNav } from '@/shared/api/__tests__/fixtures';

const DEPARTURE = '2026-09-16T12:00:00.000Z';
const ARRIVAL = '2026-09-16T12:10:00.000Z';
const NOW = Date.parse('2026-09-16T12:05:00.000Z');

const route = (overrides: { departureTime?: string; arrival?: string } = {}) =>
  buildShipNav({ route: { departureTime: DEPARTURE, arrival: ARRIVAL, ...overrides } }).route;

describe('fuelRatio', () => {
  it('is the fraction of the tank that is full', () => {
    expect(fuelRatio(buildShipFuel({ current: 200, capacity: 400 }))).toBe(0.5);
  });

  it('returns null at capacity 0, so the caller shows "no fuel tank" instead of dividing by zero', () => {
    expect(fuelRatio(buildShipFuel({ current: 0, capacity: 0 }))).toBeNull();
  });

  it('clamps a reading above capacity rather than reporting more than a full tank', () => {
    expect(fuelRatio(buildShipFuel({ current: 500, capacity: 400 }))).toBe(1);
  });
});

describe('cargoRatio', () => {
  it('is the fraction of the hold that is full', () => {
    expect(cargoRatio(buildShipCargo({ units: 10, capacity: 40 }))).toBe(0.25);
  });

  it('returns null for a ship with no hold', () => {
    expect(cargoRatio(buildShipCargo({ units: 0, capacity: 0 }))).toBeNull();
  });
});

describe('transitProgress', () => {
  it('is how far along the route the ship is', () => {
    expect(transitProgress(route(), NOW)).toBe(0.5);
  });

  it('clamps to 0 before departure and to 1 after arrival', () => {
    expect(transitProgress(route(), Date.parse('2026-09-16T11:00:00.000Z'))).toBe(0);
    expect(transitProgress(route(), Date.parse('2026-09-16T13:00:00.000Z'))).toBe(1);
  });

  it('reads a route with no duration as finished only once its arrival is reached', () => {
    const instant = route({ arrival: DEPARTURE });
    expect(transitProgress(instant, Date.parse(DEPARTURE))).toBe(1);
    expect(transitProgress(instant, Date.parse('2026-09-16T11:59:59.000Z'))).toBe(0);
  });

  it('reads an unparseable route as not started rather than as NaN', () => {
    expect(transitProgress(route({ departureTime: 'soon' }), NOW)).toBe(0);
  });
});

describe('etaSeconds', () => {
  it('counts whole seconds to arrival', () => {
    expect(etaSeconds(route(), NOW)).toBe(300);
  });

  it('is 0 for an arrival already in the past, the stale-cache case 7.4 names', () => {
    expect(etaSeconds(route(), Date.parse('2026-09-16T12:30:00.000Z'))).toBe(0);
  });
});

describe('cooldownRemaining', () => {
  it('prefers `expiration`, which stays right however long the payload sat in the cache', () => {
    const cooldown = buildCooldown({ remainingSeconds: 999, expiration: '2026-09-16T12:05:42.000Z' });
    expect(cooldownRemaining(cooldown, NOW)).toBe(42);
  });

  it('falls back to `remainingSeconds` when there is no expiration', () => {
    expect(cooldownRemaining(buildCooldown({ remainingSeconds: 42 }), NOW)).toBe(42);
  });

  it('is 0 for an expired cooldown, a negative snapshot, or no cooldown at all', () => {
    expect(cooldownRemaining(buildCooldown({ expiration: '2026-09-16T12:00:00.000Z' }), NOW)).toBe(0);
    expect(cooldownRemaining(buildCooldown({ remainingSeconds: -5 }), NOW)).toBe(0);
    expect(cooldownRemaining(undefined, NOW)).toBe(0);
    expect(cooldownRemaining(null, NOW)).toBe(0);
  });
});

describe('cooldownEndsAt', () => {
  it('is null when the ship is ready, and the end instant otherwise', () => {
    expect(cooldownEndsAt(buildCooldown(), NOW)).toBeNull();
    expect(cooldownEndsAt(buildCooldown({ remainingSeconds: 42 }), NOW)).toBe(NOW + 42_000);
  });
});

describe('navStatusLabel and navStatusVariant', () => {
  it('labels every status in readable sentence case', () => {
    expect(navStatusLabel('DOCKED')).toBe('Docked');
    expect(navStatusLabel('IN_ORBIT')).toBe('In orbit');
    expect(navStatusLabel('IN_TRANSIT')).toBe('In transit');
  });

  it('gives each status its badge color', () => {
    expect(navStatusVariant('DOCKED')).toBe('docked');
    expect(navStatusVariant('IN_ORBIT')).toBe('orbit');
    expect(navStatusVariant('IN_TRANSIT')).toBe('transit');
  });
});

describe('isArriving', () => {
  it('is true once the ETA of a ship in transit runs out', () => {
    expect(isArriving('IN_TRANSIT', route(), NOW)).toBe(false);
    expect(isArriving('IN_TRANSIT', route(), Date.parse(ARRIVAL))).toBe(true);
  });

  it('is true for a stale cache whose arrival is already past while the status still says in transit', () => {
    expect(isArriving('IN_TRANSIT', route(), Date.parse('2026-09-16T13:00:00.000Z'))).toBe(true);
  });

  it('is false for a ship that is not in transit, whatever its route says', () => {
    expect(isArriving('DOCKED', route(), Date.parse(ARRIVAL))).toBe(false);
  });
});

describe('needsSystemLink', () => {
  it('shows the system only when the ship is away from the headquarters system', () => {
    expect(needsSystemLink('X1-AB12', 'X1-AB12')).toBe(false);
    expect(needsSystemLink('X1-ZZ99', 'X1-AB12')).toBe(true);
  });

  it('shows it when the headquarters is not known yet: extra, never wrong', () => {
    expect(needsSystemLink('X1-AB12', undefined)).toBe(true);
  });
});
