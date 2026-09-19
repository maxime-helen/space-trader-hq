import { describe, expect, it } from 'vitest';

import { isServerOnline, resetCountdown, resetFrequencyLabel } from '@/modules/agent/domain/server-status';

const NOW = Date.parse('2026-09-16T14:36:00.000Z');

describe('resetCountdown', () => {
  it('counts down to the next reset in the two-unit format', () => {
    expect(resetCountdown('2026-09-16T15:40:05.000Z', NOW)).toEqual({ label: '1h04min', reached: false });
  });

  it('drops to seconds in the last minute', () => {
    expect(resetCountdown(NOW + 42_000, NOW)).toEqual({ label: '42s', reached: false });
  });

  it('reads "Resetting now" once the reset time is reached', () => {
    expect(resetCountdown(NOW, NOW)).toEqual({ label: 'Resetting now', reached: true });
    expect(resetCountdown(NOW - 1000, NOW)).toEqual({ label: 'Resetting now', reached: true });
  });
});

describe('isServerOnline', () => {
  it('reads the status sentence the API sends', () => {
    expect(isServerOnline('SpaceTraders is currently online and available to play')).toBe(true);
  });

  it('is false for anything that does not say online', () => {
    expect(isServerOnline('SpaceTraders is down for maintenance')).toBe(false);
  });
});

describe('resetFrequencyLabel', () => {
  it('reads as a sentence beside the countdown', () => {
    expect(resetFrequencyLabel('fortnightly')).toBe('Resets fortnightly');
    expect(resetFrequencyLabel('Weekly')).toBe('Resets weekly');
  });
});
