import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BaseCard from '@/shared/ui/base-card.vue';

describe('BaseCard', () => {
  it('renders a div with its default slot', () => {
    const wrapper = mount(BaseCard, { slots: { default: 'Card content' } });

    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.text()).toBe('Card content');
    expect(wrapper.classes()).toContain('base-card');
  });

  it('renders the title and aside slots in a heading', () => {
    const wrapper = mount(BaseCard, {
      slots: { title: 'Fleet', aside: 'Updated 2 min ago', default: 'Rows' },
    });

    const heading = wrapper.get('h4');
    expect(heading.text()).toContain('Fleet');
    expect(heading.text()).toContain('Updated 2 min ago');
  });

  it('omits the heading when no title slot is given', () => {
    const wrapper = mount(BaseCard, { slots: { default: 'Rows' } });

    expect(wrapper.find('h4').exists()).toBe(false);
  });

  it('drops its padding when flush is set', () => {
    const wrapper = mount(BaseCard, { props: { flush: true } });

    expect(wrapper.classes()).toContain('is-flush');
    expect(mount(BaseCard).classes()).not.toContain('is-flush');
  });

  it('passes native attributes through', () => {
    const wrapper = mount(BaseCard, { attrs: { id: 'fleet-card', 'data-testid': 'card' } });

    expect(wrapper.attributes('id')).toBe('fleet-card');
    expect(wrapper.attributes('data-testid')).toBe('card');
  });
});
