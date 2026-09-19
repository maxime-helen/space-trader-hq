import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BaseBadge from '@/shared/ui/base-badge.vue';

const VARIANTS = ['docked', 'orbit', 'transit', 'neutral', 'danger', 'positive'] as const;

describe('BaseBadge', () => {
  it('renders the label slot and defaults to the neutral variant', () => {
    const wrapper = mount(BaseBadge, { slots: { default: 'HAULER' } });

    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.text()).toBe('HAULER');
    expect(wrapper.classes()).toContain('neutral');
  });

  it.each(VARIANTS)('renders the %s variant with a text label', (variant) => {
    const wrapper = mount(BaseBadge, { props: { variant }, slots: { default: 'In transit' } });

    expect(wrapper.classes()).toContain(variant);
    expect(wrapper.text()).toBe('In transit');
  });

  it('only ever carries one variant class', () => {
    const wrapper = mount(BaseBadge, { props: { variant: 'orbit' } });

    expect(VARIANTS.filter((variant) => wrapper.classes().includes(variant))).toEqual(['orbit']);
  });

  it('passes native attributes through', () => {
    const wrapper = mount(BaseBadge, { attrs: { title: 'Docked at X1-DF55-B7', 'data-testid': 'status' } });

    expect(wrapper.attributes('title')).toBe('Docked at X1-DF55-B7');
    expect(wrapper.attributes('data-testid')).toBe('status');
  });
});
