export const fleetKeys = {
  all: () => ['fleet'] as const,
  lists: () => ['fleet', 'list'] as const,
  list: (params: { page: number }) => ['fleet', 'list', { page: params.page }] as const,
  details: () => ['fleet', 'detail'] as const,
  detail: (shipSymbol: string) => ['fleet', 'detail', shipSymbol] as const,
} as const;
