import { VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory } from 'vue-router';

import AuthenticatedLayout from '@/app/layouts/authenticated-layout.vue';
import { createAppRouter } from '@/app/router';
import { useSessionStore } from '@/modules/auth';

vi.mock('@/modules/agent', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/agent')>()),
  AgentChip: { name: 'AgentChip', template: '<div data-test="agent-chip"></div>' },
}));

const mountLayout = async () => {
  const router = createAppRouter(createMemoryHistory());
  useSessionStore().signIn('test-token');
  await router.push('/');
  await router.isReady();

  return mount(AuthenticatedLayout, {
    // The layout starts the arrival scheduler, which reads the query cache.
    global: { plugins: [router, VueQueryPlugin], stubs: { RouterView: true } },
  });
};

beforeEach(() => {
  setActivePinia(createPinia());
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
});

describe('authenticated layout', () => {
  it('shows the app name in the top bar', async () => {
    const wrapper = await mountLayout();

    expect(wrapper.get('.layout-brand').text()).toBe('SpaceTradersHQ');
  });

  it('lists the navigation in order', async () => {
    const wrapper = await mountLayout();

    const labels = wrapper.findAll('.layout-nav .layout-nav-link').map((item) => item.text());
    expect(labels).toEqual(['Agent', 'Systems', 'Fleet', 'Markets']);
  });

  it('links every section, in order, and marks the Agent page as current', async () => {
    const wrapper = await mountLayout();

    const links = wrapper.findAll('.layout-nav a');
    expect(links.map((link) => link.attributes('href'))).toEqual(['/', '/systems', '/fleet', '/markets']);
    expect(links[0]?.classes()).toContain('is-current');
  });

  it('hosts the agent chip, which carries Sign out in its own menu', async () => {
    const wrapper = await mountLayout();

    expect(wrapper.find('.layout-chip [data-test="agent-chip"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Sign out');
  });

  it('renders the page inside an error boundary', async () => {
    const wrapper = await mountLayout();

    expect(wrapper.findComponent({ name: 'route-error-boundary' }).exists()).toBe(true);
  });

  it('has no mobile tab bar: the console is desktop only', async () => {
    const wrapper = await mountLayout();

    expect(wrapper.find('.tabbar').exists()).toBe(false);
  });
});
