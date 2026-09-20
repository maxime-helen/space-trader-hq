import type { WaypointTraitSymbol, WaypointType } from '@/shared/api/types';
import { normalizeSymbol } from '@/shared/lib/symbols';

export const WAYPOINT_TYPES: readonly WaypointType[] = [
  'PLANET',
  'GAS_GIANT',
  'MOON',
  'ORBITAL_STATION',
  'JUMP_GATE',
  'ASTEROID_FIELD',
  'ASTEROID',
  'ENGINEERED_ASTEROID',
  'ASTEROID_BASE',
  'NEBULA',
  'DEBRIS_FIELD',
  'GRAVITY_WELL',
  'ARTIFICIAL_GRAVITY_WELL',
  'FUEL_STATION',
];

export const FILTERABLE_TRAITS: readonly WaypointTraitSymbol[] = ['MARKETPLACE', 'SHIPYARD'];

export const parseTypeParam = (value: unknown): WaypointType | '' => {
  if (typeof value !== 'string') return '';
  const normalized = normalizeSymbol(value);
  return WAYPOINT_TYPES.find((type) => type === normalized) ?? '';
};

export const parseTraitsParam = (value: unknown): WaypointTraitSymbol[] => {
  if (typeof value !== 'string') return [];
  const wanted = new Set(
    value
      .split(',')
      .map((part) => normalizeSymbol(part))
      .filter((part) => part.length > 0),
  );
  return FILTERABLE_TRAITS.filter((trait) => wanted.has(trait));
};

export const formatTraitsParam = (traits: readonly WaypointTraitSymbol[]): string | undefined =>
  traits.length === 0 ? undefined : FILTERABLE_TRAITS.filter((trait) => traits.includes(trait)).join(',');
