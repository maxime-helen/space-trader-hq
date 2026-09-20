// The systems module's public API.
//
// Everything else in `modules/systems/` is private. What leaves the module is the route table, the
// five read queries with the cache keys they use, and the domain functions — `systemsOfInterest` is
// public because the markets module lists marketplaces in exactly those systems.

export { systemKeys } from './api/keys';
export { useShipyardQuery, useSystemQuery, useSystemsQuery, useWaypointQuery, useWaypointsQuery } from './api/queries';
export { buildWaypointTree, filterTreeByType, hasTrait, systemsOfInterest } from './domain';
export { systemsRoutes } from './routes';
