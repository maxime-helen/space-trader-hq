import { type QueryClient, useMutation, type UseMutationReturnType, useQueryClient } from '@tanstack/vue-query';
import { type MaybeRefOrGetter, toValue } from 'vue';

import { apiClient, unwrap } from '@/shared/api/client';
import type { Ship, ShipFuel, ShipNav } from '@/shared/api/types';

import { findShipInLists, writeShipIntoCaches } from './cache';
import { fleetKeys } from './keys';

const patchCachedShip = (queryClient: QueryClient, shipSymbol: string, patch: (ship: Ship) => Ship): void => {
  const cached =
    queryClient.getQueryData<Ship>(fleetKeys.detail(shipSymbol)) ?? findShipInLists(queryClient, shipSymbol)?.ship;
  if (cached === undefined) return;
  writeShipIntoCaches(queryClient, patch(cached));
};

type NavResult = { shipSymbol: string; nav: ShipNav };

type NavMutation = UseMutationReturnType<NavResult, Error, void, unknown>;

// Orbit and dock are the same shape: no body, and the response carries only the new `nav`.
const useNavStatusMutation = (
  shipSymbol: MaybeRefOrGetter<string>,
  path: '/my/ships/{shipSymbol}/orbit' | '/my/ships/{shipSymbol}/dock',
): NavMutation => {
  const queryClient = useQueryClient();

  return useMutation<NavResult>({
    mutationFn: async (): Promise<NavResult> => {
      const symbol = toValue(shipSymbol);
      const body = unwrap(await apiClient.POST(path, { params: { path: { shipSymbol: symbol } } }));
      return { shipSymbol: symbol, nav: body.data.nav };
    },
    onSuccess: ({ shipSymbol: symbol, nav }) => {
      patchCachedShip(queryClient, symbol, (ship) => ({ ...ship, nav }));
    },
  });
};

export const useOrbitShip = (shipSymbol: MaybeRefOrGetter<string>): NavMutation =>
  useNavStatusMutation(shipSymbol, '/my/ships/{shipSymbol}/orbit');

export const useDockShip = (shipSymbol: MaybeRefOrGetter<string>): NavMutation =>
  useNavStatusMutation(shipSymbol, '/my/ships/{shipSymbol}/dock');

type NavigateResult = NavResult & { fuel: ShipFuel; events: unknown[] };

type NavigateVariables = { waypointSymbol: string };

export const useNavigateShip = (
  shipSymbol: MaybeRefOrGetter<string>,
): UseMutationReturnType<NavigateResult, Error, NavigateVariables, unknown> => {
  const queryClient = useQueryClient();

  return useMutation<NavigateResult, Error, NavigateVariables>({
    mutationFn: async ({ waypointSymbol }: NavigateVariables): Promise<NavigateResult> => {
      const symbol = toValue(shipSymbol);
      const body = unwrap(
        await apiClient.POST('/my/ships/{shipSymbol}/navigate', {
          params: { path: { shipSymbol: symbol } },
          body: { waypointSymbol },
        }),
      );
      return { shipSymbol: symbol, nav: body.data.nav, fuel: body.data.fuel, events: body.data.events };
    },
    onSuccess: ({ shipSymbol: symbol, nav, fuel }) => {
      patchCachedShip(queryClient, symbol, (ship) => ({ ...ship, nav, fuel }));
    },
  });
};
