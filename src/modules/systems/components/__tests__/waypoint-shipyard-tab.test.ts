import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import WaypointShipyardTab from '@/modules/systems/components/waypoint-shipyard-tab.vue';
import { buildShip, TEST_SYSTEM_SYMBOL, TEST_WAYPOINT_SYMBOL } from '@/shared/api/__tests__/fixtures';
import { apiErrorResponse, mockGet } from '@/shared/api/__tests__/handlers';
import { setupApiMocks } from '@/shared/api/__tests__/server';
import { WAIT } from '@/shared/api/__tests__/test-support';
import type { Shipyard, ShipyardShip } from '@/shared/api/types';

const server = setupApiMocks();

// Fixtures

const buildShipyardShip = (type: string, purchasePrice: number, name: string): ShipyardShip => {
  const template = buildShip();
  return {
    type: type as ShipyardShip['type'],
    name,
    description: `A ${name}.`,
    supply: 'MODERATE',
    activity: 'STRONG',
    purchasePrice,
    frame: template.frame,
    reactor: template.reactor,
    engine: template.engine,
    modules: [],
    mounts: [],
    crew: { required: 0, capacity: 3 },
  };
};

const PROBE = buildShipyardShip('SHIP_PROBE', 65_000, 'Probe');
const EXPLORER = buildShipyardShip('SHIP_EXPLORER', 160_000, 'Explorer');

const catalogueShipyard = (): Shipyard => ({
  symbol: TEST_WAYPOINT_SYMBOL,
  shipTypes: [{ type: 'SHIP_PROBE' }, { type: 'SHIP_EXPLORER' }],
  modificationsFee: 3200,
});

const stockedShipyard = (): Shipyard => ({ ...catalogueShipyard(), ships: [PROBE, EXPLORER], transactions: [] });

const serveShipyard = (shipyard: Shipyard): void => {
  server.use(mockGet('/systems/{systemSymbol}/waypoints/{waypointSymbol}/shipyard', () => ({ data: shipyard })));
};

// Harness

let client: QueryClient | undefined;

const mountTab = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client = queryClient;
  return mount(WaypointShipyardTab, {
    props: { systemSymbol: TEST_SYSTEM_SYMBOL, waypointSymbol: TEST_WAYPOINT_SYMBOL },
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  });
};

type Tab = ReturnType<typeof mountTab>;

const untilLoaded = async (wrapper: Tab): Promise<void> => {
  await vi.waitFor(() => {
    expect(wrapper.find('.base-spinner').exists()).toBe(false);
  }, WAIT);
};

afterEach(async () => {
  // A request still in the bucket would land inside the next test and be counted there.
  if (client !== undefined) {
    const queryClient = client;
    await vi.waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
    }, WAIT);
    client = undefined;
  }
});

describe('WaypointShipyardTab', () => {
  it('lists the types sold and explains the missing prices when no ship of yours is here', async () => {
    serveShipyard(catalogueShipyard());

    const wrapper = mountTab();
    await untilLoaded(wrapper);

    expect(wrapper.findAll('.waypoint-shipyard-types .base-badge').map((badge) => badge.text())).toEqual([
      'Ship probe',
      'Ship explorer',
    ]);
    expect(wrapper.text()).toContain('3,200 cr');
    expect(wrapper.find('table').exists()).toBe(false);
    expect(wrapper.find('.waypoint-shipyard-callout').text()).toBe(
      'Available ships and prices need one of your ships at this waypoint.',
    );
  });

  it('shows every ship the response prices, with its price beside it', async () => {
    serveShipyard(stockedShipyard());

    const wrapper = mountTab();
    await untilLoaded(wrapper);

    const rows = wrapper.findAll('tbody tr').map((row) => row.text());
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain('Probe');
    expect(rows[0]).toContain('65,000 cr');
    expect(rows[1]).toContain('160,000 cr');
    expect(wrapper.find('.waypoint-shipyard-callout').exists()).toBe(false);
  });

  it('names what failed and offers "Try again" inside the tab when the shipyard will not load', async () => {
    server.use(mockGet('/systems/{systemSymbol}/waypoints/{waypointSymbol}/shipyard', () => apiErrorResponse(500)));

    const wrapper = mountTab();
    await vi.waitFor(() => {
      expect(wrapper.find('.query-state-error').exists()).toBe(true);
    }, WAIT);

    expect(wrapper.find('.query-state-error').text()).toContain("Couldn't load this shipyard.");
    expect(wrapper.find('.query-state-error button').text()).toBe('Try again');
  });
});
