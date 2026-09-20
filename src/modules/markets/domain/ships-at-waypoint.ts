import type { Ship } from '@/shared/api/types';

export const shipsAtWaypoint = (ships: readonly Ship[], waypointSymbol: string): Ship[] =>
  ships.filter((ship) => ship.nav.status !== 'IN_TRANSIT' && ship.nav.waypointSymbol === waypointSymbol);
