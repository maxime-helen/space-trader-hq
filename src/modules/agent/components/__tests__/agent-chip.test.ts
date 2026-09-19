import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { agentKeys } from '@/modules/agent';
import AgentChip from '@/modules/agent/components/agent-chip.vue';
import { useSessionStore } from '@/modules/auth';
import { buildAgent } from '@/shared/api/__tests__/fixtures';
import { createRequestCounter, mockGet } from '@/shared/api/__tests__/handlers';
import { setupApiMocks } from '@/shared/api/__tests__/server';
import { createTestQueryClient } from '@/shared/api/__tests__/test-support';

const server = setupApiMocks();

beforeEach(() => {
  setActivePinia(createPinia());
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
});

const mountChip = (queryClient: QueryClient) =>
  mount(AgentChip, { global: { plugins: [[VueQueryPlugin, { queryClient }]] } });

const untilLoaded = async (wrapper: ReturnType<typeof mountChip>): Promise<void> => {
  await vi.waitFor(() => {
    expect(wrapper.find('.agent-chip-button').exists()).toBe(true);
  });
};

describe('AgentChip', () => {
  it('shows the agent symbol and credits once the agent has loaded', async () => {
    const wrapper = mountChip(createTestQueryClient());

    expect(wrapper.find('.agent-chip-button').exists()).toBe(false);

    await untilLoaded(wrapper);

    expect(wrapper.text()).toContain('ALICE');
    expect(wrapper.text()).toContain('175,000 cr');
  });

  it('shares the Agent page cache entry: a seeded agent costs no request', async () => {
    const counter = createRequestCounter();
    server.use(counter.handler);
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(agentKeys.me(), buildAgent({ symbol: 'VOYAGER-7-3' }));

    const wrapper = mountChip(queryClient);
    await flushPromises();

    expect(wrapper.text()).toContain('VOYAGER-7-3');
    expect(counter.count()).toBe(0);
  });

  it('shows a negative balance in the danger color, in the top bar too', async () => {
    server.use(mockGet('/my/agent', () => ({ data: buildAgent({ credits: -12_400 }) })));

    const wrapper = mountChip(createTestQueryClient());
    await untilLoaded(wrapper);

    expect(wrapper.find('.credits-amount').classes()).toContain('is-negative');
  });

  it('holds Sign out in a menu, and ends the session through the auth module', async () => {
    const session = useSessionStore();
    session.signIn('a-token');
    const navigate = vi.fn();
    session.attachEffects({ navigate });
    const wrapper = mountChip(createTestQueryClient());
    await untilLoaded(wrapper);

    expect(wrapper.find('.agent-chip-menu').exists()).toBe(false);

    await wrapper.find('.agent-chip-button').trigger('click');
    const signOut = wrapper.find('.agent-chip-menu-item');
    expect(signOut.text()).toBe('Sign out');

    await signOut.trigger('click');

    expect(session.isAuthenticated).toBe(false);
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/login');
    expect(wrapper.find('.agent-chip-menu').exists()).toBe(false);
  });
});
