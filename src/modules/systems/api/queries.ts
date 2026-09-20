import { keepPreviousData, useQuery, useQueryClient, type UseQueryReturnType } from '@tanstack/vue-query';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { apiClient, unwrap } from '@/shared/api/client';
import { STALE_TIMES } from '@/shared/api/stale-times';
import { MAX_PAGE_LIMIT, type Paginated, type Shipyard, type System, type Waypoint } from '@/shared/api/types';

import { systemKeys, type WaypointFilters } from './keys';

const GEOGRAPHY_GC_TIME = 24 * 60 * 60 * 1000;

type QueryToggle = { enabled?: MaybeRefOrGetter<boolean> };

const isEnabled = (options: QueryToggle | undefined, ...symbols: string[]): boolean =>
  (toValue(options?.enabled) ?? true) && symbols.every((symbol) => symbol.length > 0);

export const useSystemsQuery = (page: MaybeRefOrGetter<number>): UseQueryReturnType<Paginated<System>, Error> =>
  useQuery({
    queryKey: computed(() => systemKeys.list({ page: toValue(page) })),
    queryFn: async () =>
      unwrap(await apiClient.GET('/systems', { params: { query: { page: toValue(page), limit: MAX_PAGE_LIMIT } } })),
    staleTime: STALE_TIMES.geography,
    gcTime: GEOGRAPHY_GC_TIME,
    placeholderData: keepPreviousData,
  });

export const useSystemQuery = (
  systemSymbol: MaybeRefOrGetter<string>,
  options?: QueryToggle,
): UseQueryReturnType<System, Error> =>
  useQuery({
    queryKey: computed(() => systemKeys.detail(toValue(systemSymbol))),
    queryFn: async () =>
      unwrap(
        await apiClient.GET('/systems/{systemSymbol}', {
          params: { path: { systemSymbol: toValue(systemSymbol) } },
        }),
      ).data,
    staleTime: STALE_TIMES.geography,
    gcTime: GEOGRAPHY_GC_TIME,
    enabled: computed(() => isEnabled(options, toValue(systemSymbol))),
  });

export const useWaypointsQuery = (
  systemSymbol: MaybeRefOrGetter<string>,
  filters: MaybeRefOrGetter<WaypointFilters>,
  options?: QueryToggle,
): UseQueryReturnType<Paginated<Waypoint>, Error> =>
  useQuery({
    queryKey: computed(() => systemKeys.waypoints(toValue(systemSymbol), toValue(filters))),
    queryFn: async () => {
      const { page, type, traits } = toValue(filters);
      return unwrap(
        await apiClient.GET('/systems/{systemSymbol}/waypoints', {
          params: {
            path: { systemSymbol: toValue(systemSymbol) },
            query: {
              page: page ?? 1,
              limit: MAX_PAGE_LIMIT,
              ...(type === undefined ? {} : { type }),
              ...(traits === undefined || traits.length === 0 ? {} : { traits: [...traits] }),
            },
          },
        }),
      );
    },
    staleTime: STALE_TIMES.geography,
    gcTime: GEOGRAPHY_GC_TIME,
    placeholderData: keepPreviousData,
    enabled: computed(() => isEnabled(options, toValue(systemSymbol))),
  });

export const useWaypointQuery = (
  systemSymbol: MaybeRefOrGetter<string>,
  waypointSymbol: MaybeRefOrGetter<string>,
  options?: QueryToggle,
): UseQueryReturnType<Waypoint, Error> => {
  const queryClient = useQueryClient();

  const fromListCache = (): Waypoint | undefined => {
    const wanted = toValue(waypointSymbol);
    const pages = queryClient.getQueriesData<Paginated<Waypoint>>({
      queryKey: systemKeys.waypointsAll(toValue(systemSymbol)),
    });
    for (const [, page] of pages) {
      const found = page?.data.find((waypoint) => waypoint.symbol === wanted);
      if (found !== undefined) return found;
    }
    return undefined;
  };

  return useQuery({
    queryKey: computed(() => systemKeys.waypoint(toValue(systemSymbol), toValue(waypointSymbol))),
    queryFn: async () =>
      unwrap(
        await apiClient.GET('/systems/{systemSymbol}/waypoints/{waypointSymbol}', {
          params: { path: { systemSymbol: toValue(systemSymbol), waypointSymbol: toValue(waypointSymbol) } },
        }),
      ).data,
    staleTime: STALE_TIMES.geography,
    gcTime: GEOGRAPHY_GC_TIME,
    placeholderData: fromListCache,
    enabled: computed(() => isEnabled(options, toValue(systemSymbol), toValue(waypointSymbol))),
  });
};

export const useShipyardQuery = (
  systemSymbol: MaybeRefOrGetter<string>,
  waypointSymbol: MaybeRefOrGetter<string>,
  options?: QueryToggle,
): UseQueryReturnType<Shipyard, Error> =>
  useQuery({
    queryKey: computed(() => systemKeys.shipyard(toValue(systemSymbol), toValue(waypointSymbol))),
    queryFn: async () =>
      unwrap(
        await apiClient.GET('/systems/{systemSymbol}/waypoints/{waypointSymbol}/shipyard', {
          params: { path: { systemSymbol: toValue(systemSymbol), waypointSymbol: toValue(waypointSymbol) } },
        }),
      ).data,
    staleTime: STALE_TIMES.market,
    enabled: computed(() => isEnabled(options, toValue(systemSymbol), toValue(waypointSymbol))),
  });
