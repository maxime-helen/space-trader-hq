import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Router } from 'vue-router';

import ShipDetailPage from '@/modules/fleet/pages/ship-detail-page.vue';
import { TEST_SHIP_SYMBOL } from '@/shared/api/__tests__/fixtures';
import { apiErrorResponse, mockGet } from '@/shared/api/__tests__/handlers';
import { setupApiMocks } from '@/shared/api/__tests__/server';
import { createTestQueryClient, createTestRouter } from '@/shared/api/__tests__/test-support';

const server = setupApiMocks();

const SHIP_PATH = `/fleet/${TEST_SHIP_SYMBOL}`;

const WAIT = { timeout: 3000 };

const testRouter = (): Router => createTestRouter([{ path: '/fleet/:shipSymbol', component: ShipDetailPage }]);

type Harness = { wrapper: VueWrapper; router: Router; queryClient: QueryClient };

const renderShipPage = async (path = SHIP_PATH, queryClient = createTestQueryClient()): Promise<Harness> => {
  const router = testRouter();
  await router.push(path);
  await router.isReady();
  const wrapper = mount(ShipDetailPage, {
    global: { plugins: [router, [VueQueryPlugin, { queryClient }]] },
  });
  return { wrapper, router, queryClient };
};

const untilShipShown = async (wrapper: VueWrapper): Promise<void> => {
  await vi.waitFor(() => {
    expect(wrapper.find('.ship-detail-meta').exists()).toBe(true);
  }, WAIT);
};

afterEach(() => {
  server.events.removeAllListeners();
});

describe('ShipDetailPage', () => {
  it('opens Overview by default, with navigation, fuel and cooldown', async () => {
    const { wrapper, router } = await renderShipPage();
    await untilShipShown(wrapper);

    expect(router.currentRoute.value.query.tab).toBeUndefined();
    expect(wrapper.find('.ship-overview-tab').exists()).toBe(true);
    const text = wrapper.find('.ship-overview-tab').text();
    expect(text).toContain('Navigation');
    expect(text).toContain('Fuel');
    expect(text).toContain('Cooldown');
    expect(text).toContain('Docked');
    expect(text).toContain('Cruise');
    expect(text).toContain('400 / 400');
  });

  it('opens the tab named in the URL, so a reload lands on it again', async () => {
    const { wrapper } = await renderShipPage(`${SHIP_PATH}?tab=modules`);
    await untilShipShown(wrapper);

    expect(wrapper.find('.ship-modules-tab').exists()).toBe(true);
    expect(wrapper.find('.ship-overview-tab').exists()).toBe(false);
  });

  it('shows not-found for a ship symbol that does not exist', async () => {
    server.use(mockGet('/my/ships/{shipSymbol}', () => apiErrorResponse(404, { message: 'Ship not found.' })));
    const { wrapper } = await renderShipPage('/fleet/NOPE-9');
    await vi.waitFor(() => {
      expect(wrapper.find('.ship-detail-not-found').exists()).toBe(true);
    }, WAIT);

    expect(wrapper.text()).toContain("There's no ship NOPE-9 in your fleet.");
    expect(wrapper.find('.base-tabs').exists()).toBe(false);
  });

  it('names what failed and offers "Try again" when the ship cannot be loaded', async () => {
    server.use(mockGet('/my/ships/{shipSymbol}', () => apiErrorResponse(500)));
    const { wrapper } = await renderShipPage();
    await vi.waitFor(() => {
      expect(wrapper.find('.query-state-error').exists()).toBe(true);
    }, WAIT);

    expect(wrapper.find('.query-state-error').text()).toContain("Couldn't load this ship.");
    expect(wrapper.find('.query-state-error button').text()).toBe('Try again');
  });
});
