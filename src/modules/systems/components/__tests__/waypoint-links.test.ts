import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import WaypointLinks from '@/modules/systems/components/waypoint-links.vue';

const mountLinks = (props: { systemSymbol: string; orbits?: string; orbitals: { symbol: string }[] }) =>
  mount(WaypointLinks, { props, global: { stubs: { RouterLink: RouterLinkStub } } });

describe('WaypointLinks', () => {
  it('links the parent waypoint it orbits', () => {
    const wrapper = mountLinks({ systemSymbol: 'X1-AB12', orbits: 'X1-AB12-A1', orbitals: [] });

    expect(wrapper.text()).toContain('Orbits');
    expect(wrapper.findComponent(RouterLinkStub).props('to')).toBe('/systems/X1-AB12/waypoints/X1-AB12-A1');
  });

  it('links every orbital', () => {
    const wrapper = mountLinks({
      systemSymbol: 'X1-AB12',
      orbitals: [{ symbol: 'X1-AB12-A1-M1' }, { symbol: 'X1-AB12-A1-M2' }],
    });

    expect(wrapper.findAllComponents(RouterLinkStub).map((link) => link.props('to'))).toEqual([
      '/systems/X1-AB12/waypoints/X1-AB12-A1-M1',
      '/systems/X1-AB12/waypoints/X1-AB12-A1-M2',
    ]);
  });

  it('says so when nothing orbits the waypoint and it orbits nothing', () => {
    const wrapper = mountLinks({ systemSymbol: 'X1-AB12', orbitals: [] });

    expect(wrapper.text()).toContain('Nothing orbits this waypoint.');
    expect(wrapper.findAllComponents(RouterLinkStub)).toHaveLength(0);
  });
});
