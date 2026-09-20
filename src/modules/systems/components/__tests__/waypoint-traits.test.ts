import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import WaypointTraits from '@/modules/systems/components/waypoint-traits.vue';
import { buildWaypointTrait } from '@/shared/api/__tests__/fixtures';
import type { WaypointModifier } from '@/shared/api/types';

const MODIFIER: WaypointModifier = {
  symbol: 'CRITICAL_LIMIT',
  name: 'Critical Limit',
  description: 'The waypoint is on the verge of collapse.',
};

describe('WaypointTraits', () => {
  it('renders one card per trait, with its name and description', () => {
    const wrapper = mount(WaypointTraits, {
      props: {
        traits: [
          buildWaypointTrait(),
          buildWaypointTrait({ symbol: 'SHIPYARD', name: 'Shipyard', description: 'Ships are built here.' }),
        ],
      },
    });

    const cards = wrapper.findAll('.waypoint-traits-item');
    expect(cards).toHaveLength(2);
    expect(cards[0]?.text()).toContain('Marketplace');
    expect(cards[0]?.text()).toContain('A thriving center of commerce.');
    expect(cards[1]?.text()).toContain('Shipyard');
    expect(cards[1]?.text()).toContain('Ships are built here.');
  });

  it('shows the modifiers when the waypoint has some', () => {
    const wrapper = mount(WaypointTraits, { props: { traits: [buildWaypointTrait()], modifiers: [MODIFIER] } });

    expect(wrapper.text()).toContain('Modifiers');
    expect(wrapper.text()).toContain('Critical Limit');
    expect(wrapper.text()).toContain('The waypoint is on the verge of collapse.');
  });

  it('leaves the modifiers section out when there are none', () => {
    const wrapper = mount(WaypointTraits, { props: { traits: [buildWaypointTrait()] } });

    expect(wrapper.text()).not.toContain('Modifiers');
  });

  it('says so when a waypoint has no traits at all', () => {
    const wrapper = mount(WaypointTraits, { props: { traits: [] } });

    expect(wrapper.text()).toContain('This waypoint has no traits.');
  });
});
