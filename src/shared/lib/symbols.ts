export type WaypointSymbol = {
  sector: string;
  system: string;
  waypoint: string;
};

export type SystemSymbol = {
  sector: string;
  system: string;
};

const SEPARATOR = '-';
const SEGMENT = '[A-Z0-9]+';
const SYSTEM_PATTERN = new RegExp(`^${SEGMENT}-${SEGMENT}$`);
const WAYPOINT_PATTERN = new RegExp(`^${SEGMENT}-${SEGMENT}-${SEGMENT}$`);

export const normalizeSymbol = (symbol: string): string => symbol.trim().toUpperCase();

export const parseWaypointSymbol = (symbol: string): WaypointSymbol | undefined => {
  const normalized = normalizeSymbol(symbol);
  if (!WAYPOINT_PATTERN.test(normalized)) return undefined;
  const [sector = '', system = ''] = normalized.split(SEPARATOR);
  return { sector, system: `${sector}${SEPARATOR}${system}`, waypoint: normalized };
};

export const parseSystemSymbol = (symbol: string): SystemSymbol | undefined => {
  const normalized = normalizeSymbol(symbol);
  if (!SYSTEM_PATTERN.test(normalized)) return undefined;
  const [sector = ''] = normalized.split(SEPARATOR);
  return { sector, system: normalized };
};

export const toSystemSymbol = (symbol: string): string | undefined =>
  parseWaypointSymbol(symbol)?.system ?? parseSystemSymbol(symbol)?.system;
