import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from 'vue-router';

import { agentKeys } from '@/modules/agent';
import LoginPage from '@/modules/auth/pages/login-page.vue';
import {
  resetTokenStorageFactory,
  setTokenStorageFactory,
  useSessionStore,
} from '@/modules/auth/session/session.store';
import { createMemoryStorage, type TokenStorageSet } from '@/modules/auth/session/token-storage';
import { buildAgent } from '@/shared/api/__tests__/fixtures';
import { apiErrorResponse, createRequestCounter, mockGet } from '@/shared/api/__tests__/handlers';
import { setupApiMocks } from '@/shared/api/__tests__/server';
import { createTestRouter, TEST_TOKEN } from '@/shared/api/__tests__/test-support';
import { setSessionExpiryHandler, setTokenSource } from '@/shared/api/client';

const server = setupApiMocks();

let storages: TokenStorageSet;

const makeStorages = (isDurable = true): TokenStorageSet => ({
  local: createMemoryStorage(),
  session: createMemoryStorage(),
  isDurable,
});

const testRouter = (): Router => createTestRouter();

type Harness = { wrapper: VueWrapper; router: Router; queryClient: QueryClient };

const renderLoginPage = async (path = '/login'): Promise<Harness> => {
  const router = testRouter();
  await router.push(path);
  await router.isReady();
  const queryClient = new QueryClient();
  const wrapper = mount(LoginPage, {
    global: { plugins: [router, [VueQueryPlugin, { queryClient }]], stubs: { StarField: true } },
  });
  return { wrapper, router, queryClient };
};

const submitToken = async (wrapper: VueWrapper, value: string, options: { remember?: boolean } = {}) => {
  await wrapper.get('textarea').setValue(value);
  if (options.remember === true) await wrapper.get('[data-testid="remember-checkbox"]').setValue(true);
  await wrapper.get('form').trigger('submit');
  await vi.waitFor(
    () => {
      expect(wrapper.get('[data-testid="submit-button"]').attributes('disabled')).toBeUndefined();
    },
    { timeout: 4000, interval: 10 },
  );
  await flushPromises();
};

const errorText = (wrapper: VueWrapper): string => wrapper.find('.base-field-error').text();

beforeEach(() => {
  storages = makeStorages();
  setTokenStorageFactory(() => storages);
  setActivePinia(createPinia());
});

afterEach(() => {
  setTokenSource(() => undefined);
  setSessionExpiryHandler(() => undefined);
  resetTokenStorageFactory();
  vi.restoreAllMocks();
});

describe('the form', () => {
  it('offers one textarea, a remember checkbox and the hint for users without a token', async () => {
    const { wrapper } = await renderLoginPage();

    expect(wrapper.findAll('textarea')).toHaveLength(1);
    expect(wrapper.find('[data-testid="remember-checkbox"]').attributes('type')).toBe('checkbox');
    expect(wrapper.find('[data-testid="remember-checkbox"]').attributes('disabled')).toBeUndefined();
    expect(wrapper.find('[data-testid="storage-notice"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('No token yet?');
    expect(wrapper.get('.login-hint a').attributes('href')).toContain('spacetraders.io');
  });

  it('shows the expiry banner only when the session ended', async () => {
    const plain = await renderLoginPage('/login');
    expect(plain.wrapper.find('[data-testid="expiry-banner"]').exists()).toBe(false);

    const expired = await renderLoginPage('/login?reason=expired&redirect=/fleet');
    expect(expired.wrapper.get('[data-testid="expiry-banner"]').text()).toContain('universe was reset');
  });

  it('says so and disables "Remember" when the browser blocks storage', async () => {
    storages = makeStorages(false);
    const { wrapper } = await renderLoginPage();

    expect(wrapper.get('[data-testid="storage-notice"]').text()).toContain('kept for this tab only');
    expect(wrapper.get('[data-testid="remember-checkbox"]').attributes('disabled')).toBeDefined();
  });
});

describe('signing in', () => {
  it('rejects a value that is not JWT-shaped without a request', async () => {
    const counter = createRequestCounter();
    server.use(counter.handler);
    const { wrapper, router } = await renderLoginPage();

    await submitToken(wrapper, 'ALICE');

    expect(counter.count()).toBe(0);
    expect(errorText(wrapper)).toContain("doesn't look like an agent token");
    expect(useSessionStore().token).toBeNull();
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('normalizes a token pasted with a Bearer prefix and line breaks before validating', async () => {
    const seen: string[] = [];
    server.use(
      mockGet('/my/agent', ({ request }) => {
        seen.push(request.headers.get('Authorization') ?? '');
        return { data: buildAgent() };
      }),
    );
    const { wrapper } = await renderLoginPage();

    await submitToken(wrapper, `  Bearer ${TEST_TOKEN.slice(0, 20)}\n${TEST_TOKEN.slice(20)}  `);

    expect(seen).toEqual([`Bearer ${TEST_TOKEN}`]);
    expect(useSessionStore().token).toBe(TEST_TOKEN);
  });

  it('signs in, honours "remember on this device", and lands on the redirect', async () => {
    const { wrapper, router } = await renderLoginPage('/login?redirect=/fleet');

    await submitToken(wrapper, TEST_TOKEN, { remember: true });

    const session = useSessionStore();
    expect(session.isAuthenticated).toBe(true);
    expect(session.persistence).toBe('local');
    expect(storages.local.read()).toBe(TEST_TOKEN);
    expect(router.currentRoute.value.fullPath).toBe('/fleet');
  });

  it('seeds the agent query, so the Agent page needs no second request', async () => {
    const agent = buildAgent({ symbol: 'ALICE', credits: 175_000 });
    server.use(mockGet('/my/agent', () => ({ data: agent })));
    const { wrapper, queryClient } = await renderLoginPage();

    await submitToken(wrapper, TEST_TOKEN);

    expect(queryClient.getQueryData(agentKeys.me())).toEqual(agent);
  });

  it('ignores an external redirect and lands on the agent page', async () => {
    const { wrapper, router } = await renderLoginPage('/login?redirect=https://evil.example');

    await submitToken(wrapper, TEST_TOKEN);

    expect(router.currentRoute.value.fullPath).toBe('/');
  });
});

describe('a token the API rejects', () => {
  it('shows the API message, stores nothing, and keeps the form filled', async () => {
    server.use(mockGet('/my/agent', () => apiErrorResponse(401, { message: 'Failed to parse token.', code: 4100 })));
    const { wrapper, router } = await renderLoginPage();

    await submitToken(wrapper, TEST_TOKEN, { remember: true });

    expect(errorText(wrapper)).toBe('Failed to parse token.');
    expect(useSessionStore().token).toBeNull();
    expect(storages.local.read()).toBeNull();
    expect(storages.session.read()).toBeNull();
    expect(wrapper.get('textarea').element.value).toBe(TEST_TOKEN);
    // The 401 of a candidate token is not an expiry: no banner, no redirect (see the store).
    expect(router.currentRoute.value.fullPath).toBe('/login');
  });
});
