import { keepPreviousData, useQuery, useQueryClient, type UseQueryReturnType } from '@tanstack/vue-query';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { apiClient, unwrap } from '@/shared/api/client';
import { STALE_TIMES } from '@/shared/api/stale-times';
import { MAX_PAGE_LIMIT, type Paginated, type Ship } from '@/shared/api/types';

import { findShipInLists } from './cache';
import { fleetKeys } from './keys';

export const useShipsQuery = (page: MaybeRefOrGetter<number>): UseQueryReturnType<Paginated<Ship>, Error> =>
  useQuery({
    queryKey: computed(() => fleetKeys.list({ page: toValue(page) })),
    queryFn: async () =>
      unwrap(await apiClient.GET('/my/ships', { params: { query: { page: toValue(page), limit: MAX_PAGE_LIMIT } } })),
    staleTime: STALE_TIMES.ships,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
  });

export const useShipQuery = (shipSymbol: MaybeRefOrGetter<string>): UseQueryReturnType<Ship, Error> => {
  const queryClient = useQueryClient();
  const cachedRow = () => findShipInLists(queryClient, toValue(shipSymbol));

  return useQuery({
    queryKey: computed(() => fleetKeys.detail(toValue(shipSymbol))),
    queryFn: async () =>
      unwrap(await apiClient.GET('/my/ships/{shipSymbol}', { params: { path: { shipSymbol: toValue(shipSymbol) } } }))
        .data,
    staleTime: STALE_TIMES.ships,
    initialData: () => cachedRow()?.ship,
    // Aged from when the list was fetched, not from when the ship was opened: a fresh list costs
    // no request, a stale one refetches at once.
    initialDataUpdatedAt: () => cachedRow()?.updatedAt,
  });
};
