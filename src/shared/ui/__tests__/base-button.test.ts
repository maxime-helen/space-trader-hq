import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BaseButton from '@/shared/ui/base-button.vue';

describe('BaseButton', () => {
  it('renders its slot in a native button and defaults to the secondary variant', () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Try again' } });

    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.text()).toBe('Try again');
    expect(wrapper.classes()).toContain('secondary');
    expect(wrapper.classes()).not.toContain('primary');
  });

  it('applies the primary variant', () => {
    const wrapper = mount(BaseButton, { props: { variant: 'primary' } });

    expect(wrapper.classes()).toContain('primary');
  });

  it('applies the danger variant, which the P1 ship actions unlocked', () => {
    const wrapper = mount(BaseButton, { props: { variant: 'danger' }, slots: { default: 'Navigate' } });

    expect(wrapper.classes()).toContain('danger');
    expect(wrapper.classes()).not.toContain('primary');
    expect(wrapper.text()).toBe('Navigate');
  });

  it('keeps the danger variant disabled and spinning while it is loading', () => {
    const wrapper = mount(BaseButton, { props: { variant: 'danger', loading: true } });

    expect(wrapper.classes()).toContain('danger');
    expect(wrapper.find('.base-button-spinner').exists()).toBe(true);
    expect(wrapper.attributes('disabled')).toBeDefined();
  });

  it('emits click with the native event', async () => {
    const wrapper = mount(BaseButton);

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.emitted('click')?.[0]?.[0]).toBeInstanceOf(Event);
  });

  it('does not emit click while disabled', async () => {
    const wrapper = mount(BaseButton, { props: { disabled: true } });

    await wrapper.trigger('click');

    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('shows a spinner and disables itself while loading', () => {
    const wrapper = mount(BaseButton, { props: { loading: true }, slots: { default: 'Checking token' } });

    expect(wrapper.find('.base-button-spinner').exists()).toBe(true);
    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toBe('Checking token');
  });

  it('has no spinner when it is not loading', () => {
    const wrapper = mount(BaseButton);

    expect(wrapper.find('.base-button-spinner').exists()).toBe(false);
  });

  it('defaults to type="button" and passes native attributes through', () => {
    const plain = mount(BaseButton);
    expect(plain.attributes('type')).toBe('button');

    const wrapper = mount(BaseButton, { attrs: { type: 'submit', name: 'sign-in', 'data-testid': 'go' } });

    expect(wrapper.attributes('type')).toBe('submit');
    expect(wrapper.attributes('name')).toBe('sign-in');
    expect(wrapper.attributes('data-testid')).toBe('go');
  });
});
