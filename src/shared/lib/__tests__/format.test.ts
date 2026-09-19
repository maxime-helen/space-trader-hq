import { afterAll, describe, expect, it } from 'vitest';

import {
  formatApiValue,
  formatClockTime,
  formatCooldown,
  formatCoordinates,
  formatCountdown,
  formatCredits,
  formatDate,
  formatEta,
  formatPageTitle,
  formatResetCountdown,
  isElapsed,
  secondsSince,
  secondsUntil,
} from '@/shared/lib/format';

// The mockups' 31 checks ran under America/Los_Angeles, which is where the date-only bug showed up
//. These tests run there too: a US time zone behind UTC, so midnight UTC is the day before.
const ORIGINAL_TZ = process.env.TZ;
process.env.TZ = 'America/Los_Angeles';

afterAll(() => {
  process.env.TZ = ORIGINAL_TZ;
});

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('credits: number with thousands separators, then "cr"', () => {
  it('formats the table examples', () => {
    expect(formatCredits(175_000)).toBe('175,000 cr');
    expect(formatCredits(-12_400)).toBe('-12,400 cr');
  });

  it('formats small, zero and very large balances', () => {
    expect(formatCredits(0)).toBe('0 cr');
    expect(formatCredits(4)).toBe('4 cr');
    expect(formatCredits(999)).toBe('999 cr');
    expect(formatCredits(1000)).toBe('1,000 cr');
    expect(formatCredits(1_234_567_890)).toBe('1,234,567,890 cr');
  });
});

describe('countdowns: two units at most, the smaller one zero-padded, seconds dropped from an hour up', () => {
  it('formats the table examples', () => {
    expect(formatCountdown(42)).toBe('42s');
    expect(formatCountdown(4 * MINUTE + 5)).toBe('4min05s');
    expect(formatCountdown(HOUR + 4 * MINUTE)).toBe('1h04min');
    expect(formatCountdown(5 * DAY + 14 * HOUR)).toBe('5d14h');
  });

  it('crosses into minutes at 60 seconds and pads the seconds', () => {
    expect(formatCountdown(MINUTE)).toBe('1min00s');
    expect(formatCountdown(MINUTE + 1)).toBe('1min01s');
    expect(formatCountdown(MINUTE + 9)).toBe('1min09s');
    expect(formatCountdown(MINUTE + 10)).toBe('1min10s');
    expect(formatCountdown(HOUR - 1)).toBe('59min59s');
  });

  it('crosses into hours at 3600 seconds, drops the seconds and pads the minutes', () => {
    expect(formatCountdown(HOUR)).toBe('1h00min');
    expect(formatCountdown(HOUR + 59)).toBe('1h00min');
    expect(formatCountdown(HOUR + 9 * MINUTE)).toBe('1h09min');
    expect(formatCountdown(HOUR + 10 * MINUTE)).toBe('1h10min');
    expect(formatCountdown(DAY - 1)).toBe('23h59min');
  });

  it('crosses into days at 86400 seconds and pads the hours', () => {
    expect(formatCountdown(DAY)).toBe('1d00h');
    expect(formatCountdown(DAY + HOUR)).toBe('1d01h');
    expect(formatCountdown(DAY + 9 * HOUR)).toBe('1d09h');
    expect(formatCountdown(2 * DAY + 3 * HOUR)).toBe('2d03h');
    expect(formatCountdown(100 * DAY + 59 * MINUTE)).toBe('100d00h');
  });

  it('floors fractional seconds and never goes below zero', () => {
    expect(formatCountdown(41.9)).toBe('41s');
    expect(formatCountdown(0.4)).toBe('0s');
    expect(formatCountdown(-1)).toBe('0s');
    expect(formatCountdown(Number.NEGATIVE_INFINITY)).toBe('0s');
  });
});

describe('seconds between two instants (every time function takes `now`)', () => {
  const now = Date.parse('2026-09-06T14:36:00Z');

  it('counts down to a target and up from a timestamp', () => {
    expect(secondsUntil('2026-09-06T14:40:12Z', now)).toBe(4 * MINUTE + 12);
    expect(secondsSince('2026-09-06T14:35:20Z', now)).toBe(40);
  });

  it('clamps a target that has passed, and reports it as elapsed', () => {
    expect(secondsUntil(now - 5000, now)).toBe(0);
    expect(secondsSince(now + 5000, now)).toBe(0);
    expect(isElapsed(now, now)).toBe(true);
    expect(isElapsed(now + 1, now)).toBe(false);
  });
});

