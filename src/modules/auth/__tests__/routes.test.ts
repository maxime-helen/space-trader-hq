import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Router } from 'vue-router';

import { authRoutes } from '@/modules/auth';
import {
  resetTokenStorageFactory,
  setTokenStorageFactory,
  useSessionStore,
} from '@/modules/auth/session/session.store';
import { createMemoryStorage } from '@/modules/auth/session/token-storage';
import { createTestRouter, TEST_TOKEN } from '@/shared/api/__tests__/test-support';

const testRouter = (): Router => createTestRouter(authRoutes);

beforeEach(() => {
  setTokenStorageFactory(() => ({ local: createMemoryStorage(), session: createMemoryStorage(), isDurable: true }));
  setActivePinia(createPinia());
});

afterEach(() => {
  resetTokenStorageFactory();
});

describe('authRoutes', () => {
  it('contributes exactly one lazily loaded route, /login', () => {
    expect(authRoutes).toHaveLength(1);
    const [login] = authRoutes;

    expect(login?.path).toBe('/login');
    expect(typeof login?.component).toBe('function');
  });

  it('names the page for the tab title, page first', () => {
    expect(authRoutes[0]?.meta?.title).toBe('Sign in');
  });

  it('keeps a signed-in visitor off the login page', async () => {
    useSessionStore().signIn(TEST_TOKEN, { remember: false });
    const router = testRouter();

    await router.push('/login');

    expect(router.currentRoute.value.path).toBe('/');
  });

  it('sends a signed-in visitor to the internal redirect they asked for', async () => {
    useSessionStore().signIn(TEST_TOKEN, { remember: false });
    const router = testRouter();

    await router.push('/login?redirect=/fleet');

    expect(router.currentRoute.value.fullPath).toBe('/fleet');
  });

  it('ignores an external redirect on the way off the login page', async () => {
    useSessionStore().signIn(TEST_TOKEN, { remember: false });
    const router = testRouter();

    await router.push('/login?redirect=//evil.example');

    expect(router.currentRoute.value.path).toBe('/');
  });

  it('lets a signed-out visitor through to the login page', async () => {
    const router = testRouter();

    await router.push('/login?reason=expired');

    expect(router.currentRoute.value.path).toBe('/login');
  });
});
