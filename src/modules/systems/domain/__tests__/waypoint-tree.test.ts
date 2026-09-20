import { describe, expect, it } from 'vitest';

import { buildWaypointTree, filterTreeByType, type WaypointNode } from '@/modules/systems/domain/waypoint-tree';
import { buildSystemWaypoint } from '@/shared/api/__tests__/fixtures';
import type { SystemWaypoint } from '@/shared/api/types';

const flattenTree = (tree: readonly WaypointNode[]): SystemWaypoint[] =>
  tree.flatMap((node) => [node.waypoint, ...flattenTree(node.orbitals)]);

const PLANET = 'X1-AB12-A1';
const MOON = 'X1-AB12-A1-M1';
const STATION = 'X1-AB12-B2';
const ORPHAN = 'X1-AB12-C3';

const planet = (): SystemWaypoint =>
  buildSystemWaypoint({ symbol: PLANET, type: 'PLANET', x: 10, y: 20, orbitals: [{ symbol: MOON }] });

const moon = (): SystemWaypoint =>
  buildSystemWaypoint({ symbol: MOON, type: 'MOON', x: 10, y: 21, orbitals: [], orbits: PLANET });

const station = (): SystemWaypoint =>
  buildSystemWaypoint({ symbol: STATION, type: 'ORBITAL_STATION', x: -5, y: 0, orbitals: [] });

const orphan = (): SystemWaypoint =>
  buildSystemWaypoint({ symbol: ORPHAN, type: 'MOON', x: 3, y: 4, orbitals: [], orbits: 'X1-AB12-NOPE' });

const symbolsOf = (nodes: { waypoint: SystemWaypoint }[]): string[] => nodes.map((node) => node.waypoint.symbol);

describe('buildWaypointTree', () => {
  it('nests an orbital under the waypoint it orbits', () => {
    const tree = buildWaypointTree([planet(), moon(), station()]);

    expect(symbolsOf(tree)).toEqual([PLANET, STATION]);
    expect(symbolsOf(tree[0]?.orbitals ?? [])).toEqual([MOON]);
    expect(tree[1]?.orbitals).toEqual([]);
  });

  it('keeps an orbital whose parent is missing at the top level instead of dropping it', () => {
    const tree = buildWaypointTree([planet(), moon(), orphan()]);

    expect(symbolsOf(tree)).toEqual([PLANET, ORPHAN]);
    expect(flattenTree(tree)).toHaveLength(3);
  });

  it('nests an orbital of an orbital, however deep the chain goes', () => {
    const inner = buildSystemWaypoint({ symbol: 'X1-AB12-A1-M1-S1', type: 'ORBITAL_STATION', orbits: MOON });
    const tree = buildWaypointTree([planet(), moon(), inner]);

    expect(symbolsOf(tree)).toEqual([PLANET]);
    expect(symbolsOf(tree[0]?.orbitals[0]?.orbitals ?? [])).toEqual(['X1-AB12-A1-M1-S1']);
  });

  it('keeps the order the API sent and lists a repeated symbol once', () => {
    const tree = buildWaypointTree([station(), planet(), station(), moon()]);

    expect(symbolsOf(tree)).toEqual([STATION, PLANET]);
  });

  it('shows both waypoints of an impossible mutual orbit rather than hiding them in each other', () => {
    const left = buildSystemWaypoint({ symbol: 'X1-AB12-L', type: 'PLANET', orbits: 'X1-AB12-R' });
    const right = buildSystemWaypoint({ symbol: 'X1-AB12-R', type: 'PLANET', orbits: 'X1-AB12-L' });

    const tree = buildWaypointTree([left, right]);

    expect(flattenTree(tree).map((waypoint) => waypoint.symbol)).toContain('X1-AB12-L');
    expect(flattenTree(tree).map((waypoint) => waypoint.symbol)).toContain('X1-AB12-R');
  });

  it('returns nothing for a system with no waypoints', () => {
    expect(buildWaypointTree([])).toEqual([]);
  });
});

describe('filterTreeByType', () => {
  const tree = () => buildWaypointTree([planet(), moon(), station(), orphan()]);

  it('keeps a parent whose orbital matches, so the match stays reachable', () => {
    const filtered = filterTreeByType(tree(), 'MOON');

    expect(symbolsOf(filtered)).toEqual([PLANET, ORPHAN]);
    expect(symbolsOf(filtered[0]?.orbitals ?? [])).toEqual([MOON]);
  });

  it('keeps a matching parent with only the orbitals that match too', () => {
    const filtered = filterTreeByType(tree(), 'PLANET');

    expect(symbolsOf(filtered)).toEqual([PLANET]);
    expect(filtered[0]?.orbitals).toEqual([]);
  });

  it('drops a branch where nothing matches', () => {
    expect(filterTreeByType(tree(), 'JUMP_GATE')).toEqual([]);
  });

  it('is not a filter at all without a type', () => {
    expect(symbolsOf(filterTreeByType(tree(), ''))).toEqual([PLANET, STATION, ORPHAN]);
    expect(symbolsOf(filterTreeByType(tree(), undefined))).toEqual([PLANET, STATION, ORPHAN]);
  });

  it('leaves the tree it was given untouched', () => {
    const original = tree();
    filterTreeByType(original, 'MOON');

    expect(symbolsOf(original[0]?.orbitals ?? [])).toEqual([MOON]);
  });
});
