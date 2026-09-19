import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BaseMeter from '@/shared/ui/base-meter.vue';

describe('BaseMeter', () => {
  it('renders a native <meter> carrying the value and the capacity', () => {
    const wrapper = mount(BaseMeter, { props: { value: 210, max: 600, label: 'Fuel' } });
    const meter = wrapper.find('meter');

    expect(meter.exists()).toBe(true);
    expect(meter.element.tagName).toBe('METER');
    expect(meter.attributes('value')).toBe('210');
    expect(meter.attributes('max')).toBe('600');
    expect(meter.attributes('min')).toBe('0');
  });

  it('labels the gauge "current / capacity" beside its caption', () => {
    const wrapper = mount(BaseMeter, { props: { value: 210, max: 600, label: 'Fuel' } });

    expect(wrapper.text()).toContain('Fuel');
    expect(wrapper.text()).toContain('210 / 600');
  });

  it('clamps the gauge into [0, max] without touching the label', () => {
    const over = mount(BaseMeter, { props: { value: 900, max: 600 } });
    expect(over.find('meter').attributes('value')).toBe('600');
    expect(over.text()).toContain('900 / 600');

    const under = mount(BaseMeter, { props: { value: -5, max: 600 } });
    expect(under.find('meter').attributes('value')).toBe('0');
  });

  it('reports the fill as a percentage of the capacity', () => {
    const wrapper = mount(BaseMeter, { props: { value: 150, max: 600 } });

    expect(wrapper.vm.percent).toBe(25);
  });

  // Spec: fuel capacity 0 is valid (some ship types carry no fuel) and must show a fallback
  // instead of a meter or a division by zero.
  it("renders the caller's fallback for a capacity of 0, with no gauge, no division and no NaN", () => {
    const wrapper = mount(BaseMeter, {
      props: { value: 0, max: 0, label: 'Fuel' },
      slots: { empty: 'No fuel tank' },
    });

    expect(wrapper.find('meter').exists()).toBe(false);
    expect(wrapper.text()).toBe('No fuel tank');
    expect(wrapper.html()).not.toContain('NaN');
    expect(wrapper.html()).not.toContain('Infinity');
    expect(wrapper.vm.percent).toBe(0);
    expect(Number.isNaN(wrapper.vm.percent)).toBe(false);
  });

  it('keeps a non-zero value out of a zero capacity from producing NaN', () => {
    const wrapper = mount(BaseMeter, { props: { value: 40, max: 0 }, slots: { empty: 'No cargo hold' } });

    expect(wrapper.vm.percent).toBe(0);
    expect(wrapper.html()).not.toContain('NaN');
  });

  it('lets the caller replace the value text', () => {
    const wrapper = mount(BaseMeter, {
      props: { value: 1200, max: 2400, label: 'Cargo' },
      slots: { value: '1,200 / 2,400' },
    });

    expect(wrapper.text()).toContain('1,200 / 2,400');
  });
});
