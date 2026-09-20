import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ShipLocationCell from '@/modules/fleet/components/ship-location-cell.vue';
import { buildShipNav } from '@/shared/api/__tests__/fixtures';
import type { ShipNav } from '@/shared/api/types';

const ARRIVAL = '2026-09-16T12:10:00.000Z';
const NOW = Date.parse('2026-09-16T12:05:00.000Z');
const HOME = 'X1-AB12';

const mountCell = (nav: ShipNav, now: number, homeSystemSymbol: string | undefined = HOME) =>
  mount(ShipLocationCell, {
    props: { nav, now, homeSystemSymbol },
    global: { stubs: { RouterLink: RouterLinkStub } },
  });

const links = (wrapper: ReturnType<typeof mountCell>) =>
  wrapper.findAllComponents(RouterLinkStub).map((link) => link.props('to') as string);

describe('ShipLocationCell', () => {
  it('links the waypoint, and the system only when the ship is away from headquarters', () => {
    const home = mountCell(buildShipNav({ systemSymbol: HOME, waypointSymbol: 'X1-AB12-A1' }), NOW);
    expect(links(home)).toEqual(['/systems/X1-AB12/waypoints/X1-AB12-A1']);

    const away = mountCell(buildShipNav({ systemSymbol: 'X1-ZZ99', waypointSymbol: 'X1-ZZ99-C3' }), NOW);
    expect(links(away)).toEqual(['/systems/X1-ZZ99/waypoints/X1-ZZ99-C3', '/systems/X1-ZZ99']);
    expect(away.text()).toContain('in X1-ZZ99');
  });
});

describe('ShipLocationCell in transit', () => {
  const inTransit = buildShipNav({
    status: 'IN_TRANSIT',
    route: { destination: { symbol: 'X1-AB12-B7', systemSymbol: HOME }, arrival: ARRIVAL },
  });

  it('reads "→ destination" with a live ETA, linked to the destination waypoint', () => {
    const wrapper = mountCell(inTransit, NOW);

    expect(wrapper.find('.ship-location-destination').text()).toMatch(/→\s*X1-AB12-B7/);
    expect(wrapper.find('.ship-location-eta').text()).toBe('ETA 5min00s');
    expect(links(wrapper)).toEqual(['/systems/X1-AB12/waypoints/X1-AB12-B7']);
  });

  it('counts down as the clock moves, without a clock of its own', async () => {
    const wrapper = mountCell(inTransit, NOW);
    await wrapper.setProps({ now: NOW + 60_000 });

    expect(wrapper.find('.ship-location-eta').text()).toBe('ETA 4min00s');
  });

  it('shows "Arriving" with a spinner once the ETA reaches zero', async () => {
    const wrapper = mountCell(inTransit, NOW);
    await wrapper.setProps({ now: Date.parse(ARRIVAL) });

    expect(wrapper.text()).toContain('Arriving');
    expect(wrapper.text()).not.toContain('ETA');
    expect(wrapper.find('.base-spinner').exists()).toBe(true);
  });

  it('shows "Arriving" for a stale cache whose arrival is already past', () => {
    const wrapper = mountCell(inTransit, Date.parse('2026-09-16T13:00:00.000Z'));

    expect(wrapper.text()).toContain('Arriving');
  });
});
