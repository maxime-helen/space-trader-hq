import type { QueryClient } from '@tanstack/vue-query';
import type { Router } from 'vue-router';

import { setSessionExpiryHandler, setTokenSource } from '@/shared/api/client';

import { useSessionStore } from './session.store';

type ConnectAuthOptions = {
  router?: Router;
  queryClient?: QueryClient;
};

type DisconnectAuth = () => void;

export const connectAuthToApiClient = (options: ConnectAuthOptions = {}): DisconnectAuth => {
  const session = useSessionStore();
  const { router, queryClient } = options;

  if (router !== undefined) {
    session.attachEffects({
      navigate: (path) => {
        void router.replace(path);
      },
      currentPath: () => router.currentRoute.value.fullPath,
    });
  }

  if (queryClient !== undefined) {
    session.attachEffects({
      clearCache: () => {
        queryClient.clear();
      },
    });
  }

  setTokenSource(() => session.token);
  setSessionExpiryHandler((reason) => {
    session.expire(reason);
  });

  return () => {
    setTokenSource(() => undefined);
    setSessionExpiryHandler(() => undefined);
    session.detachEffects();
  };
};
