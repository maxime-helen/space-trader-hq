import type { SystemWaypoint, WaypointType } from '@/shared/api/types';

export type WaypointNode = {
  waypoint: SystemWaypoint;
  orbitals: WaypointNode[];
};

const closesCycle = (nodes: ReadonlyMap<string, WaypointNode>, symbol: string, parentSymbol: string): boolean => {
  const seen = new Set<string>();
  let current: string | undefined = parentSymbol;
  while (current !== undefined && !seen.has(current)) {
    if (current === symbol) return true;
    seen.add(current);
    current = nodes.get(current)?.waypoint.orbits;
  }
  return false;
};

export const buildWaypointTree = (waypoints: readonly SystemWaypoint[]): WaypointNode[] => {
  const nodes = new Map<string, WaypointNode>();
  for (const waypoint of waypoints) {
    if (!nodes.has(waypoint.symbol)) nodes.set(waypoint.symbol, { waypoint, orbitals: [] });
  }

  const roots: WaypointNode[] = [];
  for (const node of nodes.values()) {
    const parentSymbol = node.waypoint.orbits;
    const parent = parentSymbol === undefined ? undefined : nodes.get(parentSymbol);
    if (parentSymbol === undefined || parent === undefined || closesCycle(nodes, node.waypoint.symbol, parentSymbol)) {
      roots.push(node);
    } else {
      parent.orbitals.push(node);
    }
  }
  return roots;
};

export const filterTreeByType = (
  tree: readonly WaypointNode[],
  type: WaypointType | '' | undefined,
): WaypointNode[] => {
  if (type === undefined || type === '') return [...tree];
  return tree.flatMap((node) => {
    const orbitals = filterTreeByType(node.orbitals, type);
    if (node.waypoint.type === type) return [{ waypoint: node.waypoint, orbitals }];
    return orbitals.length > 0 ? [{ waypoint: node.waypoint, orbitals }] : [];
  });
};
