import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CreditsAmount from '@/modules/agent/components/credits-amount.vue';

describe('CreditsAmount', () => {
  it('formats credits with thousands separators and the unit', () => {
    expect(mount(CreditsAmount, { props: { credits: 175_000 } }).text()).toBe('175,000 cr');
  });

  it('marks a negative balance, which the API documents as possible', () => {
    const wrapper = mount(CreditsAmount, { props: { credits: -12_400, badge: true } });

    expect(wrapper.text()).toContain('-12,400 cr');
    expect(wrapper.classes()).toContain('is-negative');
    expect(wrapper.find('.base-badge').text()).toBe('Negative balance');
  });

  it('keeps the badge out of the top-bar chip, which shows the amount alone', () => {
    const wrapper = mount(CreditsAmount, { props: { credits: -12_400 } });

    expect(wrapper.classes()).toContain('is-negative');
    expect(wrapper.find('.base-badge').exists()).toBe(false);
  });

  it('zero is not a negative balance', () => {
    expect(mount(CreditsAmount, { props: { credits: 0, badge: true } }).classes()).not.toContain('is-negative');
  });
});
