import { apiClient, unwrap } from '@/shared/api/client';
import type { Agent } from '@/shared/api/types';

export const fetchAgentWithToken = async (token: string): Promise<Agent> => {
  const result = await apiClient.GET('/my/agent', { headers: { Authorization: `Bearer ${token}` } });
  return unwrap(result).data;
};
