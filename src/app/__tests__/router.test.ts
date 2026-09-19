import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryHistory, type RouteRecordRaw } from 'vue-router';

import { appRoutes, createAppRouter, HOME_PATH } from '@/app/router';
import { LOGIN_PATH, useSessionStore } from '@/modules/auth';
import { formatPageTitle } from '@/shared/lib/format';

const newRouter = () => createAppRouter(createMemoryHistory());

const signIn = () => {
  useSessionStore().signIn('test-token');
};

const flatten = (routes: RouteRecordRaw[]): RouteRecordRaw[] =>
  routes.flatMap((route) => [route, ...flatten(route.children ?? [])]);

beforeEach(() => {
  setActivePinia(createPinia());
  // The session hydrates from web storage, so a token must not leak from one test into the next.
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  document.title = '';
});

describe('route table', () => {
  it("composes every feature module's routes, and declares none of its own", () => {
    const router = newRouter();
    const paths = router.getRoutes().map((route) => route.path);

    expect(paths).toContain(LOGIN_PATH);
    expect(paths).toContain(HOME_PATH);
    expect(paths).toContain('/:pathMatch(.*)*');
    expect(paths).toEqual(
      expect.arrayContaining([
        '/systems',
        '/systems/:systemSymbol',
        '/systems/:systemSymbol/waypoints/:waypointSymbol',
        '/fleet',
        '/fleet/:shipSymbol',
        '/markets',
      ]),
    );
  });

  it('loads every page lazily', () => {
    const pages = flatten(appRoutes).filter((route) => route.children === undefined || route.children.length === 0);

    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) {
      expect(typeof page.component).toBe('function');
    }
  });

  it('puts the agent page inside the authenticated layout', async () => {
    signIn();
    const router = newRouter();
    await router.push(HOME_PATH);

    expect(router.currentRoute.value.matched).toHaveLength(2);
    expect(router.currentRoute.value.meta.access).toBe('auth');
  });

  it('leaves the not-found route unguarded, so a mistyped address explains itself', async () => {
    const router = newRouter();
    await router.push('/nowhere-at-all');

    expect(router.currentRoute.value.matched[0]?.path).toBe('/:pathMatch(.*)*');
    expect(router.currentRoute.value.fullPath).toBe('/nowhere-at-all');
  });
});

describe('guards', () => {
  it('sends a signed-out visitor from a private route to the login page, with a way back', async () => {
    const router = newRouter();
    await router.push(HOME_PATH);

    expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/');
  });

  it('keeps a signed-in visitor off the login page', async () => {
    signIn();
    const router = newRouter();
    await router.push(LOGIN_PATH);

    expect(router.currentRoute.value.fullPath).toBe(HOME_PATH);
  });

  it('follows an internal redirect once signed in', async () => {
    signIn();
    const router = newRouter();
    await router.push('/login?redirect=/fleet');

    expect(router.currentRoute.value.fullPath).toBe('/fleet');
  });

  it.each(['//evil.com', 'https://evil.com', 'javascript:alert(1)', '/\\evil.com'])(
    'ignores the external redirect target %s',
    async (redirect) => {
      signIn();
      const router = newRouter();
      await router.push({ path: LOGIN_PATH, query: { redirect } });

      expect(router.currentRoute.value.fullPath).toBe(HOME_PATH);
    },
  );

  it('never redirects back to the login page itself', async () => {
    signIn();
    const router = newRouter();
    await router.push('/login?redirect=/login');

    expect(router.currentRoute.value.fullPath).toBe(HOME_PATH);
  });

  it('lets a signed-out visitor reach the login page', async () => {
    const router = newRouter();
    await router.push(LOGIN_PATH);

    expect(router.currentRoute.value.path).toBe(LOGIN_PATH);
  });
});

describe('tab titles', () => {
  it('names every page in its route meta', () => {
    const pages = flatten(appRoutes).filter((route) => route.children === undefined || route.children.length === 0);

    for (const page of pages) {
      expect(page.meta?.title).toBeTypeOf('string');
    }
  });

  it.each([
    ['/login', 'Sign in'],
    ['/', 'Agent'],
    ['/nowhere-at-all', 'Page not found'],
  ])('sets the title of %s, page first', async (path, title) => {
    if (path === '/') signIn();
    const router = newRouter();
    await router.push(path);

    expect(document.title).toBe(formatPageTitle(title));
    expect(document.title.startsWith(title)).toBe(true);
    expect(document.title.endsWith('SpaceTradersHQ')).toBe(true);
  });
});
