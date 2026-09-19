import { createRouter, createWebHistory, type Router, type RouteRecordRaw, type RouterHistory } from 'vue-router';

import { agentRoutes } from '@/modules/agent';
import { authRoutes, LOGIN_PATH, safeRedirect, useSessionStore } from '@/modules/auth';
import { fleetRoutes } from '@/modules/fleet';
import { marketsRoutes } from '@/modules/markets';
import { systemsRoutes } from '@/modules/systems';
import { formatPageTitle } from '@/shared/lib/format';

type RouteAccess = 'auth' | 'guest' | 'public';

declare module 'vue-router' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- augmenting a library type needs declaration merging, which only interfaces do
  interface RouteMeta {
    title?: string;
    access?: RouteAccess;
  }
}

export const HOME_PATH = '/';

// Turns a module's top-level path into a child of the authenticated layout: `/fleet` becomes
// `fleet` and the module's own `/` becomes the layout's index route.
const asLayoutChild = (route: RouteRecordRaw): RouteRecordRaw => ({ ...route, path: route.path.replace(/^\//, '') });

export const appRoutes: RouteRecordRaw[] = [
  ...authRoutes,
  {
    path: HOME_PATH,
    component: () => import('@/app/layouts/authenticated-layout.vue'),
    meta: { access: 'auth' },
    children: [
      ...agentRoutes.map(asLayoutChild),
      ...systemsRoutes.map(asLayoutChild),
      ...fleetRoutes.map(asLayoutChild),
      ...marketsRoutes.map(asLayoutChild),
    ],
  },

  // /:pathMatch(.*)* matches any URL that no earlier route claimed
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/app/pages/not-found-page.vue'),
    meta: { title: 'Page not found', access: 'public' },
  },
];

export const createAppRouter = (history: RouterHistory = createWebHistory(import.meta.env.BASE_URL)): Router => {
  const router = createRouter({ history, routes: appRoutes });

  router.beforeEach((to) => {
    const session = useSessionStore();
    const access = to.meta.access ?? 'public';

    if (access === 'auth' && !session.isAuthenticated) {
      return { path: LOGIN_PATH, query: { redirect: to.fullPath } };
    }
    if (access === 'guest' && session.isAuthenticated) {
      return safeRedirect(to.query.redirect);
    }
    return true;
  });

  router.afterEach((to) => {
    const title = to.meta.title;
    if (typeof title === 'string' && title.length > 0) {
      document.title = formatPageTitle(title);
    }
  });

  return router;
};

export const router = createAppRouter();
