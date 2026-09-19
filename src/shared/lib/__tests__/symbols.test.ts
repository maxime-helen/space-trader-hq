import { describe, expect, it } from 'vitest';

import { normalizeSymbol, parseSystemSymbol, parseWaypointSymbol, toSystemSymbol } from '@/shared/lib/symbols';

describe('parseWaypointSymbol', () => {
  it('splits the spec example into sector, system and waypoint', () => {
    expect(parseWaypointSymbol('X1-DF55-20250Z')).toStrictEqual({
      sector: 'X1',
      system: 'X1-DF55',
      waypoint: 'X1-DF55-20250Z',
    });
  });

  it('handles the other symbol shapes the API sends', () => {
    expect(parseWaypointSymbol('X1-DF55-A2')?.system).toBe('X1-DF55');
    expect(parseWaypointSymbol('X1-ZZ99-BA5F')).toStrictEqual({
      sector: 'X1',
      system: 'X1-ZZ99',
      waypoint: 'X1-ZZ99-BA5F',
    });
  });

  it('accepts what a user types: surrounding spaces and any case', () => {
    expect(parseWaypointSymbol('  x1-df55-20250z  ')).toStrictEqual({
      sector: 'X1',
      system: 'X1-DF55',
      waypoint: 'X1-DF55-20250Z',
    });
  });

  it('returns undefined for anything that is not a waypoint symbol', () => {
    expect(parseWaypointSymbol('X1-DF55')).toBeUndefined();
    expect(parseWaypointSymbol('X1')).toBeUndefined();
    expect(parseWaypointSymbol('X1-DF55-20250Z-EXTRA')).toBeUndefined();
    expect(parseWaypointSymbol('X1--20250Z')).toBeUndefined();
    expect(parseWaypointSymbol('X1 DF55 20250Z')).toBeUndefined();
    expect(parseWaypointSymbol('')).toBeUndefined();
  });
});

describe('parseSystemSymbol', () => {
  it('splits a system symbol into sector and system', () => {
    expect(parseSystemSymbol('X1-DF55')).toStrictEqual({ sector: 'X1', system: 'X1-DF55' });
    expect(parseSystemSymbol(' x1-zz99 ')).toStrictEqual({ sector: 'X1', system: 'X1-ZZ99' });
  });

  it('returns undefined for a waypoint symbol or for nonsense', () => {
    expect(parseSystemSymbol('X1-DF55-20250Z')).toBeUndefined();
    expect(parseSystemSymbol('X1')).toBeUndefined();
    expect(parseSystemSymbol('')).toBeUndefined();
  });
});

describe('toSystemSymbol (what the "Go to system" field navigates with)', () => {
  it('resolves a waypoint symbol to its system and leaves a system symbol alone', () => {
    expect(toSystemSymbol('X1-DF55-20250Z')).toBe('X1-DF55');
    expect(toSystemSymbol('X1-DF55')).toBe('X1-DF55');
    expect(toSystemSymbol('x1-df55-20250z')).toBe('X1-DF55');
  });

  it('returns undefined for a symbol it cannot read', () => {
    expect(toSystemSymbol('X1')).toBeUndefined();
    expect(toSystemSymbol('not a symbol')).toBeUndefined();
  });
});

describe('normalizeSymbol', () => {
  it('trims and upper-cases', () => {
    expect(normalizeSymbol('  x1-df55  ')).toBe('X1-DF55');
    expect(normalizeSymbol('X1-DF55')).toBe('X1-DF55');
  });
});
