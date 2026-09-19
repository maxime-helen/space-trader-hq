const LOCALE = 'en-US';

const APP_NAME = 'SpaceTradersHQ';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;
const MS_PER_SECOND = 1000;

const US_NUMBER = new Intl.NumberFormat(LOCALE);

const TIME_OPTIONS: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
const DATE_OPTIONS: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const API_VALUE_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

export type TimeInput = Date | number | string;

const formatters = new Map<string, Intl.DateTimeFormat>();

const dateTimeFormatter = (kind: string, options: Intl.DateTimeFormatOptions, timeZone: string | undefined) => {
  const key = `${kind}|${timeZone ?? ''}`;
  const cached = formatters.get(key);
  if (cached !== undefined) return cached;
  const created = new Intl.DateTimeFormat(LOCALE, timeZone === undefined ? options : { ...options, timeZone });
  formatters.set(key, created);
  return created;
};

const toDate = (value: TimeInput): Date => (value instanceof Date ? value : new Date(value));

const toEpochMs = (value: TimeInput): number => (typeof value === 'number' ? value : toDate(value).getTime());

const pad2 = (value: number): string => String(value).padStart(2, '0');

export const formatNumber = (value: number): string => US_NUMBER.format(value);

export const formatCredits = (value: number): string => `${US_NUMBER.format(value)} cr`;

export const formatCountdown = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  if (seconds < SECONDS_PER_MINUTE) return `${String(seconds)}s`;
  if (seconds < SECONDS_PER_HOUR) {
    return `${String(Math.floor(seconds / SECONDS_PER_MINUTE))}min${pad2(seconds % SECONDS_PER_MINUTE)}s`;
  }
  if (seconds < SECONDS_PER_DAY) {
    const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    return `${String(Math.floor(seconds / SECONDS_PER_HOUR))}h${pad2(minutes)}min`;
  }
  const hours = Math.floor((seconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
  return `${String(Math.floor(seconds / SECONDS_PER_DAY))}d${pad2(hours)}h`;
};

export const secondsSince = (timestamp: TimeInput, now: number): number =>
  Math.max(0, Math.floor((now - toEpochMs(timestamp)) / MS_PER_SECOND));

export const secondsUntil = (target: TimeInput, now: number): number =>
  Math.max(0, Math.floor((toEpochMs(target) - now) / MS_PER_SECOND));

export const isElapsed = (target: TimeInput, now: number): boolean => toEpochMs(target) <= now;

export const formatEta = (arrival: TimeInput, now: number): string =>
  isElapsed(arrival, now) ? 'Arriving' : `ETA ${formatCountdown(secondsUntil(arrival, now))}`;

export const formatCooldown = (expiration: TimeInput | null | undefined, now: number): string =>
  expiration === null || expiration === undefined || isElapsed(expiration, now)
    ? 'Ready'
    : formatCountdown(secondsUntil(expiration, now));

export const formatResetCountdown = (reset: TimeInput, now: number): string =>
  isElapsed(reset, now) ? 'Resetting now' : formatCountdown(secondsUntil(reset, now));

export const formatClockTime = (value: TimeInput, timeZone?: string): string =>
  dateTimeFormatter('time', TIME_OPTIONS, timeZone).format(toDate(value));

export const formatDate = (value: TimeInput, timeZone?: string): string => {
  const zone = timeZone ?? (typeof value === 'string' && DATE_ONLY_PATTERN.test(value) ? 'UTC' : undefined);
  return dateTimeFormatter('date', DATE_OPTIONS, zone).format(toDate(value));
};

export const formatApiValue = (value: string): string => {
  if (!API_VALUE_PATTERN.test(value)) return value;
  const words = value.toLowerCase().split('_').join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const formatCoordinates = (x: number, y: number): string => `${String(x)}, ${String(y)}`;

export const formatPageTitle = (page: string): string => `${page} – ${APP_NAME}`;
