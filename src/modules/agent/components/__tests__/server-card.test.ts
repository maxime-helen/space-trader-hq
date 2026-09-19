import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import ServerCard from '@/modules/agent/components/server-card.vue';
import { buildServerStatus, type DeepPartial } from '@/shared/api/__tests__/fixtures';
import type { ServerStatus } from '@/shared/api/types';

const NOW = Date.parse('2026-09-16T14:36:00.000Z');
const NEXT_RESET = '2026-09-16T15:40:05.000Z';

const mountCard = (overrides: DeepPartial<ServerStatus> = {}) =>
  mount(ServerCard, {
    props: {
      server: buildServerStatus({ serverResets: { next: NEXT_RESET }, ...overrides }),
    },
    attachTo: document.body,
  });

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ServerCard', () => {
  it('shows the status, the API version and the last reset date', () => {
    const text = mountCard().text();

    expect(text).toContain('SpaceTraders is currently online and available to play');
    expect(text).toContain('v2.3.0');
    // The API sends `2026-09-13`, a date-only value: formatted in UTC, never the day before.
    expect(text).toContain('Sep 13, 2026');
  });

  it('badges the server as online from the status sentence', () => {
    expect(mountCard().find('.base-badge').classes()).toContain('positive');
    const offline = mountCard({ status: 'SpaceTraders is down for maintenance' });
    expect(offline.find('.base-badge').classes()).toContain('danger');
  });

  it('counts down to the next reset, with the frequency beside it', async () => {
    const wrapper = mountCard();

    expect(wrapper.find('.server-card-countdown').text()).toBe('1h04min');
    expect(wrapper.find('.server-card-frequency').text()).toBe('Resets fortnightly');

    // A minute and five seconds later the countdown has moved on by itself: nothing was re-rendered
    // by the test, and no request was made.
    await vi.advanceTimersByTimeAsync(65_000);
    await nextTick();

    expect(wrapper.find('.server-card-countdown').text()).toBe('1h03min');
  });

  it('ticks every second', async () => {
    const wrapper = mountCard({ serverResets: { next: new Date(NOW + 90_000).toISOString() } });

    expect(wrapper.find('.server-card-countdown').text()).toBe('1min30s');

    await vi.advanceTimersByTimeAsync(1000);
    await nextTick();

    expect(wrapper.find('.server-card-countdown').text()).toBe('1min29s');
  });

  it('reads "Resetting now" once the reset time is reached', async () => {
    const wrapper = mountCard({ serverResets: { next: new Date(NOW + 2000).toISOString() } });

    await vi.advanceTimersByTimeAsync(3000);
    await nextTick();

    const countdown = wrapper.find('.server-card-countdown');
    expect(countdown.text()).toBe('Resetting now');
    expect(countdown.classes()).toContain('is-reached');
  });
});
