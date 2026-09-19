import type { RouteRecordRaw } from 'vue-router';

import { DEFAULT_REDIRECT, safeRedirect } from '@/modules/auth/domain/redirect';
import { useSessionStore } from '@/modules/auth/session/session.store';

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@/modules/auth/pages/login-page.vue'),
    meta: { title: 'Sign in', access: 'guest' },
    beforeEnter: (to) => {
      const session = useSessionStore();
      if (!session.isAuthenticated) return true;
      return safeRedirect(to.query.redirect, DEFAULT_REDIRECT);
    },
  },
];
