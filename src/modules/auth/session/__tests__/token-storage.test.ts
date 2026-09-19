import { beforeEach, describe, expect, it } from 'vitest';

import {
  createMemoryStorage,
  createTokenStorages,
  createWebStorage,
  TOKEN_STORAGE_KEY,
} from '@/modules/auth/session/token-storage';

const throwingStorage = (): Storage =>
  new Proxy({} as Storage, {
    get: () => () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    },
  });

const quotaBoundStorage = (): Storage => {
  const inner = new Map<string, string>();
  const storage: Storage = {
    length: 0,
    clear: () => {
      inner.clear();
    },
    key: () => null,
    getItem: (key) => inner.get(key) ?? null,
    removeItem: (key) => {
      inner.delete(key);
    },
    setItem: (key, value) => {
      if (key === TOKEN_STORAGE_KEY) throw new DOMException('Quota exceeded.', 'QuotaExceededError');
      inner.set(key, value);
    },
  };
  return storage;
};

beforeEach(() => {
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
});

describe('memory storage', () => {
  it('reads back what it wrote, and forgets on clear', () => {
    const storage = createMemoryStorage();

    expect(storage.read()).toBeNull();
    storage.write('a.b.c');
    expect(storage.read()).toBe('a.b.c');
    storage.clear();
    expect(storage.read()).toBeNull();
  });

  it('is independent per instance, so one adapter never leaks into another', () => {
    const first = createMemoryStorage();
    const second = createMemoryStorage();

    first.write('a.b.c');

    expect(second.read()).toBeNull();
  });
});

describe('web storage', () => {
  it('writes the token under one known key and removes it on clear', () => {
    const storage = createWebStorage(() => globalThis.localStorage);

    storage?.write('a.b.c');
    expect(globalThis.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('a.b.c');
    storage?.clear();
    expect(globalThis.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('leaves no probe key behind', () => {
    createWebStorage(() => globalThis.localStorage);

    expect(globalThis.localStorage.length).toBe(0);
  });

  it('is undefined when the storage throws, which is the signal to fall back', () => {
    expect(createWebStorage(throwingStorage)).toBeUndefined();
  });

  it('survives a write that fails after the probe succeeded', () => {
    const storage = createWebStorage(quotaBoundStorage);

    expect(storage).toBeDefined();
    expect(() => storage?.write('a.b.c')).not.toThrow();
    expect(storage?.read()).toBeNull();
  });
});

describe('createTokenStorages', () => {
  it('reports durable storage when both web storages work', () => {
    const storages = createTokenStorages();

    expect(storages.isDurable).toBe(true);
    storages.local.write('a.b.c');
    expect(storages.session.read()).toBeNull();
  });

  it('falls back to one shared memory adapter when web storage throws (private browsing)', () => {
    const storages = createTokenStorages({ local: throwingStorage, session: throwingStorage });

    expect(storages.isDurable).toBe(false);
    storages.local.write('a.b.c');
    // Both slots are the same adapter: "remember me" and a plain sign-in behave identically.
    expect(storages.session.read()).toBe('a.b.c');
    expect(globalThis.localStorage.length).toBe(0);
  });
});
