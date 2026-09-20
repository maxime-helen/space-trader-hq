import { describe, expect, it } from 'vitest';

import {
  ARRIVAL_WINDOW_MS,
  arrivalKey,
  arrivalsDueAt,
  arrivalToast,
  collectArrivals,
  MAX_TIMER_MS,
  type PendingArrival,
  shipPath,
  timerDelayMs,
  toArrival,
} from '@/modules/notifications/domain/arrivals';
import { buildShip } from '@/shared/api/__tests__/fixtures';

const NOW = Date.parse('2026-09-16T12:00:00.000Z');

const inTransit = (symbol: string, arrivalAt: number, destination = 'X1-DF55-B7') =>
  buildShip({
    symbol,
    nav: {
      status: 'IN_TRANSIT',
      route: {
        arrival: new Date(arrivalAt).toISOString(),
        destination: { symbol: destination },
      },
    },
  });

describe('arrivals', () => {
  describe('toArrival', () => {
    it('reads the symbol, the destination and the arrival of a ship in transit', () => {
      expect(toArrival(inTransit('VOYAGER-7-3', NOW + 5000))).toEqual({
        shipSymbol: 'VOYAGER-7-3',
        destination: 'X1-DF55-B7',
        arrivalAt: NOW + 5000,
        key: `VOYAGER-7-3@${new Date(NOW + 5000).toISOString()}`,
      });
    });

    it('ignores a ship that is not flying', () => {
      expect(toArrival(buildShip({ nav: { status: 'DOCKED' } }))).toBeUndefined();
      expect(toArrival(buildShip({ nav: { status: 'IN_ORBIT' } }))).toBeUndefined();
    });

    it('ignores an unparseable arrival rather than scheduling a timer for NaN', () => {
      const broken = buildShip({ nav: { status: 'IN_TRANSIT', route: { arrival: 'not-a-date' } } });

      expect(toArrival(broken)).toBeUndefined();
    });
  });

  describe('collectArrivals', () => {
    it('keeps only the ships in transit, soonest first', () => {
      const ships = [
        inTransit('SHIP-LATE', NOW + 90_000),
        buildShip({ symbol: 'SHIP-DOCKED', nav: { status: 'DOCKED' } }),
        inTransit('SHIP-SOON', NOW + 5000),
      ];

      expect(collectArrivals(ships).map((arrival) => arrival.shipSymbol)).toEqual(['SHIP-SOON', 'SHIP-LATE']);
    });

    it('has no arrivals for an empty fleet', () => {
      expect(collectArrivals([])).toEqual([]);
    });
  });

  describe('arrivalKey', () => {
    it('separates two flights of the same ship', () => {
      expect(arrivalKey('SHIP-1', NOW)).not.toBe(arrivalKey('SHIP-1', NOW + 1));
      expect(arrivalKey('SHIP-1', NOW)).toBe(arrivalKey('SHIP-1', NOW));
    });
  });

  describe('arrivalsDueAt', () => {
    const arrivals = collectArrivals([
      inTransit('SHIP-PAST', NOW - 1000),
      inTransit('SHIP-NOW', NOW),
      inTransit('SHIP-WINDOW', NOW + ARRIVAL_WINDOW_MS),
      inTransit('SHIP-AFTER', NOW + ARRIVAL_WINDOW_MS + 1),
    ]);

    it('takes everything due and everything arriving within two seconds', () => {
      expect(arrivalsDueAt(arrivals, NOW).map((arrival) => arrival.shipSymbol)).toEqual([
        'SHIP-PAST',
        'SHIP-NOW',
        'SHIP-WINDOW',
      ]);
    });

    it('leaves out a ship arriving after the window', () => {
      expect(arrivalsDueAt(arrivals, NOW).some((arrival) => arrival.shipSymbol === 'SHIP-AFTER')).toBe(false);
    });

    it('accepts a narrower window', () => {
      expect(arrivalsDueAt(arrivals, NOW, 0).map((arrival) => arrival.shipSymbol)).toEqual(['SHIP-PAST', 'SHIP-NOW']);
    });
  });

  describe('timerDelayMs', () => {
    it('waits exactly until the arrival', () => {
      expect(timerDelayMs(NOW + 5000, NOW)).toBe(5000);
    });

    it('never waits for a moment that has passed', () => {
      expect(timerDelayMs(NOW - 60_000, NOW)).toBe(0);
    });

    it('caps a delay longer than a timer can hold, so it is re-armed instead of firing early', () => {
      const inThirtyDays = NOW + 30 * 24 * 60 * 60 * 1000;

      expect(timerDelayMs(inThirtyDays, NOW)).toBe(MAX_TIMER_MS);
      expect(MAX_TIMER_MS).toBeLessThan(inThirtyDays - NOW);
    });
  });

  describe('arrivalToast', () => {
    const arrival: PendingArrival = {
      shipSymbol: 'VOYAGER-7-3',
      destination: 'X1-DF55-B7',
      arrivalAt: NOW,
      key: arrivalKey('VOYAGER-7-3', NOW),
    };

    it('reads "SHIP arrived at WAYPOINT" with a link to the ship', () => {
      expect(arrivalToast(arrival, 'X1-DF55-B7')).toEqual({
        badge: 'Arrived',
        badgeVariant: 'orbit',
        subject: 'VOYAGER-7-3',
        message: 'arrived at X1-DF55-B7',
        action: { label: 'View ship', to: '/fleet/VOYAGER-7-3' },
      });
    });

    it('falls back to the route destination when the refetch gave no location', () => {
      expect(arrivalToast(arrival).message).toBe('arrived at X1-DF55-B7');
    });

    it('prefers the refetched location when the two disagree', () => {
      expect(arrivalToast(arrival, 'X1-DF55-C9').message).toBe('arrived at X1-DF55-C9');
    });
  });

  describe('shipPath', () => {
    it('points at the ship page', () => {
      expect(shipPath('VOYAGER-7-3')).toBe('/fleet/VOYAGER-7-3');
    });

    it('escapes a symbol that would break the path', () => {
      expect(shipPath('SHIP/1')).toBe('/fleet/SHIP%2F1');
    });
  });
});
