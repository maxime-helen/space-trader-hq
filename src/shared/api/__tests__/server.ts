import type { HttpHandler } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { apiHandlers } from './handlers';

export type ApiMockServer = ReturnType<typeof setupServer>;

const createApiMockServer = (...extraHandlers: HttpHandler[]): ApiMockServer =>
  setupServer(...extraHandlers, ...apiHandlers);

export const setupApiMocks = (...extraHandlers: HttpHandler[]): ApiMockServer => {
  const server = createApiMockServer(...extraHandlers);
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => {
    server.close();
  });
  return server;
};
