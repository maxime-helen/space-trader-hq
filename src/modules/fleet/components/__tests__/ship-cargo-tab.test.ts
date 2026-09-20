import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ShipCargoTab from '@/modules/fleet/components/ship-cargo-tab.vue';
import { buildShip } from '@/shared/api/__tests__/fixtures';
import type { Ship } from '@/shared/api/types';

const render = (ship: Ship): VueWrapper => mount(ShipCargoTab, { props: { ship } });

const loaded = buildShip({
  cargo: {
    capacity: 120,
    units: 80,
    inventory: [
      { symbol: 'IRON_ORE', name: 'Iron Ore', description: 'Ore.', units: 60 },
      { symbol: 'COPPER_ORE', name: 'Copper Ore', description: 'Ore.', units: 20 },
    ],
  },
});

describe('ShipCargoTab', () => {
  it('shows the hold as a meter with units and capacity', () => {
    const wrapper = render(loaded);

    expect(wrapper.find('meter').attributes('value')).toBe('80');
    expect(wrapper.find('meter').attributes('max')).toBe('120');
    expect(wrapper.text()).toContain('80 / 120');
  });

  it('lists the inventory as good, name and units', () => {
    const wrapper = render(loaded);

    expect(wrapper.findAll('thead th').map((cell) => cell.text())).toEqual(['Good', 'Name', 'Units']);
    const rows = wrapper.findAll('tbody tr').map((row) => row.findAll('td').map((cell) => cell.text()));
    expect(rows).toEqual([
      ['Iron ore', 'Iron Ore', '60'],
      ['Copper ore', 'Copper Ore', '20'],
    ]);
  });

  it('replaces the table with "The hold is empty." when nothing is aboard', () => {
    const wrapper = render(buildShip());

    expect(wrapper.find('table').exists()).toBe(false);
    expect(wrapper.find('.ship-cargo-empty').text()).toBe('The hold is empty.');
  });

  it('shows "No cargo hold" instead of dividing by a capacity of zero', () => {
    const wrapper = render(buildShip({ cargo: { capacity: 0, units: 0, inventory: [] } }));

    expect(wrapper.find('meter').exists()).toBe(false);
    expect(wrapper.text()).toContain('No cargo hold');
  });
});
