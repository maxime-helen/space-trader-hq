import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Router } from 'vue-router';

import WaypointDetailPage from '@/modules/systems/pages/waypoint-detail-page.vue';
import { buildWaypoint, buildWaypointTrait } from '@/shared/api/__tests__/fixtures';
import { apiErrorResponse, mockGet } from '@/shared/api/__tests__/handlers';
import { setupApiMocks } from '@/shared/api/__tests__/server';
import { createTestQueryClient, createTestRouter, WAIT } from '@/shared/api/__tests__/test-support';
import type { Shipyard, Waypoint } from '@/shared/api/types';

const server = setupApiMocks();

const SYSTEM = 'X1-AB12';
const WAYPOINT = 'X1-AB12-A1';
const WAYPOINT_PATH = `/systems/${SYSTEM}/waypoints/${WAYPOINT}`;

const testRouter = (): Router =>
  createTestRouter([{ path: '/systems/:systemSymbol/waypoints/:waypointSymbol', component: WaypointDetailPage }]);

type Harness = { wrapper: VueWrapper; router: Router; queryClient: QueryClient };

let mountedClient: QueryClient | undefined;

const renderPage = async (options: { path?: string; queryClient?: QueryClient } = {}): Promise<Harness> => {
  const router = testRouter();
  await router.push(options.path ?? WAYPOINT_PATH);
  await router.isReady();
  const queryClient = options.queryClient ?? createTestQueryClient();
  mountedClient = queryClient;
  const wrapper = mount(WaypointDetailPage, {
    global: { plugins: [router, [VueQueryPlugin, { queryClient }]] },
  });
  return { wrapper, router, queryClient };
};

const untilHeaderShown = async (wrapper: VueWrapper): Promise<void> => {
  await vi.waitFor(() => {
    expect(wrapper.find('.waypoint-header').exists()).toBe(true);
  }, WAIT);
};

const tabLabels = (wrapper: VueWrapper): string[] => wrapper.findAll('.base-tabs-tab').map((tab) => tab.text());

const openTab = async (wrapper: VueWrapper, label: string): Promise<void> => {
  const tab = wrapper.findAll('.base-tabs-tab').find((candidate) => candidate.text() === label);
  if (tab === undefined) throw new Error(`No "${label}" tab on the page. Tabs: ${tabLabels(wrapper).join(', ')}`);
  await tab.trigger('click');
  await flushPromises();
};

const hrefs = (wrapper: VueWrapper): string[] => wrapper.findAll('a').map((anchor) => anchor.attributes('href') ?? '');

// Fixtures the shared factories don't cover: shipyards

const MARKETPLACE = buildWaypointTrait();
const SHIPYARD_TRAIT = buildWaypointTrait({
  symbol: 'SHIPYARD',
  name: 'Shipyard',
  description: 'Ships are built and sold here.',
});

const mockWaypoint = (waypoint: Waypoint) =>
  mockGet('/systems/{systemSymbol}/waypoints/{waypointSymbol}', () => ({ data: waypoint }));

const buildShipyard = (overrides: Partial<Shipyard> = {}): Shipyard => ({
  symbol: WAYPOINT,
  shipTypes: [{ type: 'SHIP_PROBE' }, { type: 'SHIP_MINING_DRONE' }],
  modificationsFee: 5000,
  ...overrides,
});

const mockShipyard = (shipyard: Shipyard = buildShipyard()) =>
  mockGet('/systems/{systemSymbol}/waypoints/{waypointSymbol}/shipyard', () => ({ data: shipyard }));

afterEach(async () => {
  const client = mountedClient;
  mountedClient = undefined;
  if (client !== undefined) {
    await vi.waitFor(() => {
      expect(client.isFetching()).toBe(0);
    }, WAIT);
  }
  server.events.removeAllListeners();
});

describe('WaypointDetailPage', () => {
  it('shows the type, coordinates, faction, traits, modifiers, construction and chart status', async () => {
    server.use(
      mockWaypoint(
        buildWaypoint({
          symbol: WAYPOINT,
          type: 'ORBITAL_STATION',
          x: -2210,
          y: 405,
          faction: { symbol: 'COSMIC' },
          traits: [MARKETPLACE],
          modifiers: [
            { symbol: 'CRITICAL_LIMIT', name: 'Critical Limit', description: 'The waypoint is near collapse.' },
          ],
          isUnderConstruction: true,
        }),
      ),
    );

    const { wrapper } = await renderPage();
    await untilHeaderShown(wrapper);

    const text = wrapper.text();
    expect(text).toContain(WAYPOINT);
    expect(text).toContain('Orbital station');
    expect(text).toContain('-2210, 405');
    expect(text).toContain('Cosmic');
    expect(text).toContain('Marketplace');
    expect(text).toContain('A thriving center of commerce.');
    expect(text).toContain('Critical Limit');
    expect(text).toContain('Under construction');
    // No chart came back, so the waypoint is uncharted.
    expect(text).toContain('Uncharted');
  });

  it('shows only the tabs that apply to the waypoint', async () => {
    server.use(mockWaypoint(buildWaypoint({ symbol: WAYPOINT, traits: [MARKETPLACE] })));

    const { wrapper } = await renderPage();
    await untilHeaderShown(wrapper);

    expect(tabLabels(wrapper)).toEqual(['Market']);
  });

  it('keeps the open tab in ?tab= and opens the one the URL names', async () => {
    server.use(
      mockWaypoint(buildWaypoint({ symbol: WAYPOINT, traits: [MARKETPLACE, SHIPYARD_TRAIT] })),
      mockShipyard(),
    );

    const { wrapper, router } = await renderPage({ path: `${WAYPOINT_PATH}?tab=shipyard` });
    await untilHeaderShown(wrapper);

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Ship types sold');
    }, WAIT);
    expect(router.currentRoute.value.query.tab).toBe('shipyard');
  });

  it('keeps the rest of the page usable when a tab fails, with its own "Try again"', async () => {
    server.use(
      mockWaypoint(buildWaypoint({ symbol: WAYPOINT, traits: [SHIPYARD_TRAIT] })),
      mockGet('/systems/{systemSymbol}/waypoints/{waypointSymbol}/shipyard', () => apiErrorResponse(500)),
    );

    const { wrapper } = await renderPage();
    await untilHeaderShown(wrapper);
    await openTab(wrapper, 'Shipyard');
    await vi.waitFor(() => {
      expect(wrapper.find('.waypoint-shipyard .query-state-error').exists()).toBe(true);
    }, WAIT);

    const error = wrapper.find('.waypoint-shipyard .query-state-error');
    expect(error.text()).toContain("Couldn't load this shipyard.");
    expect(error.find('button').text()).toBe('Try again');
    // The page around the tab is untouched.
    expect(wrapper.find('.waypoint-header').exists()).toBe(true);
    expect(wrapper.text()).toContain('Shipyard');
    expect(wrapper.find('.waypoint-traits').exists()).toBe(true);
  });

  it('shows a not-found state for a waypoint symbol the API has never heard of', async () => {
    server.use(mockGet('/systems/{systemSymbol}/waypoints/{waypointSymbol}', () => apiErrorResponse(404)));

    const { wrapper } = await renderPage();
    await vi.waitFor(() => {
      expect(wrapper.find('.waypoint-not-found').exists()).toBe(true);
    }, WAIT);

    expect(wrapper.text()).toContain(`There's no waypoint ${WAYPOINT}.`);
    expect(hrefs(wrapper)).toContain('/systems');
  });
});
