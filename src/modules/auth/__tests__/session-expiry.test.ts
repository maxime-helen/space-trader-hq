import { QueryClient } from '@tanstack/vue-query';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from 'vue-router';

import { agentKeys } from '@/modules/agent';
import { connectAuthToApiClient, useSessionStore } from '@/modules/auth';
import { resetTokenStorageFactory, setTokenStorageFactory } from '@/modules/auth/session/session.store';
import { createMemoryStorage, type TokenStorageSet } from '@/modules/auth/session/token-storage';
import { buildAgent, buildShip } from '@/shared/api/__tests__/fixtures';
import { mockGet, unauthorizedResponse } from '@/shared/api/__tests__/handlers';
import { setupApiMocks } from '@/shared/api/__tests__/server';
import { createTestRouter, TEST_TOKEN } from '@/shared/api/__tests__/test-support';
import { apiClient, setSessionExpiryHandler, setTokenSource } from '@/shared/api/client';

const server = setupApiMocks();

let storages: TokenStorageSet;

const testRouter = (): Router => createTestRouter();

const countNavigations = (router: Router): { count: () => number } => {
  let navigations = 0;
  router.afterEach((to) => {
    if (to.path === '/login') navigations += 1;
  });
  return { count: () => navigations };
};

beforeEach(() => {
  storages = { local: createMemoryStorage(), session: createMemoryStorage(), isDurable: true };
  setTokenStorageFactory(() => storages);
  setActivePinia(createPinia());
});

afterEach(() => {
  setTokenSource(() => undefined);
  setSessionExpiryHandler(() => undefined);
  resetTokenStorageFactory();
  vi.restoreAllMocks();
});

describe('a server reset in the middle of a session', () => {
  it('expires once when five parallel queries all fail with 401', async () => {
    server.use(
      mockGet('/my/agent', () => unauthorizedResponse()),
      mockGet('/my/ships', () => unauthorizedResponse()),
      mockGet('/my/ships/{shipSymbol}', () => unauthorizedResponse()),
    );
    const router = testRouter();
    await router.push('/fleet');
    const navigations = countNavigations(router);
    const queryClient = new QueryClient();
    queryClient.setQueryData(agentKeys.me(), buildAgent());
    queryClient.setQueryData(['fleet', 'ships'], [buildShip()]);
    const session = useSessionStore();
    connectAuthToApiClient({ router, queryClient });
    session.signIn(TEST_TOKEN, { remember: true });

    const results = await Promise.allSettled([
      apiClient.GET('/my/agent'),
      apiClient.GET('/my/ships'),
      apiClient.GET('/my/ships/{shipSymbol}', { params: { path: { shipSymbol: 'ALICE-1' } } }),
      apiClient.GET('/my/ships/{shipSymbol}', { params: { path: { shipSymbol: 'ALICE-2' } } }),
      apiClient.GET('/my/agent'),
    ]);

    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    expect(session.isAuthenticated).toBe(false);
    expect(session.hasExpired).toBe(true);
    await vi.waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/login?reason=expired&redirect=/fleet');
    });
    expect(navigations.count()).toBe(1);
  });

  it('clears the cache and the stored token, so nothing of the old agent survives', async () => {
    server.use(mockGet('/my/agent', () => unauthorizedResponse()));
    const router = testRouter();
    await router.push('/fleet');
    const queryClient = new QueryClient();
    queryClient.setQueryData(agentKeys.me(), buildAgent());
    const session = useSessionStore();
    connectAuthToApiClient({ router, queryClient });
    session.signIn(TEST_TOKEN, { remember: true });

    await expect(apiClient.GET('/my/agent')).rejects.toThrow();

    expect(queryClient.getQueryData(agentKeys.me())).toBeUndefined();
    expect(storages.local.read()).toBeNull();
    expect(storages.session.read()).toBeNull();
  });

  it('carries the page the user was on into the redirect, and never the token', async () => {
    server.use(mockGet('/my/agent', () => unauthorizedResponse()));
    const router = testRouter();
    await router.push('/fleet?page=2');
    const session = useSessionStore();
    connectAuthToApiClient({ router });
    session.signIn(TEST_TOKEN, { remember: true });

    await expect(apiClient.GET('/my/agent')).rejects.toThrow();

    await vi.waitFor(() => {
      expect(router.currentRoute.value.query.redirect).toBe('/fleet?page=2');
    });
    expect(router.currentRoute.value.fullPath).not.toContain(TEST_TOKEN);
  });
});
