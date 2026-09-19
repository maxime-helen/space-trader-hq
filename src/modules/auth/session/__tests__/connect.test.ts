import { QueryClient } from '@tanstack/vue-query';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from 'vue-router';

import { agentKeys } from '@/modules/agent';
import { connectAuthToApiClient } from '@/modules/auth/session/connect';
import {
  resetTokenStorageFactory,
  setTokenStorageFactory,
  useSessionStore,
} from '@/modules/auth/session/session.store';
import { createMemoryStorage } from '@/modules/auth/session/token-storage';
import { buildAgent } from '@/shared/api/__tests__/fixtures';
import { mockGet, unauthorizedResponse } from '@/shared/api/__tests__/handlers';
import { setupApiMocks } from '@/shared/api/__tests__/server';
import { createTestRouter, TEST_TOKEN } from '@/shared/api/__tests__/test-support';
import { apiClient, setSessionExpiryHandler, setTokenSource } from '@/shared/api/client';

const server = setupApiMocks();

const testRouter = (): Router => createTestRouter();

const captureAuthHeaders = (): string[] => {
  const headers: string[] = [];
  server.use(
    mockGet('/my/agent', ({ request }) => {
      headers.push(request.headers.get('Authorization') ?? '');
      return { data: buildAgent() };
    }),
  );
  return headers;
};

beforeEach(() => {
  setTokenStorageFactory(() => ({ local: createMemoryStorage(), session: createMemoryStorage(), isDurable: true }));
  setActivePinia(createPinia());
});

afterEach(() => {
  setTokenSource(() => undefined);
  setSessionExpiryHandler(() => undefined);
  resetTokenStorageFactory();
});

describe('connectAuthToApiClient', () => {
  it('carries Authorization: Bearer <token>, read at request time', async () => {
    const headers = captureAuthHeaders();
    const session = useSessionStore();
    connectAuthToApiClient();

    // Signed out: the client was already built, and sends nothing.
    await apiClient.GET('/my/agent');
    session.signIn(TEST_TOKEN, { remember: false });
    // Signed in a moment later, with no client rebuild.
    await apiClient.GET('/my/agent');

    expect(headers).toEqual(['', `Bearer ${TEST_TOKEN}`]);
  });

  it('stops sending the token as soon as the session is signed out', async () => {
    const headers = captureAuthHeaders();
    const session = useSessionStore();
    connectAuthToApiClient({ router: testRouter() });
    session.signIn(TEST_TOKEN, { remember: true });

    session.signOut();
    await apiClient.GET('/my/agent');

    expect(headers).toEqual(['']);
  });

  it('turns a 401 from any request into one session expiry, with the way back', async () => {
    server.use(mockGet('/my/agent', () => unauthorizedResponse()));
    const router = testRouter();
    await router.push('/fleet');
    const session = useSessionStore();
    connectAuthToApiClient({ router });
    session.signIn(TEST_TOKEN, { remember: true });

    await expect(apiClient.GET('/my/agent')).rejects.toThrow();

    expect(session.isAuthenticated).toBe(false);
    await vi.waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/login?reason=expired&redirect=/fleet');
    });
  });

  it('clears the query cache, so the next agent never sees the previous one', async () => {
    server.use(mockGet('/my/agent', () => unauthorizedResponse()));
    const queryClient = new QueryClient();
    queryClient.setQueryData(agentKeys.me(), buildAgent());
    const session = useSessionStore();
    connectAuthToApiClient({ queryClient, router: testRouter() });
    session.signIn(TEST_TOKEN, { remember: true });

    await expect(apiClient.GET('/my/agent')).rejects.toThrow();

    expect(queryClient.getQueryData(agentKeys.me())).toBeUndefined();
  });

  it('disconnects cleanly, which is what keeps one test from leaking into the next', async () => {
    const headers = captureAuthHeaders();
    const session = useSessionStore();
    const disconnect = connectAuthToApiClient();
    session.signIn(TEST_TOKEN, { remember: true });

    disconnect();
    await apiClient.GET('/my/agent');

    expect(headers).toEqual(['']);
  });
});
