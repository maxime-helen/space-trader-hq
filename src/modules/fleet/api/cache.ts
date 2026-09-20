import type { QueryClient } from '@tanstack/vue-query';

import type { Paginated, Ship } from '@/shared/api/types';

import { fleetKeys } from './keys';

const isShip = (value: unknown): value is Ship =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { symbol?: unknown }).symbol === 'string' &&
  typeof (value as { nav?: unknown }).nav === 'object';

const isShipPage = (value: unknown): value is Paginated<Ship> =>
  typeof value === 'object' && value !== null && Array.isArray((value as { data?: unknown }).data);

const shipsIn = (data: unknown): readonly Ship[] => {
  if (isShip(data)) return [data];
  if (isShipPage(data)) return data.data.filter((entry) => isShip(entry));
  return [];
};

export const readCachedShips = (queryClient: QueryClient): Ship[] => {
  const newest = new Map<string, { ship: Ship; updatedAt: number }>();

  for (const query of queryClient.getQueryCache().findAll({ queryKey: fleetKeys.all() })) {
    const updatedAt = query.state.dataUpdatedAt;
    for (const ship of shipsIn(query.state.data)) {
      const current = newest.get(ship.symbol);
      if (current === undefined || updatedAt >= current.updatedAt) newest.set(ship.symbol, { ship, updatedAt });
    }
  }

  return [...newest.values()].map((entry) => entry.ship);
};

export const writeShipIntoCaches = (queryClient: QueryClient, ship: Ship): void => {
  queryClient.setQueryData(fleetKeys.detail(ship.symbol), ship);

  queryClient.setQueriesData<Paginated<Ship>>({ queryKey: fleetKeys.lists() }, (page) => {
    if (page === undefined || !page.data.some((entry) => entry.symbol === ship.symbol)) return page;
    return { ...page, data: page.data.map((entry) => (entry.symbol === ship.symbol ? ship : entry)) };
  });
};

export const findShipInLists = (
  queryClient: QueryClient,
  shipSymbol: string,
): { ship: Ship; updatedAt: number } | undefined => {
  for (const query of queryClient.getQueryCache().findAll({ queryKey: fleetKeys.lists() })) {
    const match = shipsIn(query.state.data).find((ship) => ship.symbol === shipSymbol);
    if (match !== undefined) return { ship: match, updatedAt: query.state.dataUpdatedAt };
  }
  return undefined;
};
