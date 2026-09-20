import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { delay, http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Router } from 'vue-router';

import { agentKeys } from '@/modules/agent';
import { fleetKeys } from '@/modules/fleet';
import SystemsPage from '@/modules/systems/pages/systems-page.vue';
import { buildAgent, buildPage, buildShip, buildSystem, buildSystemWaypoint } from '@/shared/api/__tests__/fixtures';
import { apiErrorResponse, apiUrl, createRequestCounter, mockGet } from '@/shared/api/__tests__/handlers';
import { setupApiMocks } from '@/shared/api/__tests__/server';
import { createTestQueryClient, createTestRouter, recordRequests, WAIT } from '@/shared/api/__tests__/test-support';
import type { System } from '@/shared/api/types';

const server = setupApiMocks();

const HOME_SYSTEM = 'X1-AB12';
const AWAY_SYSTEM = 'X1-ZZ99';

const alpha = (): System =>
  buildSystem({
    symbol: 'X1-AA01',
    name: 'Alpha',
    type: 'ORANGE_STAR',
    sectorSymbol: 'X1',
    constellation: 'Auriga',
    x: -2210,
    y: 405,
    waypoints: [buildSystemWaypoint({ symbol: 'X1-AA01-A1' }), buildSystemWaypoint({ symbol: 'X1-AA01-B2' })],
    factions: [{ symbol: 'COSMIC' }],
  });

const bare = (): System => ({
  symbol: 'X1-AA02',
  sectorSymbol: 'X1',
  type: 'NEBULA',
  x: 0,
  y: 0,
  waypoints: [],
  factions: [],
});

const latecomer = (): System => buildSystem({ symbol: 'X1-BB02', name: 'Beta' });

const FIRST_PAGE = [alpha(), bare()];

const twoPages = (responseDelay = 0) =>
  http.get(apiUrl('/systems'), async ({ request }) => {
    const page = Number(new URL(request.url).searchParams.get('page') ?? '1');
    if (responseDelay > 0) await delay(responseDelay);
    return HttpResponse.json(buildPage(page === 1 ? FIRST_PAGE : [latecomer()], { total: 40, page, limit: 20 }));
  });

const testRouter = (): Router => createTestRouter([{ path: '/systems', component: SystemsPage }]);

const withWarmCaches = (): QueryClient => {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(agentKeys.me(), buildAgent({ headquarters: `${HOME_SYSTEM}-A1` }));
  queryClient.setQueryData(
    fleetKeys.list({ page: 1 }),
    buildPage([
      buildShip({ symbol: 'S-1', nav: { systemSymbol: AWAY_SYSTEM, waypointSymbol: `${AWAY_SYSTEM}-C3` } }),
      buildShip({ symbol: 'S-2', nav: { systemSymbol: HOME_SYSTEM, waypointSymbol: `${HOME_SYSTEM}-A1` } }),
    ]),
  );
  return queryClient;
};

const mountPage = async (initialPath = '/systems', queryClient: QueryClient = withWarmCaches()) => {
  const router = testRouter();
  await router.push(initialPath);
  await router.isReady();
  const wrapper = mount(SystemsPage, { global: { plugins: [[VueQueryPlugin, { queryClient }], router] } });
  return { wrapper, router };
};

type Wrapper = Awaited<ReturnType<typeof mountPage>>['wrapper'];

const untilRowsShown = async (wrapper: Wrapper): Promise<void> => {
  await vi.waitFor(() => {
    expect(wrapper.findAll('.systems-table tbody tr').length).toBeGreaterThan(0);
  }, WAIT);
};

const headers = (wrapper: Wrapper): string[] => wrapper.findAll('.systems-table thead th').map((cell) => cell.text());

const rowText = (wrapper: Wrapper, index: number): string =>
  wrapper.findAll('.systems-table tbody tr')[index]?.text() ?? '';

afterEach(() => {
  server.events.removeAllListeners();
});

