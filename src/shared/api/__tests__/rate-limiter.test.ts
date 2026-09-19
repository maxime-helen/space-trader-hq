import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createRateLimiter, sleep } from '@/shared/api/rate-limiter';

import { fakeClock, settle } from './test-support';

let clock: ReturnType<typeof fakeClock>;

beforeEach(() => {
  clock = fakeClock();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createRateLimiter', () => {
  it('lets a burst of two through immediately, then spaces requests 500 ms apart', async () => {
    const limiter = createRateLimiter();
    const start = Date.now();
    const leftAt: number[] = [];

    await settle(
      (async () => {
        for (let i = 0; i < 6; i += 1) {
          await limiter.waitForSlot();
          leftAt.push(Date.now() - start);
        }
      })(),
    );

    expect(leftAt).toEqual([0, 0, 500, 1000, 1500, 2000]);
    expect(clock.sleeps()).toEqual([500, 500, 500, 500]);
  });

  it('holds parallel callers in a queue and serves them in order', async () => {
    const limiter = createRateLimiter();
    const served: number[] = [];

    await settle(
      Promise.all(
        Array.from({ length: 5 }, async (_unused, index) => {
          await limiter.waitForSlot();
          served.push(index);
        }),
      ),
    );

    expect(served).toEqual([0, 1, 2, 3, 4]);
    expect(clock.sleeps()).toEqual([500, 1000, 1500]);
  });

  it('spends nothing while the caller is idle: the slots come back on their own', async () => {
    const limiter = createRateLimiter();

    await limiter.waitForSlot();
    await limiter.waitForSlot();
    vi.advanceTimersByTime(1000);
    await limiter.waitForSlot();
    await limiter.waitForSlot();

    expect(clock.sleeps()).toEqual([]);
  });

  it('banks at most one extra slot while idle, so a long pause still buys only the burst', async () => {
    const limiter = createRateLimiter();
    vi.advanceTimersByTime(60_000);

    await limiter.waitForSlot();
    await limiter.waitForSlot();
    await settle(limiter.waitForSlot());

    expect(clock.sleeps()).toEqual([500]);
  });

  it('waits only for the part of the interval still to come', async () => {
    const limiter = createRateLimiter();

    await limiter.waitForSlot();
    await limiter.waitForSlot();
    vi.advanceTimersByTime(250);
    await settle(limiter.waitForSlot());

    expect(clock.sleeps()).toEqual([250]);
  });

  it('keeps serving after a caller rejects, instead of wedging the queue', async () => {
    const limiter = createRateLimiter();

    await expect(
      limiter.waitForSlot().then(() => {
        throw new Error('caller blew up');
      }),
    ).rejects.toThrow('caller blew up');

    await expect(limiter.waitForSlot()).resolves.toBeUndefined();
  });
});

describe('sleep', () => {
  it('resolves once the timer has run, not before', async () => {
    let resolved = false;
    const sleeping = sleep(500).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(499);
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await sleeping;
    expect(resolved).toBe(true);
  });
});
