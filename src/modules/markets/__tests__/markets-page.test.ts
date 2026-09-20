import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount, RouterLinkStub } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MarketsPage from '@/modules/markets/pages/markets-page.vue';
import {
  buildAgent,
  buildPage,
  buildShip,
  buildWaypoint,
  buildWaypointTrait,
  TEST_SYSTEM_SYMBOL,
} from '@/shared/api/__tests__/fixtures';
import { apiErrorResponse, mockGet } from '@/shared/api/__tests__/handlers';
import { setupApiMocks } from '@/shared/api/__tests__/server';
import { createTestQueryClient } from '@/shared/api/__tests__/test-support';

const server = setupApiMocks();

const WAIT = { timeout: 8000 };

const HQ_SYSTEM = TEST_SYSTEM_SYMBOL;
const SHIP_SYSTEM = 'X1-KK42';

const MARKETPLACES: Record<string, string[]> = {
  [HQ_SYSTEM]: ['X1-AB12-A2', 'X1-AB12-C4'],
  [SHIP_SYSTEM]: ['X1-KK42-D9'],
};

const fleet = () =>
  buildPage([
    buildShip({ symbol: 'VOYAGER-7-1', nav: { systemSymbol: HQ_SYSTEM, waypointSymbol: 'X1-AB12-A2' } }),
    buildShip({ symbol: 'VOYAGER-7-2', nav: { systemSymbol: SHIP_SYSTEM, waypointSymbol: 'X1-KK42-D9' } }),
    buildShip({
      symbol: 'VOYAGER-7-3',
      nav: { systemSymbol: HQ_SYSTEM, waypointSymbol: 'X1-AB12-C4', status: 'IN_TRANSIT' },
    }),
  ]);

const serveUniverse = (): void => {
  server.use(
    mockGet('/my/agent', () => ({ data: buildAgent({ headquarters: 'X1-AB12-A1' }) })),
    mockGet('/my/ships', () => fleet()),
    mockGet('/systems/{systemSymbol}/waypoints', ({ params }) => {
      const symbols = MARKETPLACES[String(params.systemSymbol)] ?? [];
      return buildPage(
        symbols.map((symbol) =>
          buildWaypoint({
            symbol,
            type: 'ORBITAL_STATION',
            systemSymbol: String(params.systemSymbol),
            traits: [buildWaypointTrait()],
          }),
        ),
      );
    }),
  );
};

const mountPage = (queryClient: QueryClient = createTestQueryClient()) =>
  mount(MarketsPage, {
    global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { RouterLink: RouterLinkStub } },
  });

const untilGroupsShown = async (wrapper: ReturnType<typeof mountPage>, count: number): Promise<void> => {
  await vi.waitFor(() => {
    expect(wrapper.findAll('.marketplace-group tbody tr')).toHaveLength(count);
  }, WAIT);
};

afterEach(() => {
  server.events.removeAllListeners();
});

describe('MarketsPage', () => {
  it('groups marketplaces by the headquarters system and the systems with ships', async () => {
    serveUniverse();

    const wrapper = mountPage();
    await untilGroupsShown(wrapper, 3);

    const groups = wrapper.findAll('.marketplace-group-title').map((title) => title.text());
    // Headquarters first, badged, then the other system with a ship.
    expect(groups).toEqual([`${HQ_SYSTEM}Headquarters`, SHIP_SYSTEM]);
    expect(wrapper.find('.marketplace-group-title .base-badge').text()).toBe('Headquarters');
    expect(wrapper.text()).toContain('X1-AB12-A2');
    expect(wrapper.text()).toContain('X1-KK42-D9');
    expect(wrapper.text()).toContain('Orbital station');
  });

  it('badges the rows where one of your ships is, with its name', async () => {
    serveUniverse();

    const wrapper = mountPage();
    await untilGroupsShown(wrapper, 3);

    const rows = wrapper.findAll('.marketplace-group tbody tr').map((row) => row.text());
    expect(rows[0]).toContain('Ship present: VOYAGER-7-1');
    // VOYAGER-7-3 is in transit, so it is not present anywhere.
    expect(rows[1]).toContain('—');
    expect(rows[1]).not.toContain('VOYAGER-7-3');
    expect(rows[2]).toContain('Ship present: VOYAGER-7-2');
  });

  it('links every marketplace to its waypoint page with the Market tab open', async () => {
    serveUniverse();

    const wrapper = mountPage();
    await untilGroupsShown(wrapper, 3);

    const links = wrapper.findAllComponents(RouterLinkStub).map((link) => link.props('to') as string);
    expect(links).toContain(`/systems/${HQ_SYSTEM}/waypoints/X1-AB12-A2?tab=market`);
    expect(links).toContain(`/systems/${SHIP_SYSTEM}/waypoints/X1-KK42-D9?tab=market`);
  });

  it("keeps the other systems usable when one system's list fails", async () => {
    serveUniverse();
    server.use(
      mockGet('/systems/{systemSymbol}/waypoints', ({ params }) =>
        String(params.systemSymbol) === SHIP_SYSTEM
          ? apiErrorResponse(500)
          : buildPage([buildWaypoint({ symbol: 'X1-AB12-A2', systemSymbol: HQ_SYSTEM })]),
      ),
    );

    const wrapper = mountPage();
    await vi.waitFor(() => {
      expect(wrapper.find('.query-state-error').exists()).toBe(true);
    }, WAIT);

    expect(wrapper.find('.query-state-error').text()).toContain(`Couldn't load the marketplaces in ${SHIP_SYSTEM}.`);
    expect(wrapper.text()).toContain('X1-AB12-A2');
  });

  it('shows an empty state for a system with no marketplace at all', async () => {
    server.use(
      mockGet('/my/agent', () => ({ data: buildAgent({ headquarters: 'X1-AB12-A1' }) })),
      mockGet('/my/ships', () => buildPage([])),
      mockGet('/systems/{systemSymbol}/waypoints', () => buildPage([])),
    );

    const wrapper = mountPage();
    await vi.waitFor(() => {
      expect(wrapper.find('.query-state-empty').exists()).toBe(true);
    }, WAIT);

    expect(wrapper.find('.query-state-empty').text()).toBe('No marketplaces in this system.');
  });
});
