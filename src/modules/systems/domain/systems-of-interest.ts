import type { Agent, Ship } from '@/shared/api/types';
import { toSystemSymbol } from '@/shared/lib/symbols';

export type SystemOfInterest = {
  systemSymbol: string;
  shipCount: number;
  isHeadquarters: boolean;
};

export const systemsOfInterest = (
  agent: Pick<Agent, 'headquarters'> | undefined,
  ships: readonly Ship[] | undefined,
): SystemOfInterest[] => {
  const headquarters = agent === undefined ? undefined : toSystemSymbol(agent.headquarters);

  const shipCounts = new Map<string, number>();
  for (const ship of ships ?? []) {
    const systemSymbol = ship.nav.systemSymbol;
    if (systemSymbol.length === 0) continue;
    shipCounts.set(systemSymbol, (shipCounts.get(systemSymbol) ?? 0) + 1);
  }

  const withShips = [...shipCounts.keys()]
    .filter((symbol) => symbol !== headquarters)
    .sort((a, b) => a.localeCompare(b));
  const symbols = headquarters === undefined ? withShips : [headquarters, ...withShips];

  return symbols.map((systemSymbol) => ({
    systemSymbol,
    shipCount: shipCounts.get(systemSymbol) ?? 0,
    isHeadquarters: systemSymbol === headquarters,
  }));
};

export const shipsByWaypoint = (ships: readonly Ship[] | undefined): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const ship of ships ?? []) {
    const waypointSymbol = ship.nav.waypointSymbol;
    if (waypointSymbol.length === 0) continue;
    counts.set(waypointSymbol, (counts.get(waypointSymbol) ?? 0) + 1);
  }
  return counts;
};
