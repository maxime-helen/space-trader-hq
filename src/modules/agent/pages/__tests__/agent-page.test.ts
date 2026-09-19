import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount, RouterLinkStub } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { agentKeys } from '@/modules/agent';
import AgentPage from '@/modules/agent/pages/agent-page.vue';
import { buildAgent, buildServerStatus } from '@/shared/api/__tests__/fixtures';
import { apiErrorResponse, createRequestCounter, mockGet } from '@/shared/api/__tests__/handlers';
import { setupApiMocks } from '@/shared/api/__tests__/server';
import { createTestQueryClient, recordRequests, WAIT } from '@/shared/api/__tests__/test-support';
import { formatPageTitle } from '@/shared/lib/format';

const server = setupApiMocks();

const AGENT_URL = 'https://api.spacetraders.io/v2/my/agent';
const STATUS_URL = 'https://api.spacetraders.io/v2/';
const mountPage = (queryClient: QueryClient) =>
  mount(AgentPage, {
    global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { RouterLink: RouterLinkStub } },
  });

const untilAgentShown = async (wrapper: ReturnType<typeof mountPage>): Promise<void> => {
  await vi.waitFor(() => {
    expect(wrapper.find('.agent-header').exists()).toBe(true);
  }, WAIT);
};

afterEach(() => {
  server.events.removeAllListeners();
});

describe('AgentPage', () => {
  it('renders the agent after login without a second GET /my/agent', async () => {
    const counter = createRequestCounter();
    server.use(counter.handler);
    const requests = recordRequests(server);
    const queryClient = createTestQueryClient();
    // What the auth module does as the last step of signing in.
    queryClient.setQueryData(agentKeys.me(), buildAgent({ symbol: 'VOYAGER-7-3', credits: 175_000 }));

    const wrapper = mountPage(queryClient);
    await untilAgentShown(wrapper);
    await vi.waitFor(() => {
      expect(wrapper.find('.server-card').exists()).toBe(true);
    }, WAIT);

    expect(wrapper.text()).toContain('VOYAGER-7-3');
    expect(wrapper.text()).toContain('175,000 cr');
    // One request for the whole page: the public server status. Not the agent, which came from
    // the cache the login seeded.
    await vi.waitFor(() => {
      expect(requests).toEqual([STATUS_URL]);
    }, WAIT);
    expect(requests).not.toContain(AGENT_URL);
    expect(counter.count()).toBe(1);
  });

  it('costs no request at all when the agent and the status are cached', async () => {
    const counter = createRequestCounter();
    server.use(counter.handler);
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(agentKeys.me(), buildAgent());
    queryClient.setQueryData(['server', 'status'], buildServerStatus());

    const wrapper = mountPage(queryClient);
    await untilAgentShown(wrapper);

    expect(wrapper.find('.server-card').exists()).toBe(true);
    // The onward links cost nothing either.
    expect(wrapper.findAll('.onward-link')).toHaveLength(3);
    expect(counter.count()).toBe(0);
  });

  it('shows the agent, the server card and the onward links, in that order', async () => {
    const wrapper = mountPage(createTestQueryClient());
    await untilAgentShown(wrapper);
    await vi.waitFor(() => {
      expect(wrapper.find('.server-card').exists()).toBe(true);
    }, WAIT);

    expect(wrapper.text()).toContain('ALICE');
    expect(wrapper.text()).toContain('X1-AB12-A1');
    expect(wrapper.text()).toContain('Cosmic');
    expect(wrapper.findAll('section').map((section) => section.classes()[0])).toEqual([
      'agent-page-identity',
      'agent-page-server',
      'agent-page-onward',
    ]);
  });

  it('links to Systems, Fleet and Markets, in that order', async () => {
    const wrapper = mountPage(createTestQueryClient());
    await untilAgentShown(wrapper);

    const onward = wrapper.findAll('.onward-link');
    expect(onward.map((link) => link.text())).toEqual([
      expect.stringContaining('Systems'),
      expect.stringContaining('Fleet'),
      expect.stringContaining('Markets'),
    ]);
  });

  it('names the tab after the agent, page first', async () => {
    const wrapper = mountPage(createTestQueryClient());
    await untilAgentShown(wrapper);

    expect(document.title).toBe(formatPageTitle('ALICE'));
  });

  it('spins while the agent is loading, and nothing else', () => {
    const wrapper = mountPage(createTestQueryClient());

    expect(wrapper.find('.base-spinner').exists()).toBe(true);
    expect(wrapper.find('.agent-header').exists()).toBe(false);
  });

  it('names what failed and offers "Try again" when the agent cannot be loaded', async () => {
    server.use(mockGet('/my/agent', () => apiErrorResponse(500)));

    const wrapper = mountPage(createTestQueryClient());
    await vi.waitFor(() => {
      expect(wrapper.find('.query-state-error').exists()).toBe(true);
    }, WAIT);

    expect(wrapper.find('.query-state-error').text()).toContain("Couldn't load your agent.");
    expect(wrapper.find('.query-state-error button').text()).toBe('Try again');
  });

  it('keeps the server card readable when only the server status fails', async () => {
    server.use(mockGet('/', () => apiErrorResponse(500)));

    const wrapper = mountPage(createTestQueryClient());
    await untilAgentShown(wrapper);
    await vi.waitFor(() => {
      expect(wrapper.find('.query-state-error').exists()).toBe(true);
    }, WAIT);

    expect(wrapper.text()).toContain("Couldn't load the server status.");
    expect(wrapper.find('.agent-header').exists()).toBe(true);
  });
});
