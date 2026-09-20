import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ShipCooldownCell from '@/modules/fleet/components/ship-cooldown-cell.vue';
import { buildCooldown } from '@/shared/api/__tests__/fixtures';
import type { Cooldown } from '@/shared/api/types';

const NOW = Date.parse('2026-09-16T12:05:00.000Z');

const mountCell = (cooldown: Cooldown, now = NOW) => mount(ShipCooldownCell, { props: { cooldown, now } });

describe('ShipCooldownCell', () => {
  it('reads "Ready" when there is no cooldown left', () => {
    expect(mountCell(buildCooldown()).text()).toBe('Ready');
  });

  it('counts down from an absolute expiration as the clock moves', async () => {
    const wrapper = mountCell(buildCooldown({ expiration: '2026-09-16T12:05:42.000Z' }));
    expect(wrapper.text()).toBe('42s');

    await wrapper.setProps({ now: NOW + 40_000 });
    expect(wrapper.text()).toBe('2s');

    await wrapper.setProps({ now: NOW + 42_000 });
    expect(wrapper.text()).toBe('Ready');
  });

  it('falls back to the remaining-seconds snapshot when the payload carries no expiration', () => {
    expect(mountCell(buildCooldown({ remainingSeconds: 125 })).text()).toBe('2min05s');
  });
});
