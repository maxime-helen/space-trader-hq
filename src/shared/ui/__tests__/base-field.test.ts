import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BaseField from '@/shared/ui/base-field.vue';

describe('BaseField', () => {
  it('renders a text input inside a label by default', () => {
    const wrapper = mount(BaseField);

    expect(wrapper.element.tagName).toBe('LABEL');
    expect(wrapper.find('input.base-field-control').exists()).toBe(true);
    expect(wrapper.find('textarea').exists()).toBe(false);
  });

  it('renders a textarea for the textarea variant', () => {
    const wrapper = mount(BaseField, { props: { variant: 'textarea' } });

    expect(wrapper.find('textarea.base-field-control').exists()).toBe(true);
    expect(wrapper.find('input').exists()).toBe(false);
  });

  it('shows the label text only when one is given', () => {
    expect(mount(BaseField).find('.base-field-label').exists()).toBe(false);
    expect(
      mount(BaseField, { props: { label: 'Token' } })
        .get('.base-field-label')
        .text(),
    ).toBe('Token');
  });

  it('emits update:modelValue as the value is typed', async () => {
    const wrapper = mount(BaseField, { props: { modelValue: '' } });

    await wrapper.get('input').setValue('X1-DF55');

    expect(wrapper.emitted('update:modelValue')).toEqual([['X1-DF55']]);
  });

  it('emits update:modelValue from the textarea variant too', async () => {
    const wrapper = mount(BaseField, { props: { variant: 'textarea', modelValue: '' } });

    await wrapper.get('textarea').setValue('two\nlines');

    expect(wrapper.emitted('update:modelValue')).toEqual([['two\nlines']]);
  });

  it('shows the model value in the control', () => {
    const wrapper = mount(BaseField, { props: { modelValue: 'X1-DF55' } });

    expect(wrapper.get('input').element.value).toBe('X1-DF55');
  });

  it('marks the control invalid when invalid is set', () => {
    const wrapper = mount(BaseField, { props: { invalid: true } });

    expect(wrapper.get('input').classes()).toContain('is-invalid');
    expect(wrapper.find('.base-field-error').exists()).toBe(false);
  });

  it('shows the error message and marks the control invalid', () => {
    const wrapper = mount(BaseField, { props: { error: 'No system X1-ZZ99.' } });

    expect(wrapper.get('.base-field-error').text()).toBe('No system X1-ZZ99.');
    expect(wrapper.get('input').classes()).toContain('is-invalid');
  });

  it('is valid by default', () => {
    const wrapper = mount(BaseField);

    expect(wrapper.get('input').classes()).not.toContain('is-invalid');
  });

  it('disables the control', () => {
    const wrapper = mount(BaseField, { props: { disabled: true } });

    expect(wrapper.get('input').attributes('disabled')).toBeDefined();
  });

  it('passes native attributes through to the control, not the wrapper', () => {
    const wrapper = mount(BaseField, {
      attrs: { type: 'password', placeholder: 'System or waypoint symbol', maxlength: '12' },
    });

    const input = wrapper.get('input');
    expect(input.attributes('type')).toBe('password');
    expect(input.attributes('placeholder')).toBe('System or waypoint symbol');
    expect(input.attributes('maxlength')).toBe('12');
    expect(wrapper.attributes('placeholder')).toBeUndefined();
  });

  it('passes native attributes through to the textarea', () => {
    const wrapper = mount(BaseField, { props: { variant: 'textarea' }, attrs: { rows: '4' } });

    expect(wrapper.get('textarea').attributes('rows')).toBe('4');
  });
});
