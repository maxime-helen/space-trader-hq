const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

export const STALE_TIMES = {
  geography: HOUR,
  agent: 30 * SECOND,
  ships: 15 * SECOND,
  market: MINUTE,
  serverStatus: 5 * MINUTE,
} as const;

export type StaleTimeKey = keyof typeof STALE_TIMES;
