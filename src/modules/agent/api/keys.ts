export const agentKeys = {
  all: () => ['agent'] as const,
  me: () => ['agent', 'me'] as const,
} as const;

export const serverKeys = {
  all: () => ['server'] as const,
  status: () => ['server', 'status'] as const,
} as const;
