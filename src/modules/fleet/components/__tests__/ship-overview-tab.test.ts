import { mount, RouterLinkStub, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ShipOverviewTab from '@/modules/fleet/components/ship-overview-tab.vue';
import { buildShip, TEST_SYSTEM_SYMBOL } from '@/shared/api/__tests__/fixtures';
import type { Ship } from '@/shared/api/types';

const MINUTE_MS = 60_000;

const render = (ship: Ship): VueWrapper =>
  mount(ShipOverviewTab, { props: { ship }, global: { stubs: { RouterLink: RouterLinkStub } } });

const transitShip = (departedMinutesAgo: number, arrivesInMinutes: number): Ship => {
  const now = Date.now();
  return buildShip({
    nav: {
      status: 'IN_TRANSIT',
      waypointSymbol: `${TEST_SYSTEM_SYMBOL}-B2`,
      route: {
        origin: { symbol: `${TEST_SYSTEM_SYMBOL}-A1`, systemSymbol: TEST_SYSTEM_SYMBOL, type: 'PLANET', x: 0, y: 0 },
        destination: { symbol: `${TEST_SYSTEM_SYMBOL}-B2`, systemSymbol: TEST_SYSTEM_SYMBOL, type: 'MOON', x: 9, y: 9 },
        departureTime: new Date(now - departedMinutesAgo * MINUTE_MS).toISOString(),
        arrival: new Date(now + arrivesInMinutes * MINUTE_MS).toISOString(),
      },
    },
  });
};

describe('ShipOverviewTab', () => {
  it('links the current waypoint and system, and names the status and flight mode', () => {
    const wrapper = render(buildShip({ nav: { status: 'IN_ORBIT', flightMode: 'BURN' } }));

    const links = wrapper.findAllComponents(RouterLinkStub).map((link) => link.props('to'));
    expect(links).toEqual([
      `/systems/${TEST_SYSTEM_SYMBOL}/waypoints/${TEST_SYSTEM_SYMBOL}-A1`,
      `/systems/${TEST_SYSTEM_SYMBOL}`,
    ]);
    expect(wrapper.text()).toContain('In orbit');
    expect(wrapper.text()).toContain('Burn');
  });

  it('hides the route, the progress bar and the ETA when the ship is not in transit', () => {
    const wrapper = render(buildShip());

    expect(wrapper.find('.ship-overview-transit').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('ETA');
    expect(wrapper.text()).not.toContain('Departed');
  });

  it('draws the trip as a native <progress> bar between 0 and 1', () => {
    const wrapper = render(transitShip(9, 1));

    const bar = wrapper.find('progress.ship-overview-progress');
    expect(bar.element.tagName).toBe('PROGRESS');
    expect(bar.attributes('max')).toBe('1');
    expect(Number(bar.attributes('value'))).toBeGreaterThan(0.85);
    expect(wrapper.text()).toContain('% of the way');
  });

  it('counts down to arrival, then stops at "Arriving" with a spinner', () => {
    expect(render(transitShip(1, 9)).text()).toContain('ETA ');
    expect(render(transitShip(1, 9)).find('.base-spinner').exists()).toBe(false);

    const arrived = render(transitShip(10, -1));
    expect(arrived.text()).toContain('Arriving');
    expect(arrived.text()).not.toContain('ETA ');
    expect(arrived.find('.base-spinner').exists()).toBe(true);
  });

  it('shows the fuel meter, and "No fuel tank" for a ship with no tank', () => {
    const fuelled = render(buildShip({ fuel: { current: 120, capacity: 400 } }));
    expect(fuelled.find('.ship-overview-fuel meter').attributes('value')).toBe('120');
    expect(fuelled.find('.ship-overview-fuel').text()).toContain('120 / 400');

    const dry = render(buildShip({ fuel: { current: 0, capacity: 0 } }));
    expect(dry.find('.ship-overview-fuel meter').exists()).toBe(false);
    expect(dry.find('.ship-overview-fuel').text()).toContain('No fuel tank');
  });

  it('shows the last fuel consumption only when the API sent one', () => {
    const withConsumed = render(
      buildShip({ fuel: { consumed: { amount: 64, timestamp: '2026-09-16T12:00:00.000Z' } } }),
    );
    expect(withConsumed.text()).toContain('This trip used 64');

    const ship = buildShip();
    delete ship.fuel.consumed;
    expect(render(ship).text()).not.toContain('This trip used');
  });

  it('reads "Ready" with no bar, or a countdown with one', () => {
    const ready = render(buildShip());
    expect(ready.find('.ship-overview-cooldown').text()).toContain('Ready');
    expect(ready.find('.ship-overview-cooldown progress').exists()).toBe(false);

    const cooling = render(
      buildShip({
        cooldown: { totalSeconds: 100, remainingSeconds: 50, expiration: new Date(Date.now() + 50_000).toISOString() },
      }),
    );
    expect(cooling.find('.ship-overview-cooldown').text()).not.toContain('Ready');
    expect(Number(cooling.find('.ship-overview-cooldown progress').attributes('value'))).toBeCloseTo(0.5, 1);
  });

  it('falls back to remainingSeconds when the cooldown carries no expiration', () => {
    const wrapper = render(buildShip({ cooldown: { totalSeconds: 60, remainingSeconds: 42 } }));

    expect(wrapper.find('.ship-overview-cooldown').text()).toContain('42s');
  });
});
