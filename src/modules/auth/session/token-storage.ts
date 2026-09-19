type TokenStorage = {
  read: () => string | null;
  write: (token: string) => void;
  clear: () => void;
};

export type TokenPersistence = 'session' | 'local';

export const TOKEN_STORAGE_KEY = 'spacetradershq:agent-token';

export const createMemoryStorage = (): TokenStorage => {
  let value: string | null = null;
  return {
    read: () => value,
    write: (token) => {
      value = token;
    },
    clear: () => {
      value = null;
    },
  };
};

type StorageSource = () => Storage;

const localStorageSource: StorageSource = () => globalThis.localStorage;
const sessionStorageSource: StorageSource = () => globalThis.sessionStorage;

export const createWebStorage = (source: StorageSource): TokenStorage | undefined => {
  try {
    const storage = source();
    const probe = `${TOKEN_STORAGE_KEY}:probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return {
      read: () => {
        try {
          return storage.getItem(TOKEN_STORAGE_KEY);
        } catch {
          return null;
        }
      },
      write: (token) => {
        try {
          storage.setItem(TOKEN_STORAGE_KEY, token);
        } catch {
          // A quota or permission failure must not break signing in: the token stays in memory
          // and the session simply stops being durable.
        }
      },
      clear: () => {
        try {
          storage.removeItem(TOKEN_STORAGE_KEY);
        } catch {
          // Nothing more can be done; the token is already gone from memory.
        }
      },
    };
  } catch {
    return undefined;
  }
};

export type TokenStorageSet = {
  local: TokenStorage;
  session: TokenStorage;
  isDurable: boolean;
};

type TokenStorageSources = {
  local?: StorageSource;
  session?: StorageSource;
};

export const createTokenStorages = (sources: TokenStorageSources = {}): TokenStorageSet => {
  const local = createWebStorage(sources.local ?? localStorageSource);
  const session = createWebStorage(sources.session ?? sessionStorageSource);
  if (local === undefined || session === undefined) {
    const memory = createMemoryStorage();
    return { local: memory, session: memory, isDurable: false };
  }
  return { local, session, isDurable: true };
};