describe('arrival: "ETA" and the countdown; "Arriving" with a spinner at zero', () => {
  const now = Date.parse('2026-09-06T14:36:00Z');

  it('formats the table example', () => {
    expect(formatEta('2026-09-06T14:40:12Z', now)).toBe('ETA 4min12s');
  });

  it('reads "Arriving" at zero and after', () => {
    expect(formatEta(now, now)).toBe('Arriving');
    expect(formatEta(now - 1000, now)).toBe('Arriving');
    expect(formatEta(now + 999, now)).toBe('ETA 0s');
  });
});

describe('cooldown: the countdown, then "Ready"', () => {
  const now = Date.parse('2026-09-06T14:36:00Z');

  it('formats the table examples', () => {
    expect(formatCooldown(now + 42_000, now)).toBe('42s');
    expect(formatCooldown(now, now)).toBe('Ready');
  });

  it('reads "Ready" when the API sends no cooldown at all', () => {
    expect(formatCooldown(null, now)).toBe('Ready');
    expect(formatCooldown(undefined, now)).toBe('Ready');
  });
});

describe('server reset: "Resetting now" once it is reached', () => {
  const now = Date.parse('2026-09-06T14:36:00Z');

  it('counts down, then says it is resetting', () => {
    expect(formatResetCountdown(now + 5 * DAY * 1000 + 14 * HOUR * 1000, now)).toBe('5d14h');
    expect(formatResetCountdown(now, now)).toBe('Resetting now');
    expect(formatResetCountdown(now - 1000, now)).toBe('Resetting now');
  });
});

describe('clock times: 24-hour', () => {
  it('formats the table examples', () => {
    expect(formatClockTime('2026-09-06T14:36:00Z', 'UTC')).toBe('14:36');
    expect(formatClockTime('2026-09-06T00:05:00Z', 'UTC')).toBe('00:05');
  });
});

describe('dates: short month, day, year; date-only API values formatted in UTC', () => {
  it('formats the table example', () => {
    expect(formatDate('2026-09-06')).toBe('Sep 6, 2026');
  });

  // Bug 1, found by testing: the API sends date-only values such as "2026-09-06", which
  // JavaScript reads as midnight UTC. Formatted in Los Angeles the old formatter read "Sep 5, 2026".

  it('formats a date-only value in UTC, where the old formatter showed the day before', () => {
    const oldFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Los_Angeles');
    expect(oldFormatter.format(new Date('2026-09-06'))).toBe('Sep 5, 2026'); // the bug
    expect(formatDate('2026-09-06')).toBe('Sep 6, 2026'); // the fix
  });
});

describe('API values: readable sentence case, identifiers stay as sent', () => {
  it('formats the table examples', () => {
    expect(formatApiValue('IN_TRANSIT')).toBe('In transit');
    expect(formatApiValue('ORBITAL_STATION')).toBe('Orbital station');
    expect(formatApiValue('IRON_ORE')).toBe('Iron ore');
    expect(formatApiValue('X1-DF55-A2')).toBe('X1-DF55-A2');
  });

  it('reads a single word and a three-word value', () => {
    expect(formatApiValue('DOCKED')).toBe('Docked');
    expect(formatApiValue('SHIP_CONDITION_EVENT')).toBe('Ship condition event');
    expect(formatApiValue('LIMITED')).toBe('Limited');
  });

  it('leaves identifiers and anything already readable as sent', () => {
    expect(formatApiValue('X1-DF55')).toBe('X1-DF55');
    expect(formatApiValue('VOYAGER-7-3')).toBe('VOYAGER-7-3');
    expect(formatApiValue('Already readable')).toBe('Already readable');
    expect(formatApiValue('')).toBe('');
  });
});

describe('coordinates: no thousands separators', () => {
  // Bug 2, found by testing: "-2,210, 405" reads as three numbers.
  it('formats the table example without separators', () => {
    expect(formatCoordinates(-2210, 405)).toBe('-2210, 405');
    expect(formatCoordinates(-2210, 405)).not.toBe('-2,210, 405');
    expect(formatCoordinates(-2210, 405)).not.toContain(',210');
  });
});

describe('tab titles: page first, then the app name', () => {
  it('formats the table example', () => {
    expect(formatPageTitle('VOYAGER-7-3')).toBe('VOYAGER-7-3 – SpaceTradersHQ');
  });
});
