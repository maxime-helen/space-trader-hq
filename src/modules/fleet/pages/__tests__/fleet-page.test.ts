import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import type { Router } from 'vue-router';

import { agentKeys } from '@/modules/agent';
import FleetPage from '@/modules/fleet/pages/fleet-page.vue';
import { buildAgent, buildPage, buildShip } from '@/shared/api/__tests__/fixtures';
import { apiErrorResponse, mockGet } from '@/shared/api/__tests__/handlers';
import { setupApiMocks } from '@/shared/api/__tests__/server';
import { createTestQueryClient, createTestRouter, WAIT } from '@/shared/api/__tests__/test-support';
import type { Ship } from '@/shared/api/types';

const server = setupApiMocks();

const HOME_SYSTEM = 'X1-AB12';
const AWAY_SYSTEM = 'X1-ZZ99';

const arrivalIn = (seconds: number): string => new Date(Date.now() + seconds * 1000).toISOString();

const docked = (): Ship =>
  buildShip({
    symbol: 'ALICE-1',
    registration: { name: 'Voyager', role: 'COMMAND' },
    nav: { status: 'DOCKED', flightMode: 'CRUISE', systemSymbol: HOME_SYSTEM, waypointSymbol: 'X1-AB12-A1' },
    fuel: { current: 300, capacity: 400 },
    cargo: { units: 10, capacity: 40 },
  });

const inOrbit = (): Ship =>
  buildShip({
    symbol: 'ALICE-2',
    registration: { name: 'Eye', role: 'SATELLITE' },
    nav: { status: 'IN_ORBIT', flightMode: 'BURN', systemSymbol: AWAY_SYSTEM, waypointSymbol: 'X1-ZZ99-C3' },
    fuel: { current: 0, capacity: 0 },
    cargo: { units: 0, capacity: 0 },
    cooldown: { remainingSeconds: 42 },
  });

const inTransit = (): Ship =>
  buildShip({
    symbol: 'ALICE-3',
    registration: { name: 'Runner', role: 'HAULER' },
    nav: {
      status: 'IN_TRANSIT',
      systemSymbol: HOME_SYSTEM,
      waypointSymbol: 'X1-AB12-A1',
      route: { destination: { symbol: 'X1-AB12-B7', systemSymbol: HOME_SYSTEM }, arrival: arrivalIn(600) },
    },
  });

const FIRST_PAGE_SHIPS = [docked(), inOrbit(), inTransit()];
const SECOND_PAGE_SHIP = buildShip({ symbol: 'ALICE-21', registration: { name: 'Latecomer' } });

const twoPages = () =>
  mockGet('/my/ships', ({ url }) => {
    const page = Number(url.searchParams.get('page') ?? '1');
    return buildPage(page === 1 ? FIRST_PAGE_SHIPS : [SECOND_PAGE_SHIP], { total: 40, page, limit: 20 });
  });

const testRouter = (): Router => createTestRouter([{ path: '/fleet', component: FleetPage }]);

const withCachedAgent = (): QueryClient => {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(agentKeys.me(), buildAgent());
  return queryClient;
};

const mountPage = async (initialPath = '/fleet', queryClient: QueryClient = createTestQueryClient()) => {
  const router = testRouter();
  await router.push(initialPath);
  await router.isReady();
  const wrapper = mount(FleetPage, { global: { plugins: [[VueQueryPlugin, { queryClient }], router] } });
  return { wrapper, router };
};

type Wrapper = Awaited<ReturnType<typeof mountPage>>['wrapper'];

const untilRowsShown = async (wrapper: Wrapper): Promise<void> => {
  await vi.waitFor(() => {
    expect(wrapper.findAll('tbody tr').length).toBeGreaterThan(0);
  }, WAIT);
};

const headers = (wrapper: Wrapper): string[] => wrapper.findAll('thead th').map((cell) => cell.text());

const rowText = (wrapper: Wrapper, index: number): string => wrapper.findAll('tbody tr')[index]?.text() ?? '';

afterEach(() => {
  server.events.removeAllListeners();
});

describe('FleetPage', () => {
  it('lists ships with the columns of 7.4, in its order', async () => {
    server.use(twoPages());
    const { wrapper } = await mountPage();
    await untilRowsShown(wrapper);

    expect(headers(wrapper)).toEqual([
      'Ship',
      'Name',
      'Role',
      'Status',
      'Location',
      'Flight mode',
      'Fuel',
      'Cargo',
      'Cooldown',
    ]);
    expect(wrapper.findAll('tbody tr')).toHaveLength(3);
    expect(rowText(wrapper, 0)).toContain('ALICE-1');
    expect(rowText(wrapper, 0)).toContain('Voyager');
    expect(rowText(wrapper, 0)).toContain('Command');
    expect(rowText(wrapper, 0)).toContain('Cruise');
  });

  it('keeps the page in ?page=, and the previous rows on screen while the next loads', async () => {
    server.use(twoPages());
    const { wrapper, router } = await mountPage('/fleet', withCachedAgent());
    await untilRowsShown(wrapper);

    await wrapper.find('.base-pagination-step:last-of-type').trigger('click');
    await nextTick();
    await flushPromises();

    expect(router.currentRoute.value.query.page).toBe('2');
    expect(rowText(wrapper, 0)).toContain('ALICE-1');
    expect(wrapper.find('.base-spinner').exists()).toBe(true);

    await vi.waitFor(() => {
      expect(rowText(wrapper, 0)).toContain('ALICE-21');
    }, WAIT);
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
  });

  it('spins first, and shows nothing of the table', async () => {
    server.use(twoPages());
    const { wrapper } = await mountPage();

    expect(wrapper.find('.base-spinner').exists()).toBe(true);
    expect(wrapper.find('table').exists()).toBe(false);
  });

  it('names what failed and offers "Try again"', async () => {
    server.use(mockGet('/my/ships', () => apiErrorResponse(500)));
    const { wrapper } = await mountPage();

    await vi.waitFor(() => {
      expect(wrapper.find('.query-state-error').exists()).toBe(true);
    }, WAIT);
    expect(wrapper.find('.query-state-error').text()).toContain("Couldn't load your ships.");
    expect(wrapper.find('.query-state-error button').text()).toBe('Try again');
  });

  it('explains an empty fleet rather than showing an empty table', async () => {
    server.use(mockGet('/my/ships', () => buildPage<Ship>([], { total: 0, page: 1, limit: 20 })));
    const { wrapper } = await mountPage();

    await vi.waitFor(() => {
      expect(wrapper.find('.query-state-empty').exists()).toBe(true);
    }, WAIT);
    expect(wrapper.find('.query-state-empty').text()).toContain('You have no ships.');
    expect(wrapper.find('table').exists()).toBe(false);
  });
});
