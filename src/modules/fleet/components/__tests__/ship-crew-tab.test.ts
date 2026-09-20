import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ShipCrewTab from '@/modules/fleet/components/ship-crew-tab.vue';
import { buildShip } from '@/shared/api/__tests__/fixtures';

describe('ShipCrewTab', () => {
  const wrapper = mount(ShipCrewTab, {
    props: {
      ship: buildShip({ crew: { current: 12, required: 10, capacity: 20, rotation: 'RELAXED', morale: 70, wages: 4 } }),
    },
  });

  it('shows current, required and capacity', () => {
    const rows = wrapper.findAll('.ship-crew-row').map((row) => [row.find('dt').text(), row.find('dd').text()]);

    expect(rows.slice(0, 3)).toEqual([
      ['Current', '12'],
      ['Required', '10'],
      ['Capacity', '20'],
    ]);
  });

  it('reads the rotation as an API value in sentence case', () => {
    expect(wrapper.text()).toContain('Relaxed');
  });

  it('reads the wages as "4 cr per crew member"', () => {
    expect(wrapper.find('.ship-crew-wages').text()).toBe('4 cr per crew member');
  });

  it('shows morale as a meter out of 100', () => {
    const morale = wrapper.find('.ship-crew-morale');

    expect(morale.find('meter').attributes('value')).toBe('70');
    expect(morale.find('meter').attributes('max')).toBe('100');
    expect(morale.text()).toContain('70%');
  });
});
