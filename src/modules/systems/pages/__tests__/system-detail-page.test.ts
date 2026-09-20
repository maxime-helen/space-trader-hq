import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Router } from 'vue-router';

import SystemDetailPage from '@/modules/systems/pages/system-detail-page.vue';
import {
  buildPage,
  buildSystem,
  buildSystemWaypoint,
  buildWaypoint,
  buildWaypointTrait,
} from '@/shared/api/__tests__/fixtures';
import { apiErrorResponse, apiUrl, createRequestCounter, mockGet } from '@/shared/api/__tests__/handlers';
import { setupApiMocks } from '@/shared/api/__tests__/server';
import { createTestQueryClient, createTestRouter, recordRequests, WAIT } from '@/shared/api/__tests__/test-support';
import type { System, Waypoint } from '@/shared/api/types';

const server = setupApiMocks();

const SYSTEM = 'X1-AB12';
const PLANET = `${SYSTEM}-A1`;
const MOON = `${SYSTEM}-A1-M1`;
const STATION = `${SYSTEM}-B2`;
const ORPHAN = `${SYSTEM}-C3`;

const EMBEDDED = [
  buildSystemWaypoint({ symbol: PLANET, type: 'PLANET', x: 10, y: 20, orbitals: [{ symbol: MOON }] }),
  buildSystemWaypoint({ symbol: MOON, type: 'MOON', x: 10, y: 21, orbits: PLANET }),
  buildSystemWaypoint({ symbol: STATION, type: 'ORBITAL_STATION', x: -5, y: 0 }),
  buildSystemWaypoint({ symbol: ORPHAN, type: 'MOON', x: 3, y: 4, orbits: `${SYSTEM}-GONE` }),
];

const system = (overrides: Partial<System> = {}): System =>
  buildSystem({
    symbol: SYSTEM,
    name: 'Alpha Bravo',
    type: 'ORANGE_STAR',
    sectorSymbol: 'X1',
    x: -2210,
    y: 405,
    waypoints: EMBEDDED,
    factions: [{ symbol: 'COSMIC' }],
    ...overrides,
  });

const systemHandler = (body: () => System | Response) =>
  mockGet('/systems/{systemSymbol}', () => {
    const result = body();
    return result instanceof Response ? result : { data: result };
  });

const withTrait = (symbol: string, trait: 'MARKETPLACE' | 'SHIPYARD'): Waypoint =>
  buildWaypoint({
    symbol,
    systemSymbol: SYSTEM,
    type: 'PLANET',
    traits: [buildWaypointTrait({ symbol: trait, name: trait === 'MARKETPLACE' ? 'Marketplace' : 'Shipyard' })],
  });

const waypointsHandler = () =>
  http.get(apiUrl('/systems/{systemSymbol}/waypoints'), ({ request }) => {
    const url = new URL(request.url);
    const traits = url.searchParams.getAll('traits');
    const page = Number(url.searchParams.get('page') ?? '1');
    const all = [withTrait(PLANET, 'MARKETPLACE'), withTrait(STATION, 'SHIPYARD')];
    const matching = all.filter((waypoint) => traits.every((t) => waypoint.traits.some((own) => own.symbol === t)));
    const rows = page === 1 ? matching : [withTrait(ORPHAN, 'MARKETPLACE')];
    return HttpResponse.json(buildPage(rows, { total: 40, page, limit: 20 }));
  });

const testRouter = (): Router => createTestRouter([{ path: '/systems/:systemSymbol', component: SystemDetailPage }]);

let client: QueryClient | undefined;

const mountPage = async (initialPath = `/systems/${SYSTEM}`, queryClient: QueryClient = createTestQueryClient()) => {
  client = queryClient;
  const router = testRouter();
  await router.push(initialPath);
  await router.isReady();
  const wrapper = mount(SystemDetailPage, { global: { plugins: [[VueQueryPlugin, { queryClient }], router] } });
  return { wrapper, router };
};

type Wrapper = Awaited<ReturnType<typeof mountPage>>['wrapper'];

const untilHeaderShown = async (wrapper: Wrapper): Promise<void> => {
  await vi.waitFor(() => {
    expect(wrapper.find('.system-header').exists()).toBe(true);
  }, WAIT);
};

const treeRows = (wrapper: Wrapper): string[] => wrapper.findAll('.waypoint-node-row').map((row) => row.text());

const selectType = async (wrapper: Wrapper, type: string): Promise<void> => {
  await wrapper.find('#waypoint-type-filter').setValue(type);
};

