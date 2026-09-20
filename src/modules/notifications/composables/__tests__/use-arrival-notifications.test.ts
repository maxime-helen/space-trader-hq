import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';

import { useSessionStore } from '@/modules/auth';
import { fleetKeys, type Ship } from '@/modules/fleet';
import { useArrivalNotifications } from '@/modules/notifications/composables/use-arrival-notifications';
import { MAX_TIMER_MS } from '@/modules/notifications/domain/arrivals';
import { buildPage, buildShip } from '@/shared/api/__tests__/fixtures';
import { apiErrorResponse, createRequestCounter, mockGet } from '@/shared/api/__tests__/handlers';
import { setupApiMocks } from '@/shared/api/__tests__/server';
import type { Paginated } from '@/shared/api/types';
import { useToasts } from '@/shared/composables/use-toasts';

const server = setupApiMocks();
const toasts = useToasts();

const DESTINATION = 'X1-DF55-B7';
const ORIGIN = 'X1-DF55-A1';

let clockStart = Date.now() + 60_000;

let counter: ReturnType<typeof createRequestCounter>;
let queryClient: QueryClient;

let respondWithShip: (shipSymbol: string) => { data: Ship } | Response;

const inTransit = (symbol: string, arrivesInMs: number, destination = DESTINATION): Ship =>
  buildShip({
    symbol,
    nav: {
      status: 'IN_TRANSIT',
      waypointSymbol: ORIGIN,
      route: {
        origin: { symbol: ORIGIN },
        destination: { symbol: destination },
        departureTime: new Date(Date.now()).toISOString(),
        arrival: new Date(Date.now() + arrivesInMs).toISOString(),
      },
    },
  });

const arrived = (symbol: string, waypoint = DESTINATION): Ship =>
  buildShip({
    symbol,
    nav: { status: 'IN_ORBIT', waypointSymbol: waypoint, route: { destination: { symbol: waypoint } } },
  });

const layout = defineComponent({
  name: 'LayoutStandIn',
  setup: () => {
    useArrivalNotifications();
    return () => null;
  },
});

const mountLayout = () => mount(layout, { global: { plugins: [[VueQueryPlugin, { queryClient }]] } });

const idle = async (turns = 8): Promise<void> => {
  for (let turn = 0; turn < turns; turn += 1) {
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
  }
};

const waitUntil = async (predicate: () => boolean, what: string): Promise<void> => {
  for (let turn = 0; turn < 500; turn += 1) {
    if (predicate()) return;
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
  }
  throw new Error(`timed out waiting for ${what}`);
};

const advance = async (ms: number): Promise<void> => {
  await vi.advanceTimersByTimeAsync(ms);
  await idle();
};

const setVisibility = async (state: DocumentVisibilityState): Promise<void> => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
  await nextTick();
};

const cachedShip = (symbol: string): Ship | undefined => queryClient.getQueryData<Ship>(fleetKeys.detail(symbol));

const cachedRow = (symbol: string, page = 1): Ship | undefined =>
  queryClient.getQueryData<Paginated<Ship>>(fleetKeys.list({ page }))?.data.find((entry) => entry.symbol === symbol);

const subjects = (): (string | undefined)[] => toasts.toasts.value.map((toast) => toast.subject);

beforeEach(async () => {
  vi.useFakeTimers({ now: clockStart, toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  setActivePinia(createPinia());
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  toasts.clear();
  await setVisibility('visible');

  // `gcTime: Infinity` keeps the seeded ships in the cache however far the fake clock is advanced:
  // garbage collection is not what these tests are about, and a 30-day flight would outlive it.
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Number.POSITIVE_INFINITY } } });

  const session = useSessionStore();
  // The real effects navigate and clear the cache; neither belongs in a scheduler test.
  session.attachEffects({ navigate: () => undefined, clearCache: () => undefined });
  session.signIn('test-token');

  respondWithShip = (shipSymbol) => ({ data: arrived(shipSymbol) });
  server.use(mockGet('/my/ships/{shipSymbol}', ({ params }) => respondWithShip(String(params.shipSymbol))));

  // Registered last, so MSW puts it first and it sees every request before anything answers it.
  counter = createRequestCounter();
  server.use(counter.handler);
});

afterEach(() => {
  toasts.clear();
  queryClient.clear();
  // Read while the clock is still fake: the next test starts from here, never before it.
  clockStart = Date.now() + 60_000;
  vi.useRealTimers();
});

