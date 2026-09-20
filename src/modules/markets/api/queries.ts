import { useQuery, type UseQueryReturnType } from '@tanstack/vue-query';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { apiClient, unwrap } from '@/shared/api/client';
import { STALE_TIMES } from '@/shared/api/stale-times';
import { type Market, MAX_PAGE_LIMIT, type Waypoint } from '@/shared/api/types';

import { marketKeys } from './keys';

const MARKETPLACE_TRAIT = 'MARKETPLACE';

const fetchMarketplaces = async (systemSymbol: string): Promise<Waypoint[]> => {
  const marketplaces: Waypoint[] = [];

  for (let page = 1; ; page += 1) {
    const body = unwrap(
      await apiClient.GET('/systems/{systemSymbol}/waypoints', {
        params: { path: { systemSymbol }, query: { traits: MARKETPLACE_TRAIT, page, limit: MAX_PAGE_LIMIT } },
      }),
    );
    marketplaces.push(...body.data);
    // An empty page also stops the loop, so a server that disagrees with its own `meta` cannot
    // spin this forever.
    if (body.data.length === 0 || marketplaces.length >= body.meta.total) return marketplaces;
  }
};

const fetchMarket = async (systemSymbol: string, waypointSymbol: string): Promise<Market> =>
  unwrap(
    await apiClient.GET('/systems/{systemSymbol}/waypoints/{waypointSymbol}/market', {
      params: { path: { systemSymbol, waypointSymbol } },
    }),
  ).data;

export const useMarketplacesQuery = (systemSymbol: MaybeRefOrGetter<string>): UseQueryReturnType<Waypoint[], Error> =>
  useQuery({
    // A computed key, not a snapshot of one: the panel and the index are reused across waypoints,
    // and a key frozen at setup time would keep showing the first market's data.
    queryKey: computed(() => marketKeys.marketplaces(toValue(systemSymbol))),
    queryFn: async () => fetchMarketplaces(toValue(systemSymbol)),
    staleTime: STALE_TIMES.geography,
  });

export const useMarketQuery = (
  systemSymbol: MaybeRefOrGetter<string>,
  waypointSymbol: MaybeRefOrGetter<string>,
): UseQueryReturnType<Market, Error> =>
  useQuery({
    queryKey: computed(() => marketKeys.detail(toValue(systemSymbol), toValue(waypointSymbol))),
    queryFn: async () => fetchMarket(toValue(systemSymbol), toValue(waypointSymbol)),
    staleTime: STALE_TIMES.market,
  });
