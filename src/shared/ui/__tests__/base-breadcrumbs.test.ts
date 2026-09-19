import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';

import BaseBreadcrumbs from '@/shared/ui/base-breadcrumbs.vue';

const BLANK = { render: () => null };

let router: Router;

beforeEach(async () => {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: BLANK },
      { path: '/systems', component: BLANK },
      { path: '/systems/:symbol', component: BLANK },
      { path: '/systems/:symbol/:waypoint', component: BLANK },
    ],
  });
  await router.push('/');
  await router.isReady();
});

const ITEMS = [
  { label: 'Systems', to: '/systems' },
  { label: 'X1-DF55', to: '/systems/X1-DF55' },
  { label: 'X1-DF55-A2' },
];

describe('BaseBreadcrumbs', () => {
  it('renders the trail as a list inside a nav', () => {
    const wrapper = mount(BaseBreadcrumbs, { props: { items: ITEMS }, global: { plugins: [router] } });

    expect(wrapper.element.tagName).toBe('NAV');
    expect(wrapper.findAll('li')).toHaveLength(3);
    expect(wrapper.findAll('li').map((item) => item.text())).toEqual(['Systems', 'X1-DF55', 'X1-DF55-A2']);
  });

  it('links every crumb that has a destination', () => {
    const wrapper = mount(BaseBreadcrumbs, { props: { items: ITEMS }, global: { plugins: [router] } });
    const links = wrapper.findAll('a');

    expect(links).toHaveLength(2);
    expect(links[0]?.attributes('href')).toBe('/systems');
    expect(links[1]?.attributes('href')).toBe('/systems/X1-DF55');
  });

  it('leaves the current page as plain text', () => {
    const wrapper = mount(BaseBreadcrumbs, { props: { items: ITEMS }, global: { plugins: [router] } });
    const last = wrapper.findAll('li')[2];

    expect(last?.find('a').exists()).toBe(false);
    expect(last?.find('span').text()).toBe('X1-DF55-A2');
  });

  it('renders an empty trail without crumbs', () => {
    const wrapper = mount(BaseBreadcrumbs, { props: { items: [] }, global: { plugins: [router] } });

    expect(wrapper.findAll('li')).toHaveLength(0);
  });
});
