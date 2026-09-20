import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MAX_TOASTS, TOAST_DURATION_MS, useToasts } from '@/shared/composables/use-toasts';

const START = Date.parse('2026-09-16T12:00:00Z');

const queue = useToasts();

const symbols = () => queue.toasts.value.map((toast) => toast.subject);

beforeEach(() => {
  vi.useFakeTimers({ now: START, toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  queue.clear();
});

afterEach(() => {
  queue.clear();
  vi.useRealTimers();
});

describe('useToasts', () => {
  it('hands every caller the same queue', () => {
    expect(useToasts()).toBe(queue);
  });

  it('keeps the newest toast on top', () => {
    queue.push({ subject: 'SHIP-1', message: 'arrived at X1-DF55-A1' });
    queue.push({ subject: 'SHIP-2', message: 'arrived at X1-DF55-B7' });

    expect(symbols()).toEqual(['SHIP-2', 'SHIP-1']);
  });

  it('carries the badge, the words and the link it was given', () => {
    queue.push({
      badge: 'Arrived',
      badgeVariant: 'orbit',
      subject: 'VOYAGER-7-3',
      message: 'arrived at X1-DF55-B7',
      action: { label: 'View ship', to: '/fleet/VOYAGER-7-3' },
    });

    expect(queue.toasts.value[0]).toMatchObject({
      badge: 'Arrived',
      badgeVariant: 'orbit',
      subject: 'VOYAGER-7-3',
      message: 'arrived at X1-DF55-B7',
      action: { label: 'View ship', to: '/fleet/VOYAGER-7-3' },
    });
    expect(queue.toasts.value[0]?.id).toMatch(/^toast-\d+$/);
  });

  it('shows at most three at a time, a fourth replacing the oldest', () => {
    for (const subject of ['SHIP-1', 'SHIP-2', 'SHIP-3']) queue.push({ subject, message: 'arrived' });
    expect(queue.toasts.value).toHaveLength(MAX_TOASTS);

    queue.push({ subject: 'SHIP-4', message: 'arrived' });

    expect(queue.toasts.value).toHaveLength(MAX_TOASTS);
    expect(symbols()).toEqual(['SHIP-4', 'SHIP-3', 'SHIP-2']);
  });

  it('dismisses a toast after six seconds', () => {
    queue.push({ subject: 'SHIP-1', message: 'arrived' });

    vi.advanceTimersByTime(TOAST_DURATION_MS - 1);
    expect(queue.toasts.value).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(queue.toasts.value).toHaveLength(0);
  });

  it('gives each toast its own six seconds', () => {
    queue.push({ subject: 'SHIP-1', message: 'arrived' });
    vi.advanceTimersByTime(2000);
    queue.push({ subject: 'SHIP-2', message: 'arrived' });

    vi.advanceTimersByTime(4000);
    expect(symbols()).toEqual(['SHIP-2']);

    vi.advanceTimersByTime(2000);
    expect(queue.toasts.value).toHaveLength(0);
  });

  it('keeps a toast with no duration until it is dismissed', () => {
    const id = queue.push({ subject: 'SHIP-1', message: 'arrived', durationMs: 0 });

    vi.advanceTimersByTime(60_000);
    expect(queue.toasts.value).toHaveLength(1);

    queue.dismiss(id);
    expect(queue.toasts.value).toHaveLength(0);
  });

  it('dismisses by id and leaves the others alone', () => {
    const first = queue.push({ subject: 'SHIP-1', message: 'arrived' });
    queue.push({ subject: 'SHIP-2', message: 'arrived' });

    queue.dismiss(first);

    expect(symbols()).toEqual(['SHIP-2']);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('clears every toast and its timer', () => {
    queue.push({ subject: 'SHIP-1', message: 'arrived' });
    queue.push({ subject: 'SHIP-2', message: 'arrived' });

    queue.clear();

    expect(queue.toasts.value).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('drops the timer of a toast pushed out by a fourth', () => {
    for (const subject of ['SHIP-1', 'SHIP-2', 'SHIP-3', 'SHIP-4']) queue.push({ subject, message: 'arrived' });

    expect(vi.getTimerCount()).toBe(MAX_TOASTS);
  });
});
