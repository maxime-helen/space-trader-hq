import { describe, expect, it } from 'vitest';

import { buildMeta } from '@/shared/api/__tests__/fixtures';
import { clampPage, pageCount, parsePageParam } from '@/shared/lib/pagination';

describe('parsePageParam', () => {
  it('reads a bookmarked page', () => {
    expect(parsePageParam('3')).toBe(3);
  });

  it('falls back to page 1 for anything the address bar can hold that is not a page', () => {
    for (const value of [undefined, null, '', 'abc', '0', '-2', '1.5', {}]) expect(parsePageParam(value)).toBe(1);
  });

  it('takes the first value of a repeated parameter', () => {
    expect(parsePageParam(['4', '9'])).toBe(4);
  });
});

describe('pageCount', () => {
  it('divides the total by the page size, rounding up', () => {
    expect(pageCount(buildMeta({ total: 41, limit: 20 }))).toBe(3);
    expect(pageCount(buildMeta({ total: 40, limit: 20 }))).toBe(2);
  });

  it('is one page for an empty list, a broken limit, and before any meta has arrived', () => {
    expect(pageCount(buildMeta({ total: 0, limit: 20 }))).toBe(1);
    expect(pageCount(buildMeta({ total: 5, limit: 0 }))).toBe(1);
    expect(pageCount(undefined)).toBe(1);
  });
});

describe('clampPage', () => {
  const meta = buildMeta({ total: 45, limit: 20 });

  it('clamps a page past the end to the last one, and leaves one that exists alone', () => {
    expect(clampPage(9, meta)).toBe(3);
    expect(clampPage(2, meta)).toBe(2);
  });

  it('reads junk, zero, negatives and fractions as a page number', () => {
    expect(clampPage(Number.NaN, meta)).toBe(1);
    expect(clampPage(0, meta)).toBe(1);
    expect(clampPage(-3, meta)).toBe(1);
    expect(clampPage(2.7, meta)).toBe(2);
  });

  it('trusts the URL until the first response says how many pages there are', () => {
    expect(clampPage(9)).toBe(9);
  });
});
