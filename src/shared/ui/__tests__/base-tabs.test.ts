import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BaseTabs from '@/shared/ui/base-tabs.vue';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'cargo', label: 'Cargo' },
  { id: 'crew', label: 'Crew' },
];

describe('BaseTabs', () => {
  it('renders every tab as a native button', () => {
    const wrapper = mount(BaseTabs, { props: { tabs: TABS, modelValue: 'overview' } });
    const buttons = wrapper.findAll('button');

    expect(buttons).toHaveLength(3);
    expect(buttons.map((button) => button.text())).toEqual(['Overview', 'Cargo', 'Crew']);
    expect(buttons[0]?.attributes('type')).toBe('button');
  });

  it('marks only the tab named by the model value as active', () => {
    const wrapper = mount(BaseTabs, { props: { tabs: TABS, modelValue: 'cargo' } });
    const buttons = wrapper.findAll('button');

    expect(buttons[0]?.classes()).not.toContain('is-active');
    expect(buttons[1]?.classes()).toContain('is-active');
    expect(buttons[2]?.classes()).not.toContain('is-active');
  });

  it('reports the picked tab through the model', async () => {
    const wrapper = mount(BaseTabs, { props: { tabs: TABS, modelValue: 'overview' } });

    await wrapper.findAll('button')[2]?.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['crew']]);
  });

  it('follows the model value when the page changes it', async () => {
    const wrapper = mount(BaseTabs, { props: { tabs: TABS, modelValue: 'overview' } });

    await wrapper.setProps({ modelValue: 'crew' });

    expect(wrapper.findAll('button')[2]?.classes()).toContain('is-active');
  });
});
