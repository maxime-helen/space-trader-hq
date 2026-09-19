import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import RouteErrorBoundary from '@/app/layouts/route-error-boundary.vue';

const shouldThrow = ref(true);

const brokenCard = defineComponent({
  name: 'BrokenCard',
  setup() {
    return () => {
      if (shouldThrow.value) throw new Error('cargo table exploded');
      return h('p', { class: 'card' }, 'Recovered');
    };
  },
});

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/fleet', component: { template: '<div />' } },
  ],
});

const mountBoundary = async () => {
  const wrapper = mount(RouteErrorBoundary, {
    slots: { default: () => h(brokenCard) },
    global: { plugins: [router] },
  });
  await nextTick();
  return wrapper;
};

beforeEach(async () => {
  shouldThrow.value = true;
  await router.push('/');
  // A render error is expected in these tests; Vue logs it whatever the boundary does.
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('route error boundary', () => {
  it('catches a failing page and offers Try again instead of a blank screen', async () => {
    const wrapper = await mountBoundary();

    expect(wrapper.find('.route-error').exists()).toBe(true);
    expect(wrapper.text()).toContain('cargo table exploded');
    expect(wrapper.find('button').text()).toBe('Try again');
  });

  it('renders the page untouched when nothing throws', async () => {
    shouldThrow.value = false;
    const wrapper = await mountBoundary();

    expect(wrapper.find('.route-error').exists()).toBe(false);
    expect(wrapper.text()).toBe('Recovered');
  });

  it('re-creates the page on Try again', async () => {
    const wrapper = await mountBoundary();
    shouldThrow.value = false;

    await wrapper.find('button').trigger('click');

    expect(wrapper.find('.route-error').exists()).toBe(false);
    expect(wrapper.text()).toBe('Recovered');
  });

  it('clears the error when the user navigates to another page', async () => {
    const wrapper = await mountBoundary();
    shouldThrow.value = false;

    await router.push('/fleet');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.route-error').exists()).toBe(false);
  });
});
