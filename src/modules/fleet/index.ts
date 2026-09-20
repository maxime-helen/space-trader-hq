// The fleet module's public API. What leaves the module is the route table, the two queries, the
// key factory, the `Ship` type, the ship composables, and the two cache helpers the arrival
// scheduler stands on: `readCachedShips` to see every ship already loaded, `writeShipIntoCaches` to
// put a refetched one back into every view that shows it. The ship-action mutations stay private:
// only the fleet's own action bar commands a ship.

export { readCachedShips, writeShipIntoCaches } from './api/cache';
export { fleetKeys } from './api/keys';
export { useShipQuery, useShipsQuery } from './api/queries';
export { useFleetShips } from './composables/use-fleet-ships';
export { fleetRoutes } from './routes';
export type { Ship } from '@/shared/api/types';
