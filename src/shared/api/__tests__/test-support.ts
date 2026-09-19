import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { vi } from 'vitest';
import { type App, createApp, defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter, type Router, type RouteRecordRaw } from 'vue-router';

import type { ApiMockServer } from './server';

// How long a test waits for the API mocks and the rate limiter to settle.
export const WAIT = { timeout: 5000 };

export const TEST_TOKEN = 'eyJhbGciOiJSUzI1NiJ9.eyJpZGVudGlmaWVyIjoiQUxJQ0UifQ.c2lnbmF0dXJl';

// Retries are off: a test that expects a failure should see it immediately, not three seconds later.
export const createTestQueryClient = (): QueryClient =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

// Every request URL MSW sees, in order. Assert on this rather than on a spy you control.
export const recordRequests = (server: ApiMockServer): string[] => {
  const urls: string[] = [];
  server.events.on('request:start', ({ request }) => urls.push(request.url));
  return urls;
};

// The same, with the method, for tests that care about GET versus POST.
export const recordRequestLines = (server: ApiMockServer): string[] => {
  const seen: string[] = [];
  server.events.on('request:start', ({ request }) => seen.push(`${request.method} ${request.url}`));
  return seen;
};

// A fake clock for the rate limiter and the 429 retries: `Date` and `setTimeout` stand still until
// a test advances them, and every sleep asked for is recorded. Call `vi.useRealTimers()` after.
export const fakeClock = (): { sleeps: () => number[] } => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  const timeouts = vi.spyOn(globalThis, 'setTimeout');
  return { sleeps: () => timeouts.mock.calls.map(([, ms]) => Number(ms)) };
};

export const settle = async <T>(promise: Promise<T>): Promise<T> => {
  const state = { done: false };
  const tracked = promise.finally(() => {
    state.done = true;
  });
  tracked.catch(() => undefined);
  while (!state.done) {
    if (vi.getTimerCount() > 0) await vi.advanceTimersToNextTimerAsync();
    else
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
  }
  return tracked;
};

const BLANK_PAGE = { template: '<div />' };

export const createTestRouter = (routes: RouteRecordRaw[] = []): Router => {
  const overridden = new Set(routes.map((route) => route.path));
  const blanks: RouteRecordRaw[] = [
    '/',
    '/login',
    '/systems',
    '/systems/:systemSymbol',
    '/systems/:systemSymbol/waypoints/:waypointSymbol',
    '/fleet',
    '/fleet/:shipSymbol',
    '/markets',
  ]
    .filter((path) => !overridden.has(path))
    .map((path) => ({ path, component: BLANK_PAGE }));
  return createRouter({ history: createMemoryHistory(), routes: [...routes, ...blanks] });
};

export const withSetup = <T>(composable: () => T, queryClient: QueryClient): { result: T; app: App } => {
  let result: T | undefined;
  const app = createApp(
    defineComponent({
      setup() {
        result = composable();
        return () => h('div');
      },
    }),
  );
  app.use(VueQueryPlugin, { queryClient });
  app.mount(document.createElement('div'));
  return { result: result as T, app };
};
