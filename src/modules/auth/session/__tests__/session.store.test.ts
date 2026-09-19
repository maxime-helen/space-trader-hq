import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  resetTokenStorageFactory,
  setTokenStorageFactory,
  useSessionStore,
} from '@/modules/auth/session/session.store';
import { createMemoryStorage, type TokenStorageSet } from '@/modules/auth/session/token-storage';
import { TEST_TOKEN } from '@/shared/api/__tests__/test-support';

const OTHER_TOKEN = 'eyJhbGciOiJSUzI1NiJ9.eyJpZGVudGlmaWVyIjoiVk9ZQUdFUiJ9.c2lnbmF0dXJl';

const memoryStorages = (isDurable = true): TokenStorageSet => ({
  local: createMemoryStorage(),
  session: createMemoryStorage(),
  isDurable,
});

const spyEffects = (currentPath = '/fleet') => ({
  navigate: vi.fn<(path: string) => void>(),
  clearCache: vi.fn<() => void>(),
  currentPath: vi.fn<() => string>(() => currentPath),
});

const freshStore = (storages: TokenStorageSet = memoryStorages()) => {
  setTokenStorageFactory(() => storages);
  setActivePinia(createPinia());
  return { store: useSessionStore(), storages };
};

beforeEach(() => {
  setActivePinia(createPinia());
});

afterEach(() => {
  resetTokenStorageFactory();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('hydration', () => {
  it('starts signed out when neither storage holds a token', () => {
    const { store } = freshStore();

    expect(store.token).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('hydrates from localStorage first', () => {
    const storages = memoryStorages();
    storages.local.write(TEST_TOKEN);
    storages.session.write(OTHER_TOKEN);

    const { store } = freshStore(storages);

    expect(store.token).toBe(TEST_TOKEN);
    expect(store.persistence).toBe('local');
  });

  it('falls back to sessionStorage when nothing was remembered', () => {
    const storages = memoryStorages();
    storages.session.write(OTHER_TOKEN);

    const { store } = freshStore(storages);

    expect(store.token).toBe(OTHER_TOKEN);
    expect(store.persistence).toBe('session');
  });
});

describe('signIn', () => {
  it('remembers the token in localStorage when asked to', () => {
    const { store, storages } = freshStore();

    store.signIn(TEST_TOKEN, { remember: true });

    expect(store.isAuthenticated).toBe(true);
    expect(store.persistence).toBe('local');
    expect(storages.local.read()).toBe(TEST_TOKEN);
    expect(storages.session.read()).toBeNull();
  });

  it('keeps the token to the tab when "remember" is not chosen', () => {
    const { store, storages } = freshStore();

    store.signIn(TEST_TOKEN);

    expect(store.persistence).toBe('session');
    expect(storages.session.read()).toBe(TEST_TOKEN);
    expect(storages.local.read()).toBeNull();
  });
});

describe('expire', () => {
  it('clears the token and cache and routes to the login page with the reason', () => {
    const { store, storages } = freshStore();
    const effects = spyEffects('/fleet');
    store.attachEffects(effects);
    store.signIn(TEST_TOKEN, { remember: true });

    store.expire('unauthorized');

    expect(store.token).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(storages.local.read()).toBeNull();
    expect(storages.session.read()).toBeNull();
    expect(effects.clearCache).toHaveBeenCalledTimes(1);
    expect(effects.navigate).toHaveBeenCalledExactlyOnceWith('/login?reason=expired&redirect=/fleet');
  });

  it('is idempotent: five parallel 401s expire the session once', () => {
    const { store } = freshStore();
    const effects = spyEffects('/fleet');
    store.attachEffects(effects);
    store.signIn(TEST_TOKEN, { remember: true });

    for (let call = 0; call < 5; call += 1) store.expire('unauthorized');

    expect(effects.navigate).toHaveBeenCalledTimes(1);
    expect(effects.clearCache).toHaveBeenCalledTimes(1);
    expect(store.hasExpired).toBe(true);
  });

  it('ignores a 401 while signed out: that is the login page validating a paste', () => {
    const { store } = freshStore();
    const effects = spyEffects();
    store.attachEffects(effects);

    store.expire('unauthorized');

    expect(effects.navigate).not.toHaveBeenCalled();
    expect(effects.clearCache).not.toHaveBeenCalled();
  });

  it('never puts the token in the URL it navigates to', () => {
    const { store } = freshStore();
    const effects = spyEffects('/fleet');
    store.attachEffects(effects);
    store.signIn(TEST_TOKEN, { remember: true });

    store.expire('unauthorized');

    expect(String(effects.navigate.mock.calls[0]?.[0])).not.toContain(TEST_TOKEN);
  });
});

describe('signOut', () => {
  it('clears both storages and the query cache, and returns to the login page', () => {
    const { store, storages } = freshStore();
    const effects = spyEffects('/fleet');
    store.attachEffects(effects);
    store.signIn(TEST_TOKEN, { remember: true });

    store.signOut();

    expect(store.token).toBeNull();
    expect(storages.local.read()).toBeNull();
    expect(storages.session.read()).toBeNull();
    expect(effects.clearCache).toHaveBeenCalledTimes(1);
    // No `reason` and no `redirect`: signing out is not an accident to come back from.
    expect(effects.navigate).toHaveBeenCalledExactlyOnceWith('/login');
  });
});

describe('effects', () => {
  it('falls back to a full page load when no router was attached', () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { assign, pathname: '/fleet', search: '' });
    const { store } = freshStore();
    store.signIn(TEST_TOKEN);

    store.signOut();

    expect(assign).toHaveBeenCalledExactlyOnceWith('/login');
  });
});
