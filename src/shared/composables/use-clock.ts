import { useIntervalFn, useNow } from '@vueuse/core';
import { computed, type ComputedRef } from 'vue';

const TICK_MS = 1000;

export const useClock = (): ComputedRef<number> => {
  const now = useNow({ scheduler: (update) => useIntervalFn(update, TICK_MS) });
  return computed(() => now.value.getTime());
};
