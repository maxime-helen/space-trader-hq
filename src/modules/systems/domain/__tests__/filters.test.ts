import { describe, expect, it } from 'vitest';

import {
  FILTERABLE_TRAITS,
  formatTraitsParam,
  parseTraitsParam,
  parseTypeParam,
  WAYPOINT_TYPES,
} from '@/modules/systems/domain/filters';

describe('parseTypeParam', () => {
  it('accepts a waypoint type in any case', () => {
    expect(parseTypeParam('PLANET')).toBe('PLANET');
    expect(parseTypeParam('orbital_station')).toBe('ORBITAL_STATION');
  });

  it('reads anything else as no filter', () => {
    expect(parseTypeParam('BANANA')).toBe('');
    expect(parseTypeParam(undefined)).toBe('');
    expect(parseTypeParam(['PLANET'])).toBe('');
  });

  it('offers every type the API defines', () => {
    expect(WAYPOINT_TYPES).toContain('JUMP_GATE');
    expect(new Set(WAYPOINT_TYPES).size).toBe(WAYPOINT_TYPES.length);
  });
});

describe('parseTraitsParam', () => {
  it('reads a comma-separated list in any case', () => {
    expect(parseTraitsParam('marketplace,SHIPYARD')).toEqual(['MARKETPLACE', 'SHIPYARD']);
  });

  it('drops what the filter does not offer, and de-duplicates the rest', () => {
    expect(parseTraitsParam('MARKETPLACE,BANANA,MARKETPLACE')).toEqual(['MARKETPLACE']);
    expect(parseTraitsParam('')).toEqual([]);
    expect(parseTraitsParam(undefined)).toEqual([]);
  });

  it('always returns the filter order, so the query key does not depend on click order', () => {
    expect(parseTraitsParam('SHIPYARD,MARKETPLACE')).toEqual(parseTraitsParam('MARKETPLACE,SHIPYARD'));
  });

  it('offers the traits worth navigating by', () => {
    expect(FILTERABLE_TRAITS).toContain('MARKETPLACE');
    expect(FILTERABLE_TRAITS).toContain('SHIPYARD');
  });
});

describe('formatTraitsParam', () => {
  it('writes the selection back into the URL in the filter order', () => {
    expect(formatTraitsParam(['SHIPYARD', 'MARKETPLACE'])).toBe('MARKETPLACE,SHIPYARD');
  });

  it('leaves the parameter out entirely when nothing is selected', () => {
    expect(formatTraitsParam([])).toBeUndefined();
  });

  it('round-trips through the URL', () => {
    const traits = parseTraitsParam(formatTraitsParam(['MARKETPLACE', 'SHIPYARD']) ?? '');

    expect(traits).toEqual(['MARKETPLACE', 'SHIPYARD']);
  });
});
