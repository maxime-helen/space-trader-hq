import { useQuery, type UseQueryReturnType } from '@tanstack/vue-query';

import { apiClient, unwrap } from '@/shared/api/client';
import { STALE_TIMES } from '@/shared/api/stale-times';
import type { Agent, ServerStatus } from '@/shared/api/types';

import { agentKeys, serverKeys } from './keys';

export const useAgentQuery = (): UseQueryReturnType<Agent, Error> =>
  useQuery({
    queryKey: agentKeys.me(),
    queryFn: async () => unwrap(await apiClient.GET('/my/agent')).data,
    staleTime: STALE_TIMES.agent,
  });

export const useServerStatusQuery = (): UseQueryReturnType<ServerStatus, Error> =>
  useQuery({
    queryKey: serverKeys.status(),
    queryFn: async () => unwrap(await apiClient.GET('/')),
    staleTime: STALE_TIMES.serverStatus,
  });
