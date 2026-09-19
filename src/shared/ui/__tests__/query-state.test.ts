import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import QueryState from '@/shared/ui/query-state.vue';

const mountState = (props: Record<string, unknown>) =>
  mount(QueryState, {
    props: { hasData: false, errorTitle: "Couldn't load your ships.", retry: () => undefined, ...props },
    slots: { default: '<p class="content">Two ships</p>' },
  });

describe('QueryState', () => {
  describe('first load: the panel has no data yet', () => {
    it('spins on a first load, and shows no content', () => {
      const wrapper = mountState({ hasData: false, fetching: true });

      expect(wrapper.find('.base-spinner').exists()).toBe(true);
      expect(wrapper.find('.content').exists()).toBe(false);
    });

    it('keeps spinning while the first request waits on the rate limiter', () => {
      // Queued, so nothing is in flight yet and there is still no data to show.
      const wrapper = mountState({ hasData: false, fetching: false });

      expect(wrapper.find('.base-spinner').exists()).toBe(true);
      expect(wrapper.find('.content').exists()).toBe(false);
    });

    it('keeps spinning while the first request is being retried', () => {
      const wrapper = mountState({ hasData: false, fetching: true });

      expect(wrapper.find('.base-spinner').exists()).toBe(true);
    });
  });

  describe('spinner: every later load, once the panel has data', () => {
    it('shows the spinner during a refetch, with the data still on screen', () => {
      const wrapper = mountState({ hasData: true, fetching: true });

      expect(wrapper.find('.content').exists()).toBe(true);
      expect(wrapper.find('.base-spinner').exists()).toBe(true);
    });

    it('keeps the previous page visible while the next one loads', () => {
      const wrapper = mountState({ hasData: true, fetching: true });

      expect(wrapper.find('.content').text()).toBe('Two ships');
    });

    it('shows a spinner on a retry after a 429, because the data is still there', () => {
      // A retry in flight with data on screen: a spinner, not the error state.
      const wrapper = mountState({ hasData: true, fetching: true, error: true });

      expect(wrapper.find('.query-state-error').exists()).toBe(false);
      expect(wrapper.find('.base-spinner').exists()).toBe(true);
      expect(wrapper.find('.content').exists()).toBe(true);
    });

    it('shows the spinner on its own when the panel has no freshness label', () => {
      const wrapper = mountState({ hasData: true, fetching: true });

      expect(wrapper.find('.query-state-meta .base-spinner').exists()).toBe(true);
      expect(wrapper.find('time').exists()).toBe(false);
    });

    it('offers no spinner, no refresh button and no timestamp once the data has loaded', () => {
      const wrapper = mountState({ hasData: true, fetching: false });

      expect(wrapper.find('.base-spinner').exists()).toBe(false);
      expect(wrapper.findAll('button')).toHaveLength(0);
      expect(wrapper.find('time').exists()).toBe(false);
    });
  });

  describe('error: the load failed and there is nothing to show', () => {
    it('names what failed, gives the cause and offers Try again', () => {
      const wrapper = mountState({ hasData: false, error: true });

      expect(wrapper.find('.query-state-error strong').text()).toBe("Couldn't load your ships.");
      expect(wrapper.find('.query-state-error p').text()).toBe(
        "The SpaceTraders API didn't respond. Check your connection, then try again.",
      );
      expect(wrapper.find('button').text()).toBe('Try again');
      expect(wrapper.find('.base-spinner').exists()).toBe(false);
      expect(wrapper.find('.content').exists()).toBe(false);
    });

    it('calls the retry it was given when the button is pressed', async () => {
      const retry = vi.fn();
      const wrapper = mountState({ hasData: false, error: true, retry });

      await wrapper.find('button').trigger('click');

      expect(retry).toHaveBeenCalledTimes(1);
    });

    it('takes the wording for the failure from the page', () => {
      const wrapper = mountState({
        hasData: false,
        error: true,
        errorTitle: "Couldn't load the market.",
        errorMessage: 'Try again in a moment.',
      });

      expect(wrapper.find('.query-state-error strong').text()).toBe("Couldn't load the market.");
      expect(wrapper.find('.query-state-error p').text()).toBe('Try again in a moment.');
    });
  });

  describe('empty: the data loaded, but there is nothing to show', () => {
    it('shows the empty wording instead of the content', () => {
      const wrapper = mountState({ hasData: true, empty: true, emptyMessage: 'The hold is empty.' });

      expect(wrapper.find('.query-state-empty').text()).toBe('The hold is empty.');
      expect(wrapper.find('.content').exists()).toBe(false);
    });

    it('shows no timestamp: a panel never reports how old its data is', () => {
      const wrapper = mountState({ hasData: true, empty: true });

      expect(wrapper.find('time').exists()).toBe(false);
    });

    it('lets a panel render a longer empty state in the slot', () => {
      const wrapper = mount(QueryState, {
        props: { hasData: true, empty: true, errorTitle: "Couldn't load your ships.", retry: () => undefined },
        slots: { empty: '<p>You have no ships. <a href="#">Sign in again</a></p>' },
      });

      expect(wrapper.find('.query-state-empty a').exists()).toBe(true);
    });
  });
});
