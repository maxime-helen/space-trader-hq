import { describe, expect, it } from 'vitest';

import {
  createQueryClient,
  MAX_QUERY_RETRIES,
  queryRetryDelay,
  shouldRetryQuery,
  STALE_TIMES,
} from '@/app/providers/query-client';
import { ApiError } from '@/shared/api/errors';

describe('STALE_TIMES', () => {
  it('keeps the documented defaults', () => {
    expect(STALE_TIMES).toEqual({
      geography: 3_600_000,
      agent: 30_000,
      ships: 15_000,
      market: 60_000,
      serverStatus: 300_000,
    });
  });

  it('orders resources from the most static to the most volatile', () => {
    expect(STALE_TIMES.geography).toBeGreaterThan(STALE_TIMES.serverStatus);
    expect(STALE_TIMES.serverStatus).toBeGreaterThan(STALE_TIMES.market);
    expect(STALE_TIMES.market).toBeGreaterThan(STALE_TIMES.agent);
    expect(STALE_TIMES.agent).toBeGreaterThan(STALE_TIMES.ships);
  });
});

describe('shouldRetryQuery', () => {
  it('retries a 5xx up to the cap', () => {
    const error = new ApiError({ status: 503 });
    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldRetryQuery(MAX_QUERY_RETRIES - 1, error)).toBe(true);
    expect(shouldRetryQuery(MAX_QUERY_RETRIES, error)).toBe(false);
  });

  it.each([
    ['a dead token', 401],
    ['a missing waypoint', 404],
    ['a rejected request', 400],
    ['a conflicting ship state', 409],
  ])('never retries %s: the answer will not change', (_label, status) => {
    expect(shouldRetryQuery(0, new ApiError({ status }))).toBe(false);
  });

  it('gives a non-API error the benefit of the doubt', () => {
    expect(shouldRetryQuery(0, new Error('render blew up'))).toBe(true);
  });
});

describe('queryRetryDelay', () => {
  it('backs off exponentially and then stops growing', () => {
    expect([0, 1, 2, 3, 10].map(queryRetryDelay)).toEqual([1000, 2000, 4000, 8000, 10_000]);
  });
});

describe('createQueryClient', () => {
  it('applies the spec defaults', () => {
    const defaults = createQueryClient().getDefaultOptions();

    expect(defaults.queries?.staleTime).toBe(STALE_TIMES.ships);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaults.queries?.refetchOnReconnect).toBe(true);
    expect(defaults.queries?.retry).toBe(shouldRetryQuery);
    // Mutations write their response into the cache, so a blind retry could repeat a side effect.
    expect(defaults.mutations?.retry).toBe(false);
  });

  it('builds an independent client each time, so tests never share a cache', () => {
    expect(createQueryClient()).not.toBe(createQueryClient());
  });
});
