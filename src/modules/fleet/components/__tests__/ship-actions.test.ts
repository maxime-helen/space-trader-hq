import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { fleetKeys } from '@/modules/fleet/api/keys';
import ShipActions from '@/modules/fleet/components/ship-actions.vue';
import {
  buildShip,
  buildShipFuel,
  buildShipNav,
  TEST_SHIP_SYMBOL,
  TEST_SYSTEM_SYMBOL,
} from '@/shared/api/__tests__/fixtures';
import { apiErrorResponse, apiUrl, createRequestCounter } from '@/shared/api/__tests__/handlers';
import { setupApiMocks } from '@/shared/api/__tests__/server';
import { recordRequestLines, WAIT } from '@/shared/api/__tests__/test-support';
import type { Ship, ShipNavStatus } from '@/shared/api/types';

import { installDialogStandIn } from './dialog-stand-in';

const server = setupApiMocks();

const DESTINATION = `${TEST_SYSTEM_SYMBOL}-B2`;
const NAVIGATE_URL = `https://api.spacetraders.io/v2/my/ships/${TEST_SHIP_SYMBOL}/navigate`;

beforeAll(() => {
  installDialogStandIn();
});

// Harness

let client: QueryClient | undefined;
let mounted: VueWrapper | undefined;

const shipAt = (status: ShipNavStatus, ship: Partial<{ current: number; capacity: number }> = {}): Ship =>
  buildShip({
    nav: { status },
    fuel: { current: ship.current ?? 400, capacity: ship.capacity ?? 400 },
  });

const renderActions = (
  ship: Ship,
  seed?: (queryClient: QueryClient) => void,
): { wrapper: VueWrapper; queryClient: QueryClient } => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client = queryClient;
  queryClient.setQueryData(fleetKeys.detail(ship.symbol), ship);
  seed?.(queryClient);
  const wrapper = mount(ShipActions, {
    props: { ship },
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    attachTo: document.body,
  });
  mounted = wrapper;
  return { wrapper, queryClient };
};

const settle = async (): Promise<void> => {
  await flushPromises();
  await new Promise((resolve) => {
    setTimeout(resolve, 250);
  });
  await flushPromises();
};

const offered = (wrapper: VueWrapper): string[] =>
  wrapper
    .findAll('.ship-actions-bar button')
    .filter((button) => button.attributes('disabled') === undefined)
    .map((button) => button.text());

afterEach(async () => {
  server.events.removeAllListeners();
  mounted?.unmount();
  mounted = undefined;
  document.body.innerHTML = '';
  // A request still queued in the bucket would land inside the next test and be counted there.
  if (client !== undefined) {
    const queryClient = client;
    await vi.waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
      expect(queryClient.isMutating()).toBe(0);
    }, WAIT);
    client = undefined;
  }
});

// What is on offer

describe('which actions a ship is offered', () => {
  it('offers Orbit to a docked ship, and Dock plus Navigate to one in orbit', () => {
    const { wrapper } = renderActions(shipAt('DOCKED'));
    expect(offered(wrapper)).toEqual(['Orbit']);
    wrapper.unmount();

    const { wrapper: orbiting } = renderActions(shipAt('IN_ORBIT'));
    expect(offered(orbiting)).toEqual(['Dock', 'Navigate']);
  });

  it('sends a docked ship to orbit and writes the new status into the cache, which is what unlocks Navigate', async () => {
    server.use(
      http.post(apiUrl('/my/ships/{shipSymbol}/orbit'), () =>
        HttpResponse.json({ data: { nav: buildShipNav({ status: 'IN_ORBIT' }) } }),
      ),
    );
    const { wrapper, queryClient } = renderActions(shipAt('DOCKED'));

    await wrapper.find('.ship-actions-orbit').trigger('click');
    await vi.waitFor(() => {
      expect(queryClient.getQueryData<Ship>(fleetKeys.detail(TEST_SHIP_SYMBOL))?.nav.status).toBe('IN_ORBIT');
    }, WAIT);
  });

  it('offers a ship in transit nothing at all, and says why', () => {
    const { wrapper } = renderActions(shipAt('IN_TRANSIT'));

    expect(offered(wrapper)).toEqual([]);
    expect(wrapper.find('.ship-actions-none').text()).toContain('in transit');
  });
});

// Navigate: ask first

