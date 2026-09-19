import type { QueryClient } from '@tanstack/vue-query';

import { agentKeys } from '@/modules/agent';
import type { Agent } from '@/shared/api/types';

export const seedAgentQuery = (queryClient: QueryClient, agent: Agent): void => {
  queryClient.setQueryData(agentKeys.me(), agent);
};
