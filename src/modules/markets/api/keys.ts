export const marketKeys = {
  all: () => ['markets'] as const,
  marketplaces: (systemSymbol: string) => ['markets', 'marketplaces', systemSymbol] as const,
  detail: (systemSymbol: string, waypointSymbol: string) =>
    ['markets', 'detail', systemSymbol, waypointSymbol] as const,
} as const;