describe('useArrivalNotifications', () => {
  it('tracks the ships already in the cache and fetches nothing to do it', async () => {
    queryClient.setQueryData(fleetKeys.detail('SHIP-1'), inTransit('SHIP-1', 60_000));
    queryClient.setQueryData(fleetKeys.list({ page: 1 }), buildPage([inTransit('SHIP-2', 90_000)]));

    mountLayout();
    await advance(30_000);

    expect(counter.count()).toBe(0);
    expect(toasts.toasts.value).toHaveLength(0);
  });

  it('sets its one timer for the soonest arrival and resets it when the cache changes', async () => {
    queryClient.setQueryData(fleetKeys.detail('SHIP-LATE'), inTransit('SHIP-LATE', 60_000));
    mountLayout();

    // A nearer arrival appears: the timer must move to it.
    queryClient.setQueryData(fleetKeys.list({ page: 1 }), buildPage([inTransit('SHIP-SOON', 5000)]));

    await advance(5000);
    await waitUntil(() => counter.count() === 1, 'the nearer arrival');
    expect(subjects()).toEqual(['SHIP-SOON']);

    // ...and the later one still gets its own pass, 55 seconds later — by which time the first
    // toast has long since taken its six seconds and gone.
    await advance(55_000);
    await waitUntil(() => counter.count() === 2, 'the later arrival');
    expect(subjects()).toEqual(['SHIP-LATE']);
  });

  it('refetches the arrived ship once and updates the fleet list and the ship page', async () => {
    const flying = inTransit('VOYAGER-7-3', 5000);
    queryClient.setQueryData(fleetKeys.list({ page: 1 }), buildPage([flying, buildShip({ symbol: 'SHIP-DOCKED' })]));
    queryClient.setQueryData(fleetKeys.detail('VOYAGER-7-3'), flying);

    mountLayout();
    await advance(5000);
    await waitUntil(() => counter.count() > 0, 'the arrival refetch');

    // One request for the ship, however many caches it was in.
    expect(counter.count()).toBe(1);
    expect(cachedShip('VOYAGER-7-3')?.nav.status).toBe('IN_ORBIT');
    expect(cachedRow('VOYAGER-7-3')?.nav.status).toBe('IN_ORBIT');
    expect(cachedRow('VOYAGER-7-3')?.nav.waypointSymbol).toBe(DESTINATION);
    // The rest of the page is untouched.
    expect(cachedRow('SHIP-DOCKED')?.nav.status).toBe('DOCKED');
  });

  it('toasts "SHIP arrived at WAYPOINT" with a link to the ship page', async () => {
    queryClient.setQueryData(fleetKeys.detail('VOYAGER-7-3'), inTransit('VOYAGER-7-3', 5000));

    mountLayout();
    await advance(5000);
    await waitUntil(() => toasts.toasts.value.length > 0, 'the arrival toast');

    expect(toasts.toasts.value[0]).toMatchObject({
      badge: 'Arrived',
      badgeVariant: 'orbit',
      subject: 'VOYAGER-7-3',
      message: `arrived at ${DESTINATION}`,
      action: { label: 'View ship', to: '/fleet/VOYAGER-7-3' },
    });
  });

  it('requests nothing while the tab is hidden and catches up when it comes back', async () => {
    queryClient.setQueryData(fleetKeys.detail('VOYAGER-7-3'), inTransit('VOYAGER-7-3', 5000));

    mountLayout();
    await setVisibility('hidden');
    await advance(10_000);

    expect(counter.count()).toBe(0);
    expect(toasts.toasts.value).toHaveLength(0);
    expect(cachedShip('VOYAGER-7-3')?.nav.status).toBe('IN_TRANSIT');

    await setVisibility('visible');
    await waitUntil(() => counter.count() === 1, 'the deferred refetch');
    await idle();

    expect(counter.count()).toBe(1);
    expect(subjects()).toEqual(['VOYAGER-7-3']);
    expect(cachedShip('VOYAGER-7-3')?.nav.status).toBe('IN_ORBIT');
  });

  it('still toasts with the route destination when the refetch fails', async () => {
    queryClient.setQueryData(fleetKeys.detail('VOYAGER-7-3'), inTransit('VOYAGER-7-3', 5000));
    respondWithShip = () => apiErrorResponse(500);

    mountLayout();
    await advance(5000);
    await waitUntil(() => toasts.toasts.value.length > 0, 'the toast after a failed refetch');
    await idle();

    expect(counter.count()).toBe(1);
    expect(toasts.toasts.value[0]).toMatchObject({
      subject: 'VOYAGER-7-3',
      message: `arrived at ${DESTINATION}`,
    });
    // The cache is left alone; the next automatic refresh corrects it.
    expect(cachedShip('VOYAGER-7-3')?.nav.status).toBe('IN_TRANSIT');
  });

  it('cancels the timer, drops pending arrivals and clears toasts on sign-out', async () => {
    queryClient.setQueryData(fleetKeys.detail('VOYAGER-7-3'), inTransit('VOYAGER-7-3', 5000));
    toasts.push({ subject: 'SHIP-EARLIER', message: 'arrived at X1-DF55-A1' });

    mountLayout();
    useSessionStore().signOut();
    await nextTick();
    await advance(60_000);

    expect(counter.count()).toBe(0);
    expect(toasts.toasts.value).toHaveLength(0);
  });

  it('re-arms a delay longer than the browser can hold instead of firing early', async () => {
    const inThirtyDays = 30 * 24 * 60 * 60 * 1000;
    queryClient.setQueryData(fleetKeys.detail('SHIP-FAR'), inTransit('SHIP-FAR', inThirtyDays));

    mountLayout();

    // The first leg is the maximum a timer can hold; it comes back with nothing due.
    await advance(MAX_TIMER_MS);
    expect(counter.count()).toBe(0);
    expect(toasts.toasts.value).toHaveLength(0);

    // The re-armed timer covers what is left.
    await advance(inThirtyDays - MAX_TIMER_MS);
    await waitUntil(() => counter.count() === 1, 'the arrival after the re-armed timer');

    expect(subjects()).toEqual(['SHIP-FAR']);
  });

  it('stops scheduling once the layout is unmounted', async () => {
    queryClient.setQueryData(fleetKeys.detail('VOYAGER-7-3'), inTransit('VOYAGER-7-3', 5000));

    mountLayout().unmount();
    await advance(60_000);

    expect(counter.count()).toBe(0);
    expect(toasts.toasts.value).toHaveLength(0);
  });
});
