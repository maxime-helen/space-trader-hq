import { describe, expect, it } from 'vitest';

import * as agentModule from '@/modules/agent';
import { agentKeys, agentRoutes } from '@/modules/agent';

describe('the agent module index', () => {
  it('exports the route table, the chip, the cache key, the two queries and the cached agent', () => {
    expect(Object.keys(agentModule).sort()).toEqual([
      'AgentChip',
      'agentKeys',
      'agentRoutes',
      'useAgentQuery',
      'useServerStatusQuery',
    ]);
  });
});

describe('agentRoutes', () => {
  it('owns `/`, the landing page after login', () => {
    expect(agentRoutes).toHaveLength(1);
    expect(agentRoutes[0]?.path).toBe('/');
  });

  it('loads the page lazily and names the page half of the tab title', () => {
    const route = agentRoutes[0];

    expect(typeof route?.component).toBe('function');
    expect(route?.meta?.title).toBe('Agent');
  });
});

describe('agentKeys', () => {
  it('gives the auth module one key to seed at login', () => {
    expect(agentKeys.me()).toEqual(['agent', 'me']);
  });

  it('keeps every agent entry under one prefix, so a sign-out can clear them together', () => {
    expect(agentKeys.me().slice(0, 1)).toEqual(agentKeys.all());
  });
});
