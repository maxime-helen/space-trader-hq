import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';

import { useToasts } from '@/shared/composables/use-toasts';
import BaseToast from '@/shared/ui/base-toast.vue';

const BLANK = { render: () => null };

let router: Router;

beforeEach(async () => {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: BLANK },
      { path: '/fleet/:shipSymbol', component: BLANK },
    ],
  });
  await router.push('/');
  await router.isReady();
});

const ARRIVAL = {
  badge: 'Arrived',
  badgeVariant: 'orbit',
  subject: 'VOYAGER-7-3',
  message: 'arrived at X1-DF55-B7',
  actionLabel: 'View ship',
  actionTo: '/fleet/VOYAGER-7-3',
} as const;

const mountToast = (props: Record<string, unknown> = {}) =>
  mount(BaseToast, { props: { ...ARRIVAL, ...props }, global: { plugins: [router] } });

describe('BaseToast', () => {
  it('renders the sentence, the badge and the link', () => {
    const wrapper = mountToast();

    expect(wrapper.find('.base-toast-message').text()).toBe('VOYAGER-7-3 arrived at X1-DF55-B7');
    expect(wrapper.find('.base-badge').text()).toBe('Arrived');
    // The "Arrived" badge uses the in-orbit color.
    expect(wrapper.find('.base-badge').classes()).toContain('orbit');
    expect(wrapper.find('a').text()).toBe('View ship');
    expect(wrapper.find('a').attributes('href')).toBe('/fleet/VOYAGER-7-3');
  });

  it('emphasizes the subject', () => {
    const wrapper = mountToast();

    expect(wrapper.find('.base-toast-message strong').text()).toBe('VOYAGER-7-3');
  });

  it('renders without a badge, a subject or a link', () => {
    const wrapper = mount(BaseToast, { props: { message: 'Something happened' }, global: { plugins: [router] } });

    expect(wrapper.text()).toContain('Something happened');
    expect(wrapper.find('.base-badge').exists()).toBe(false);
    expect(wrapper.find('strong').exists()).toBe(false);
    expect(wrapper.find('a').exists()).toBe(false);
  });

  it('falls back to the neutral badge variant', () => {
    const wrapper = mountToast({ badgeVariant: undefined });

    expect(wrapper.find('.base-badge').classes()).toContain('neutral');
  });

  it('emits dismiss from a real button', async () => {
    const wrapper = mountToast();
    const button = wrapper.find('.base-toast-close');

    expect(button.element.tagName).toBe('BUTTON');
    expect(button.attributes('type')).toBe('button');

    await button.trigger('click');

    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });

  it('takes a queued toast straight from the queue, which is how the layout renders the region', () => {
    const queue = useToasts();
    queue.clear();
    queue.push({
      badge: 'Arrived',
      badgeVariant: 'orbit',
      subject: 'VOYAGER-7-3',
      message: 'arrived at X1-DF55-B7',
      action: { label: 'View ship', to: '/fleet/VOYAGER-7-3' },
    });
    const [toast] = queue.toasts.value;
    if (toast === undefined) throw new Error('the queue kept no toast');

    const wrapper = mount(BaseToast, {
      props: {
        badge: toast.badge,
        badgeVariant: toast.badgeVariant,
        subject: toast.subject,
        message: toast.message,
        actionLabel: toast.action?.label,
        actionTo: toast.action?.to,
      },
      global: { plugins: [router] },
    });

    expect(wrapper.find('.base-toast-message').text()).toBe('VOYAGER-7-3 arrived at X1-DF55-B7');
    expect(wrapper.find('a').attributes('href')).toBe('/fleet/VOYAGER-7-3');
    queue.clear();
  });

  it('passes native attributes through', () => {
    const wrapper = mountToast({});
    const withAttrs = mount(BaseToast, {
      props: { message: 'arrived' },
      attrs: { 'data-testid': 'toast' },
      global: { plugins: [router] },
    });

    expect(wrapper.classes()).toContain('base-toast');
    expect(withAttrs.attributes('data-testid')).toBe('toast');
  });
});
