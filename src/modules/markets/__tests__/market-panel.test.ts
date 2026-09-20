import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MarketPanel } from '@/modules/markets';
import {
  buildMarket,
  buildMarketTradeGood,
  buildTradeGood,
  TEST_SYSTEM_SYMBOL,
  TEST_WAYPOINT_SYMBOL,
} from '@/shared/api/__tests__/fixtures';
import { apiErrorResponse, createRequestCounter, mockGet } from '@/shared/api/__tests__/handlers';
import { setupApiMocks } from '@/shared/api/__tests__/server';
import { createTestQueryClient, WAIT } from '@/shared/api/__tests__/test-support';
import type { Market } from '@/shared/api/types';

const server = setupApiMocks();

const CATALOGUE = {
  exports: [
    buildTradeGood({ symbol: 'ALUMINUM', name: 'Aluminum', description: 'Light structural metal.' }),
    buildTradeGood({ symbol: 'ELECTRONICS', name: 'Electronics', description: 'Assorted circuitry.' }),
  ],
  imports: [buildTradeGood({ symbol: 'IRON_ORE', name: 'Iron ore', description: 'Raw ferrous ore.' })],
  exchange: [buildTradeGood({ symbol: 'FUEL', name: 'Fuel', description: 'High-grade ship fuel.' })],
};

const liveMarket = (): Market =>
  buildMarket({
    symbol: TEST_WAYPOINT_SYMBOL,
    ...CATALOGUE,
    tradeGoods: [
      buildMarketTradeGood({ symbol: 'FUEL', type: 'EXCHANGE', supply: 'MODERATE', activity: 'STRONG' }),
      buildMarketTradeGood({
        symbol: 'IRON_ORE',
        type: 'IMPORT',
        supply: 'SCARCE',
        activity: 'GROWING',
        purchasePrice: 61,
        sellPrice: 58,
        tradeVolume: 60,
      }),
      // No `activity` at all: the column shows "—" rather than an empty badge.
      {
        symbol: 'ALUMINUM',
        type: 'EXPORT',
        supply: 'ABUNDANT',
        purchasePrice: 104,
        sellPrice: 97,
        tradeVolume: 40,
      },
    ],
  });

const catalogueMarket = (): Market => buildMarket({ symbol: TEST_WAYPOINT_SYMBOL, ...CATALOGUE });

const serveMarket = (market: Market): void => {
  server.use(mockGet('/systems/{systemSymbol}/waypoints/{waypointSymbol}/market', () => ({ data: market })));
};

const mountPanel = (queryClient: QueryClient = createTestQueryClient()) =>
  mount(MarketPanel, {
    props: { systemSymbol: TEST_SYSTEM_SYMBOL, waypointSymbol: TEST_WAYPOINT_SYMBOL },
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  });

const untilLoaded = async (wrapper: ReturnType<typeof mountPanel>): Promise<void> => {
  await vi.waitFor(() => {
    expect(wrapper.find('.base-spinner').exists()).toBe(false);
  }, WAIT);
};

const priceRows = (wrapper: ReturnType<typeof mountPanel>): string[][] =>
  wrapper.findAll('.market-price-table tbody tr').map((row) => row.findAll('td').map((cell) => cell.text()));

const goodsShown = (wrapper: ReturnType<typeof mountPanel>): string[] =>
  wrapper.findAll('.market-price-table-name').map((name) => name.text());

afterEach(() => {
  // The price cache is session level, and a test is not a session.
});

describe('MarketPanel, catalogue view', () => {
  it('shows exports, imports and exchange with names, symbols and descriptions', async () => {
    serveMarket(catalogueMarket());

    const wrapper = mountPanel();
    await untilLoaded(wrapper);

    const headings = wrapper.findAll('.market-catalogue-title').map((heading) => heading.text());
    expect(headings).toEqual(['Exports', 'Imports', 'Exchange']);
    expect(wrapper.text()).toContain('Aluminum');
    expect(wrapper.text()).toContain('IRON_ORE');
    // Descriptions are there, behind a native <details>.
    expect(wrapper.findAll('.market-catalogue-good details').length).toBe(4);
    expect(wrapper.find('.market-catalogue-description').text()).toBe('Light structural metal.');
  });
});

describe('MarketPanel, live view', () => {
  it('shows every column of the price table, exports first', async () => {
    serveMarket(liveMarket());

    const wrapper = mountPanel();
    await untilLoaded(wrapper);

    expect(wrapper.findAll('.market-price-table thead th').map((header) => header.text())).toEqual([
      'Good',
      'Type',
      'Supply',
      'Activity',
      'Buy',
      'Sell',
      'Volume',
    ]);
    // Exports, then imports, then exchange — and the whole row, formatted.
    expect(goodsShown(wrapper)).toEqual(['Aluminum', 'Iron ore', 'Fuel']);
    expect(priceRows(wrapper)[1]?.slice(1)).toEqual(['Import', 'Scarce', 'Growing', '61 cr', '58 cr', '60']);
    expect(priceRows(wrapper)[1]?.[0]).toBe('Iron oreIRON_ORE');
  });

  it('filters the table by type without touching the network', async () => {
    serveMarket(liveMarket());
    const counter = createRequestCounter();
    server.use(counter.handler);

    const wrapper = mountPanel();
    await untilLoaded(wrapper);
    await wrapper.find('.market-price-table-select').setValue('EXPORT');

    expect(goodsShown(wrapper)).toEqual(['Aluminum']);
    expect(counter.count()).toBe(1);
  });
});

describe('MarketPanel, failures', () => {
  it('names what failed and offers "Try again" inside the tab', async () => {
    server.use(mockGet('/systems/{systemSymbol}/waypoints/{waypointSymbol}/market', () => apiErrorResponse(500)));

    const wrapper = mountPanel();
    await vi.waitFor(() => {
      expect(wrapper.find('.query-state-error').exists()).toBe(true);
    }, WAIT);

    expect(wrapper.find('.query-state-error').text()).toContain("Couldn't load this market.");
    expect(wrapper.find('.query-state-error button').text()).toBe('Try again');
  });
});
