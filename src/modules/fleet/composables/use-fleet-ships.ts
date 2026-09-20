import { computed, type ComputedRef } from 'vue';

import { useShipsQuery } from '@/modules/fleet/api/queries';
import type { Ship } from '@/shared/api/types';

// The first page of the fleet.
export const useFleetShips = (): { ships: ComputedRef<readonly Ship[]>; isFetching: ComputedRef<boolean> } => {
  const { data, isFetching } = useShipsQuery(1);
  return {
    ships: computed<readonly Ship[]>(() => data.value?.data ?? []),
    isFetching: computed(() => isFetching.value),
  };
};
