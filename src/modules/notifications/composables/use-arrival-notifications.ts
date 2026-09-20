import { useQueryClient } from '@tanstack/vue-query';
import { useDocumentVisibility } from '@vueuse/core';
import { onScopeDispose, watch } from 'vue';

import { useSessionStore } from '@/modules/auth';
import { readCachedShips, writeShipIntoCaches } from '@/modules/fleet';
import {
  arrivalsDueAt,
  arrivalToast,
  collectArrivals,
  type PendingArrival,
  timerDelayMs,
} from '@/modules/notifications/domain/arrivals';
import { apiClient, unwrap } from '@/shared/api/client';
import { useToasts } from '@/shared/composables/use-toasts';

const DATA_EVENTS: ReadonlySet<string> = new Set(['added', 'removed', 'updated']);

export const useArrivalNotifications = (): void => {
  const queryClient = useQueryClient();
  const session = useSessionStore();
  const toasts = useToasts();
  const visibility = useDocumentVisibility();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const handled = new Set<string>();
  let deferred: PendingArrival[] = [];

  const cancelTimer = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  const upcoming = (): PendingArrival[] =>
    collectArrivals(readCachedShips(queryClient)).filter((arrival) => !handled.has(arrival.key));

  const notify = async (arrival: PendingArrival): Promise<void> => {
    try {
      const response = await apiClient.GET('/my/ships/{shipSymbol}', {
        params: { path: { shipSymbol: arrival.shipSymbol } },
      });
      const ship = unwrap(response).data;
      writeShipIntoCaches(queryClient, ship);
      toasts.push(arrivalToast(arrival, ship.nav.waypointSymbol));
    } catch {
      // An arriving ship is always in orbit at its destination, so the toast is still
      // true. The cache is left alone and the next automatic refresh corrects it.
      toasts.push(arrivalToast(arrival));
    }
  };

  const flush = async (): Promise<void> => {
    const due = deferred;
    deferred = [];
    // One request per ship, all through the same token bucket, which serializes them for us.
    await Promise.all(due.map((arrival) => notify(arrival)));
  };

  const schedule = (): void => {
    cancelTimer();
    if (!session.isAuthenticated) return;
    const next = upcoming()[0];
    if (next === undefined) return;
    timer = setTimeout(
      () => {
        runPass();
      },
      timerDelayMs(next.arrivalAt, Date.now()),
    );
  };

  const runPass = (): void => {
    timer = undefined;
    const due = arrivalsDueAt(upcoming(), Date.now());
    if (due.length === 0) {
      // Nothing is actually due: the wait was longer than a timer can hold, so arm the next leg
      // instead of firing early.
      schedule();
      return;
    }
    // Claimed before anything async starts, so a cache event mid-flight can't queue them again.
    for (const arrival of due) handled.add(arrival.key);
    deferred = [...deferred, ...due];
    schedule();
    // A hidden tab requests nothing; the arrivals wait in `deferred`.
    if (visibility.value !== 'hidden') void flush();
  };

  const cancel = (): void => {
    cancelTimer();
    deferred = [];
    handled.clear();
    toasts.clear();
  };

  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (DATA_EVENTS.has(event.type)) schedule();
  });

  watch(visibility, (state) => {
    if (state === 'hidden' || deferred.length === 0) return;
    void flush();
  });

  watch(
    () => session.isAuthenticated,
    (isAuthenticated) => {
      if (isAuthenticated) schedule();
      else cancel();
    },
  );

  onScopeDispose(() => {
    unsubscribe();
    cancelTimer();
  });

  schedule();
};