describe('SystemsPage', () => {
  it('lists systems with the columns of 7.3, in its order', async () => {
    server.use(twoPages());
    const { wrapper } = await mountPage();
    await untilRowsShown(wrapper);

    expect(headers(wrapper)).toEqual([
      'Symbol',
      'Name',
      'Type',
      'Sector',
      'Constellation',
      'Coordinates',
      'Waypoints',
      'Factions',
    ]);
    expect(rowText(wrapper, 0)).toContain('X1-AA01');
    expect(rowText(wrapper, 0)).toContain('Alpha');
    expect(rowText(wrapper, 0)).toContain('Orange star');
    expect(rowText(wrapper, 0)).toContain('Auriga');
    // Coordinates carry no thousands separators, or they read as three numbers.
    expect(rowText(wrapper, 0)).toContain('-2210, 405');
    expect(rowText(wrapper, 0)).toContain('Cosmic');
    // Every optional field absent still renders a row rather than blanks.
    expect(rowText(wrapper, 1)).toContain('X1-AA02');
  });

  it('asks for 20 a page and keeps the page number in the URL', async () => {
    server.use(twoPages());
    const requests = recordRequests(server);
    const { wrapper, router } = await mountPage('/systems?page=2');
    await untilRowsShown(wrapper);

    const lastRequest = requests[requests.length - 1] ?? '';
    expect(lastRequest).toContain('page=2');
    expect(lastRequest).toContain('limit=20');
    expect(rowText(wrapper, 0)).toContain('X1-BB02');
    expect(router.currentRoute.value.query.page).toBe('2');
  });

  it('lists the headquarters system and every system with a ship, with no extra request', async () => {
    const counter = createRequestCounter();
    server.use(counter.handler, twoPages());
    const requests = recordRequests(server);

    const { wrapper } = await mountPage();
    await untilRowsShown(wrapper);

    const cards = wrapper.findAll('.your-systems-list li');
    expect(cards.map((card) => card.text())).toEqual([
      expect.stringContaining(HOME_SYSTEM),
      expect.stringContaining(AWAY_SYSTEM),
    ]);
    expect(cards[0]?.text()).toContain('Headquarters');
    expect(cards[0]?.text()).toContain('1 ship');
    expect(wrapper.find('.your-systems-link').attributes('href')).toBe(`/systems/${HOME_SYSTEM}`);
    // The universe table's own page is the only request the whole screen made.
    expect(requests).toHaveLength(1);
    expect(counter.count()).toBe(1);
  });

  it('navigates to the system of a waypoint symbol typed in any case', async () => {
    server.use(twoPages());
    const { wrapper, router } = await mountPage();
    await untilRowsShown(wrapper);

    await wrapper.find('.go-to-system input').setValue('  x1-df55-20250z  ');
    await wrapper.find('.go-to-system form').trigger('submit');
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/systems/X1-DF55');
    }, WAIT);
  });

  it('answers something that is not a symbol without spending a request', async () => {
    server.use(twoPages());
    const requests = recordRequests(server);
    const { wrapper, router } = await mountPage();
    await untilRowsShown(wrapper);

    await wrapper.find('.go-to-system input').setValue('not a symbol');
    await wrapper.find('.go-to-system form').trigger('submit');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.base-field-error').text()).toContain("There's no system NOT A SYMBOL");
    expect(router.currentRoute.value.path).toBe('/systems');
    expect(requests).toHaveLength(1);
  });

  it('names what failed and offers "Try again" when the list cannot be loaded', async () => {
    server.use(mockGet('/systems', () => apiErrorResponse(500)));
    const { wrapper } = await mountPage();

    await vi.waitFor(() => {
      expect(wrapper.find('.query-state-error').exists()).toBe(true);
    }, WAIT);
    expect(wrapper.find('.query-state-error').text()).toContain("Couldn't load the systems.");
    expect(wrapper.find('.query-state-error button').text()).toBe('Try again');
  });
});
