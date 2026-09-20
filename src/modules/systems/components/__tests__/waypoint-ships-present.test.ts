import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import WaypointShipsPresent from '@/modules/systems/components/waypoint-ships-present.vue';
import { buildShip } from '@/shared/api/__tests__/fixtures';

const mountShips = (ships: ReturnType<typeof buildShip>[]) =>
  mount(WaypointShipsPresent, { props: { ships }, global: { stubs: { RouterLink: RouterLinkStub } } });

describe('WaypointShipsPresent', () => {
  it('links every ship to its ship page, with its status', () => {
    const wrapper = mountShips([
      buildShip({ symbol: 'ALICE-1' }),
      buildShip({ symbol: 'ALICE-2', nav: { status: 'IN_ORBIT' }, registration: { role: 'SATELLITE' } }),
    ]);

    expect(wrapper.findAllComponents(RouterLinkStub).map((link) => link.props('to'))).toEqual([
      '/fleet/ALICE-1',
      '/fleet/ALICE-2',
    ]);
    expect(wrapper.text()).toContain('Docked');
    expect(wrapper.text()).toContain('In orbit');
    expect(wrapper.text()).toContain('Satellite');
  });

  it('says so when none of your ships are here', () => {
    const wrapper = mountShips([]);

    expect(wrapper.text()).toContain('None of your ships are here.');
  });
});
