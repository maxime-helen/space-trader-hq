import { parseWaypointSymbol } from './symbols';

export const SYSTEMS_PATH = '/systems';
export const FLEET_PATH = '/fleet';
export const MARKETS_PATH = '/markets';

export const systemPath = (systemSymbol: string): string => `${SYSTEMS_PATH}/${systemSymbol}`;

export const waypointPath = (systemSymbol: string, waypointSymbol: string): string =>
  `${systemPath(systemSymbol)}/waypoints/${waypointSymbol}`;

// The waypoint page for a bare waypoint symbol, or nothing when the symbol is not one.
export const waypointPathFor = (symbol: string): string | undefined => {
  const parsed = parseWaypointSymbol(symbol);
  return parsed === undefined ? undefined : waypointPath(parsed.system, parsed.waypoint);
};

export const shipPath = (shipSymbol: string): string => `${FLEET_PATH}/${shipSymbol}`;

// A market has no page of its own: it is the Market tab of its waypoint.
export const marketPath = (systemSymbol: string, waypointSymbol: string): string =>
  `${waypointPath(systemSymbol, waypointSymbol)}?tab=market`;
