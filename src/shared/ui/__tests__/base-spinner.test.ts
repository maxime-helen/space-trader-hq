import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BaseSpinner from '@/shared/ui/base-spinner.vue';

describe('BaseSpinner', () => {
  it('renders a single inline element', () => {
    const wrapper = mount(BaseSpinner);

    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('base-spinner');
    expect(wrapper.text()).toBe('');
  });

  it('passes native attributes through', () => {
    const wrapper = mount(BaseSpinner, { attrs: { 'data-testid': 'refetching', title: 'Loading' } });

    expect(wrapper.attributes('data-testid')).toBe('refetching');
    expect(wrapper.attributes('title')).toBe('Loading');
  });
});
