import type { Ship, ShipNavStatus } from '@/shared/api/types';

export type ShipStatusCounts = Record<ShipNavStatus, number>;

const EMPTY_COUNTS: ShipStatusCounts = { DOCKED: 0, IN_ORBIT: 0, IN_TRANSIT: 0 };

export const countByStatus = (ships: readonly Ship[]): ShipStatusCounts => {
  const counts: ShipStatusCounts = { ...EMPTY_COUNTS };
  for (const ship of ships) counts[ship.nav.status] += 1;
  return counts;
};
