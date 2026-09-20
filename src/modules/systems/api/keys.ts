import type { WaypointTraitSymbol, WaypointType } from '@/shared/api/types';

export type WaypointFilters = {
  page?: number;
  type?: WaypointType;
  traits?: readonly WaypointTraitSymbol[];
};

const systemRoot = (systemSymbol: string) => ['systems', 'detail', systemSymbol] as const;

const waypointRoot = (systemSymbol: string, waypointSymbol: string) =>
  [...systemRoot(systemSymbol), 'waypoints', 'detail', waypointSymbol] as const;

export const systemKeys = {
  all: () => ['systems'] as const,
  list: (params: { page: number }) => ['systems', 'list', params] as const,
  detail: (systemSymbol: string) => systemRoot(systemSymbol),
  waypointsAll: (systemSymbol: string) => [...systemRoot(systemSymbol), 'waypoints', 'list'] as const,
  waypoints: (systemSymbol: string, filters: WaypointFilters) =>
    [...systemRoot(systemSymbol), 'waypoints', 'list', filters] as const,
  waypoint: (systemSymbol: string, waypointSymbol: string) => waypointRoot(systemSymbol, waypointSymbol),
  shipyard: (systemSymbol: string, waypointSymbol: string) =>
    [...waypointRoot(systemSymbol, waypointSymbol), 'shipyard'] as const,
} as const;