const toggleTrait = async (wrapper: Wrapper, trait: string): Promise<void> => {
  await wrapper.find(`.system-filters-trait input[value="${trait}"]`).trigger('change');
};

afterEach(async () => {
  server.events.removeAllListeners();
  // A request still queued in the bucket would land inside the next test and be counted there.
  if (client !== undefined) {
    const queryClient = client;
    await vi.waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
    }, WAIT);
    client = undefined;
  }
});

describe('SystemDetailPage', () => {
  it('shows the header and the whole orbit tree, asking for the system, the agent and the fleet', async () => {
    const counter = createRequestCounter();
    server.use(
      counter.handler,
      systemHandler(() => system()),
    );
    const requests = recordRequests(server);

    // A cold cache: the system for the page, the agent for the HQ marker, the fleet for the ship counts.
    const { wrapper } = await mountPage();
    await untilHeaderShown(wrapper);

    expect(wrapper.find('.system-header').text()).toContain('Alpha Bravo');
    expect(wrapper.find('.system-header').text()).toContain('Orange star');
    expect(wrapper.find('.system-header').text()).toContain('-2210, 405');
    expect(wrapper.find('.system-header').text()).toContain('Cosmic');
    expect(treeRows(wrapper).length).toBeGreaterThan(0);

    await vi.waitFor(() => {
      expect(counter.count()).toBe(3);
    }, WAIT);
    expect([...requests].sort()).toEqual(
      [
        `https://api.spacetraders.io/v2/systems/${SYSTEM}`,
        'https://api.spacetraders.io/v2/my/agent',
        'https://api.spacetraders.io/v2/my/ships?page=1&limit=20',
      ].sort(),
    );
  });

  it('filters by type client-side, with no further request', async () => {
    const counter = createRequestCounter();
    server.use(
      counter.handler,
      systemHandler(() => system()),
    );
    const { wrapper, router } = await mountPage();
    await untilHeaderShown(wrapper);

    await selectType(wrapper, 'ORBITAL_STATION');
    await vi.waitFor(() => {
      expect(router.currentRoute.value.query.type).toBe('ORBITAL_STATION');
    }, WAIT);
    await vi.waitFor(() => {
      expect(treeRows(wrapper)).toHaveLength(1);
    }, WAIT);

    expect(treeRows(wrapper)[0]).toContain(STATION);
    expect(counter.count()).toBe(1);
  });

  it('sends the trait filter to the waypoints endpoint and shows the traits it returns', async () => {
    server.use(
      systemHandler(() => system()),
      waypointsHandler(),
    );
    const requests = recordRequests(server);
    const { wrapper, router } = await mountPage();
    await untilHeaderShown(wrapper);

    await toggleTrait(wrapper, 'MARKETPLACE');
    await vi.waitFor(() => {
      expect(router.currentRoute.value.query.traits).toBe('MARKETPLACE');
    }, WAIT);
    await vi.waitFor(() => {
      expect(wrapper.find('.system-waypoint-list').exists()).toBe(true);
    }, WAIT);

    const waypointsCall = requests.find((url) => url.includes('/waypoints')) ?? '';
    expect(waypointsCall).toContain('traits=MARKETPLACE');
    expect(waypointsCall).toContain('limit=20');
    expect(wrapper.find('.system-waypoint-list').text()).toContain('Marketplace');
    expect(wrapper.find('.system-waypoint-list').text()).toContain(PLANET);
  });

  it('shows a not-found state with a link back for an unknown symbol', async () => {
    server.use(systemHandler(() => apiErrorResponse(404, { message: 'System not found.' })));
    const { wrapper } = await mountPage('/systems/X1-ZZ99');

    await vi.waitFor(() => {
      expect(wrapper.find('.system-not-found').exists()).toBe(true);
    }, WAIT);
    expect(wrapper.find('.system-not-found').text()).toContain("There's no system X1-ZZ99.");
    expect(wrapper.find('.system-not-found-link').attributes('href')).toBe('/systems');
  });

  it('names what failed and offers "Try again" when the system cannot be loaded', async () => {
    server.use(systemHandler(() => apiErrorResponse(500)));
    const { wrapper } = await mountPage();

    await vi.waitFor(() => {
      expect(wrapper.find('.query-state-error').exists()).toBe(true);
    }, WAIT);
    expect(wrapper.find('.query-state-error').text()).toContain("Couldn't load this system.");
  });
});