describe('navigating', () => {
  const orbitingWithFuel = (): Ship =>
    buildShip({
      nav: { status: 'IN_ORBIT' },
      fuel: buildShipFuel({ current: 336, capacity: 400, consumed: { amount: 64 } }),
    });

  it('asks for a destination and confirms before sending, and confirming sends exactly one request', async () => {
    server.use(
      http.post(apiUrl('/my/ships/{shipSymbol}/navigate'), () =>
        HttpResponse.json({
          data: { nav: buildShipNav({ status: 'IN_TRANSIT' }), fuel: buildShipFuel({ current: 272 }), events: [] },
        }),
      ),
    );
    const counter = createRequestCounter();
    server.use(counter.handler); // last, so it sits first
    const requests = recordRequestLines(server);

    const { wrapper } = renderActions(orbitingWithFuel());
    await wrapper.find('.ship-actions-navigate').trigger('click');
    await flushPromises();

    // The dialog is up, and nothing has been sent: the destination is still missing.
    expect(wrapper.find('.confirm-dialog').exists()).toBe(true);
    expect(wrapper.find('.confirm-dialog-confirm').attributes('disabled')).toBeDefined();
    await settle();
    expect(counter.count()).toBe(0);
    expect(requests).toEqual([]);

    // It shows the tank, since the API only reports a trip's cost once the trip is made.
    expect(wrapper.find('.confirm-dialog').text()).toContain('Fuel 336 / 400');

    await wrapper.find('input.ship-actions-destination').setValue(DESTINATION);
    await flushPromises();
    expect(wrapper.find('.confirm-dialog-confirm').attributes('disabled')).toBeUndefined();

    await wrapper.find('.confirm-dialog-confirm').trigger('click');
    await settle();

    // The same counter that read zero above now reads one: one request, and it is the navigation.
    expect(counter.count()).toBe(1);
    expect(requests).toEqual([`POST ${NAVIGATE_URL}`]);
    expect(wrapper.find('dialog.confirm-dialog').attributes('open')).toBeUndefined();
  });

  it('will not send a destination outside the ship’s system, and says so', async () => {
    const counter = createRequestCounter();
    server.use(counter.handler);

    const { wrapper } = renderActions(orbitingWithFuel());
    await wrapper.find('.ship-actions-navigate').trigger('click');
    await wrapper.find('input.ship-actions-destination').setValue('X1-ZZ99-A1');
    await flushPromises();

    expect(wrapper.find('.base-field-error').text()).toContain(TEST_SYSTEM_SYMBOL);
    expect(wrapper.find('.confirm-dialog-confirm').attributes('disabled')).toBeDefined();

    await wrapper.find('.confirm-dialog-confirm').trigger('click');
    await settle();

    expect(counter.count()).toBe(0);
  });

  it('warns with the danger button when the tank is empty', async () => {
    const empty = buildShip({ nav: { status: 'IN_ORBIT' }, fuel: buildShipFuel({ current: 0, capacity: 400 }) });
    const { wrapper } = renderActions(empty);

    await wrapper.find('.ship-actions-navigate').trigger('click');
    await flushPromises();

    expect(wrapper.find('.confirm-dialog').text()).toContain('The tank is empty');
    expect(wrapper.find('.confirm-dialog-confirm').classes()).toContain('danger');
  });
});

// Failure

describe('an action the API rejects', () => {
  it("shows the API's message, leaves the cache untouched and keeps the ship usable", async () => {
    server.use(
      http.post(apiUrl('/my/ships/{shipSymbol}/navigate'), () =>
        apiErrorResponse(400, { message: 'Ship ALICE-1 has insufficient fuel.', code: 4203 }),
      ),
    );
    const counter = createRequestCounter();
    server.use(counter.handler);

    const ship = shipAt('IN_ORBIT', { current: 220, capacity: 400 });
    const { wrapper, queryClient } = renderActions(ship);

    await wrapper.find('.ship-actions-navigate').trigger('click');
    await wrapper.find('input.ship-actions-destination').setValue(DESTINATION);
    await wrapper.find('.confirm-dialog-confirm').trigger('click');
    await vi.waitFor(() => {
      expect(wrapper.find('.ship-actions-error').exists()).toBe(true);
    }, WAIT);

    expect(wrapper.find('.ship-actions-error').text()).toBe('Ship ALICE-1 has insufficient fuel.');
    // The cached ship is the very same object: a failed mutation writes nothing.
    expect(queryClient.getQueryData<Ship>(fleetKeys.detail(TEST_SHIP_SYMBOL))).toBe(ship);

    // Still usable: the actions are still offered, the dialog closed, and asking again sends again.
    expect(offered(wrapper)).toEqual(['Dock', 'Navigate']);
    expect(wrapper.find('dialog.confirm-dialog').attributes('open')).toBeUndefined();

    await wrapper.find('.ship-actions-navigate').trigger('click');
    await wrapper.find('input.ship-actions-destination').setValue(DESTINATION);
    await wrapper.find('.confirm-dialog-confirm').trigger('click');
    await settle();
    expect(counter.count()).toBe(2);
  });
});
