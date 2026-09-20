import type { Ship } from '@/modules/fleet';
import type { ToastInput } from '@/shared/composables/use-toasts';

export const ARRIVAL_WINDOW_MS = 2000;

export const MAX_TIMER_MS = 2_147_483_647;

export type PendingArrival = {
  shipSymbol: string;
  destination: string;
  arrivalAt: number;
  key: string;
};

export const arrivalKey = (shipSymbol: string, arrivalAt: number): string =>
  `${shipSymbol}@${new Date(arrivalAt).toISOString()}`;

export const toArrival = (ship: Ship): PendingArrival | undefined => {
  if (ship.nav.status !== 'IN_TRANSIT') return undefined;
  const arrivalAt = Date.parse(ship.nav.route.arrival);
  if (!Number.isFinite(arrivalAt)) return undefined;
  return {
    shipSymbol: ship.symbol,
    destination: ship.nav.route.destination.symbol,
    arrivalAt,
    key: arrivalKey(ship.symbol, arrivalAt),
  };
};

export const collectArrivals = (ships: readonly Ship[]): PendingArrival[] =>
  ships
    .map((ship) => toArrival(ship))
    .filter((arrival): arrival is PendingArrival => arrival !== undefined)
    .sort((left, right) => left.arrivalAt - right.arrivalAt);

export const arrivalsDueAt = (
  arrivals: readonly PendingArrival[],
  now: number,
  windowMs: number = ARRIVAL_WINDOW_MS,
): PendingArrival[] => arrivals.filter((arrival) => arrival.arrivalAt <= now + windowMs);

export const timerDelayMs = (target: number, now: number): number => Math.min(Math.max(0, target - now), MAX_TIMER_MS);

export const shipPath = (shipSymbol: string): string => `/fleet/${encodeURIComponent(shipSymbol)}`;

export const arrivalToast = (arrival: PendingArrival, waypointSymbol?: string): ToastInput => ({
  badge: 'Arrived',
  badgeVariant: 'orbit',
  subject: arrival.shipSymbol,
  message: `arrived at ${waypointSymbol ?? arrival.destination}`,
  action: { label: 'View ship', to: shipPath(arrival.shipSymbol) },
});
