import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import WaypointHeader from '@/modules/systems/components/waypoint-header.vue';
import { buildWaypoint } from '@/shared/api/__tests__/fixtures';
import type { Waypoint } from '@/shared/api/types';

const mountHeader = (waypoint: Waypoint) =>
  mount(WaypointHeader, { props: { waypoint }, global: { stubs: { RouterLink: RouterLinkStub } } });

const crumbs = (wrapper: ReturnType<typeof mountHeader>): string[] =>
  wrapper.findAll('.base-breadcrumbs-item').map((item) => item.text());

describe('WaypointHeader', () => {
  it('shows the symbol, the type, the coordinates and the controlling faction', () => {
    const wrapper = mountHeader(
      buildWaypoint({ symbol: 'X1-DF55-A2', type: 'ORBITAL_STATION', x: -2210, y: 405, faction: { symbol: 'COSMIC' } }),
    );

    expect(wrapper.find('.waypoint-header-symbol').text()).toBe('X1-DF55-A2');
    expect(wrapper.text()).toContain('Orbital station');
    // Coordinates carry no thousands separators, or they read as three numbers.
    expect(wrapper.text()).toContain('-2210, 405');
    expect(wrapper.text()).toContain('Cosmic');
  });

  it('badges a waypoint under construction', () => {
    const wrapper = mountHeader(buildWaypoint({ isUnderConstruction: true }));

    expect(wrapper.text()).toContain('Under construction');
  });

  it('badges a waypoint as uncharted when the chart is missing', () => {
    const wrapper = mountHeader(buildWaypoint());

    expect(wrapper.text()).toContain('Uncharted');
    expect(wrapper.text()).toContain('Not charted');
  });

  it('names the charter and the date instead when a chart came back', () => {
    const wrapper = mountHeader(
      buildWaypoint({ chart: { submittedBy: 'ALICE', submittedOn: '2026-09-06T10:00:00.000Z' } }),
    );

    expect(wrapper.text()).not.toContain('Uncharted');
    expect(wrapper.text()).toContain('Charted by ALICE');
    expect(wrapper.text()).toContain('Sep 6, 2026');
  });

  it('says so when no faction controls the waypoint', () => {
    const wrapper = mountHeader(buildWaypoint());

    expect(wrapper.text()).toContain('Uncontrolled');
  });

  it('breadcrumbs Systems > system > waypoint', () => {
    const wrapper = mountHeader(buildWaypoint({ symbol: 'X1-AB12-A1', systemSymbol: 'X1-AB12' }));

    expect(crumbs(wrapper)).toEqual(['Systems', 'X1-AB12', 'X1-AB12-A1']);
  });

  it('adds the parent waypoint to the breadcrumb when this one orbits another', () => {
    const wrapper = mountHeader(
      buildWaypoint({ symbol: 'X1-AB12-A1-M1', systemSymbol: 'X1-AB12', orbits: 'X1-AB12-A1' }),
    );

    expect(crumbs(wrapper)).toEqual(['Systems', 'X1-AB12', 'X1-AB12-A1', 'X1-AB12-A1-M1']);
    expect(wrapper.findAllComponents(RouterLinkStub).map((link) => link.props('to'))).toEqual([
      '/systems',
      '/systems/X1-AB12',
      '/systems/X1-AB12/waypoints/X1-AB12-A1',
      '/systems/X1-AB12',
    ]);
  });
});
