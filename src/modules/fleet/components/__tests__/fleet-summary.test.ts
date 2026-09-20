import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FleetSummary from '@/modules/fleet/components/fleet-summary.vue';

const COUNTS = { DOCKED: 1, IN_ORBIT: 1, IN_TRANSIT: 1 };

const items = (wrapper: VueWrapper): string[] =>
  wrapper.findAll('.fleet-summary-item, .fleet-summary-scope').map((item) => item.text());

describe('FleetSummary', () => {
  it('reads as one breakdown when the whole fleet is on the page', () => {
    const wrapper = mount(FleetSummary, { props: { totalShips: 3, shownShips: 3, counts: COUNTS } });

    expect(items(wrapper)).toEqual(['3 ships', '1 docked', '1 in orbit', '1 in transit']);
  });

  it('scopes the counts to the page when the fleet spans several', () => {
    const wrapper = mount(FleetSummary, { props: { totalShips: 40, shownShips: 3, counts: COUNTS } });

    expect(items(wrapper)).toEqual(['40 ships', 'On this page:', '1 docked', '1 in orbit', '1 in transit']);
  });

  it('uses the singular for a fleet of one', () => {
    const wrapper = mount(FleetSummary, {
      props: { totalShips: 1, shownShips: 1, counts: { DOCKED: 1, IN_ORBIT: 0, IN_TRANSIT: 0 } },
    });

    expect(items(wrapper)[0]).toBe('1 ship');
  });
});
