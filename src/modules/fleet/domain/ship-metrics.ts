import type { Cooldown, ShipCargo, ShipFuel, ShipNavRoute, ShipNavStatus } from '@/shared/api/types';
import { formatApiValue, secondsUntil } from '@/shared/lib/format';

type ShipStatusVariant = 'docked' | 'orbit' | 'transit';

const STATUS_VARIANTS: Record<ShipNavStatus, ShipStatusVariant> = {
  DOCKED: 'docked',
  IN_ORBIT: 'orbit',
  IN_TRANSIT: 'transit',
};

const MS_PER_SECOND = 1000;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const fuelRatio = (fuel: ShipFuel): number | null =>
  fuel.capacity > 0 ? clamp01(fuel.current / fuel.capacity) : null;

export const cargoRatio = (cargo: ShipCargo): number | null =>
  cargo.capacity > 0 ? clamp01(cargo.units / cargo.capacity) : null;

export const transitProgress = (route: ShipNavRoute, now: number): number => {
  const departure = Date.parse(route.departureTime);
  const arrival = Date.parse(route.arrival);
  if (!Number.isFinite(departure) || !Number.isFinite(arrival)) return 0;
  if (arrival <= departure) return now >= arrival ? 1 : 0;
  return clamp01((now - departure) / (arrival - departure));
};

export const etaSeconds = (route: ShipNavRoute, now: number): number => secondsUntil(route.arrival, now);

export const cooldownRemaining = (cooldown: Cooldown | null | undefined, now: number): number => {
  if (cooldown === null || cooldown === undefined) return 0;
  if (cooldown.expiration !== undefined) return secondsUntil(cooldown.expiration, now);
  return Math.max(0, Math.floor(cooldown.remainingSeconds));
};

export const cooldownEndsAt = (cooldown: Cooldown | null | undefined, now: number): number | null => {
  const remaining = cooldownRemaining(cooldown, now);
  return remaining > 0 ? now + remaining * MS_PER_SECOND : null;
};

export const navStatusLabel = (status: ShipNavStatus): string => formatApiValue(status);

export const navStatusVariant = (status: ShipNavStatus): ShipStatusVariant => STATUS_VARIANTS[status];

export const isArriving = (status: ShipNavStatus, route: ShipNavRoute, now: number): boolean =>
  status === 'IN_TRANSIT' && etaSeconds(route, now) === 0;

// The system is worth a link of its own only when the ship is away from the headquarters system,
// or when the headquarters is not known yet.
export const needsSystemLink = (systemSymbol: string, homeSystemSymbol: string | undefined): boolean =>
  homeSystemSymbol === undefined || homeSystemSymbol !== systemSymbol;
