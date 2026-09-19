import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { loginPath, type LoginReason } from '@/modules/auth/domain/redirect';
import { normalizeToken } from '@/modules/auth/domain/token';
import type { SessionExpiryReason } from '@/shared/api/client';

import { createTokenStorages, type TokenPersistence, type TokenStorageSet } from './token-storage';

type SessionEffects = {
  navigate: (path: string) => void;
  clearCache: () => void;
  currentPath: () => string;
};

const EXPIRY_REASON: Readonly<Record<SessionExpiryReason, LoginReason>> = { unauthorized: 'expired' };

const browserPath = (): string => {
  const { pathname, search } = globalThis.location;
  return `${pathname}${search}`;
};

const defaultEffects: SessionEffects = {
  navigate: (path) => {
    try {
      globalThis.location.assign(path);
    } catch {
      // No navigable document (tests, SSR). The token is cleared either way.
    }
  },
  clearCache: () => undefined,
  currentPath: browserPath,
};

let storageFactory: () => TokenStorageSet = () => createTokenStorages();

export const setTokenStorageFactory = (factory: () => TokenStorageSet): void => {
  storageFactory = factory;
};

export const resetTokenStorageFactory = (): void => {
  storageFactory = () => createTokenStorages();
};

export const useSessionStore = defineStore('session', () => {
  const storages = storageFactory();
  let effects: SessionEffects = defaultEffects;

  const token = ref<string | null>(null);
  const persistence = ref<TokenPersistence>('session');
  const hasExpired = ref(false);

  const isAuthenticated = computed(() => token.value !== null && token.value.length > 0);
  const isStorageDurable = computed(() => storages.isDurable);

  const hydrate = (): void => {
    const remembered = storages.local.read();
    if (remembered !== null && remembered.length > 0) {
      token.value = remembered;
      persistence.value = 'local';
      return;
    }
    const current = storages.session.read();
    if (current !== null && current.length > 0) {
      token.value = current;
      persistence.value = 'session';
    }
  };

  const forget = (): void => {
    token.value = null;
    storages.local.clear();
    storages.session.clear();
  };

  const signIn = (candidate: string, options: { remember?: boolean } = {}): void => {
    const value = normalizeToken(candidate);
    const remember = options.remember === true;
    storages.local.clear();
    storages.session.clear();
    (remember ? storages.local : storages.session).write(value);
    token.value = value;
    persistence.value = remember ? 'local' : 'session';
    hasExpired.value = false;
  };

  const signOut = (): void => {
    forget();
    persistence.value = 'session';
    hasExpired.value = false;
    effects.clearCache();
    effects.navigate(loginPath());
  };

  const expire = (reason: SessionExpiryReason): void => {
    if (hasExpired.value || !isAuthenticated.value) return;
    hasExpired.value = true;
    const redirect = effects.currentPath();
    forget();
    effects.clearCache();
    effects.navigate(loginPath({ reason: EXPIRY_REASON[reason], redirect }));
  };

  const attachEffects = (overrides: Partial<SessionEffects>): void => {
    effects = { ...effects, ...overrides };
  };

  const detachEffects = (): void => {
    effects = defaultEffects;
  };

  hydrate();

  return {
    token,
    persistence,
    hasExpired,
    isAuthenticated,
    isStorageDurable,
    signIn,
    signOut,
    expire,
    attachEffects,
    detachEffects,
  };
});
