import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import NotFoundPage from '@/app/pages/not-found-page.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: NotFoundPage }],
});

const mountPage = () => mount(NotFoundPage, { global: { plugins: [router] } });

describe('not found page', () => {
  it('says what happened', () => {
    const wrapper = mountPage();

    expect(wrapper.get('.not-found-title').text()).toBe('Page not found');
  });

  it('offers the way back to the agent page', () => {
    const wrapper = mountPage();

    expect(wrapper.get('a').attributes('href')).toBe('/');
  });

  it('needs no session: it renders without the authenticated shell', () => {
    const wrapper = mountPage();

    expect(wrapper.find('.layout-topbar').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Sign out');
  });
});
