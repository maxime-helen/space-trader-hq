import type { WaypointTrait, WaypointTraitSymbol } from '@/shared/api/types';

export const hasTrait = (
  waypoint: { traits?: readonly WaypointTrait[] } | undefined,
  symbol: WaypointTraitSymbol,
): boolean => waypoint?.traits?.some((trait) => trait.symbol === symbol) ?? false;
