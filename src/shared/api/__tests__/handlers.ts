import { http, type HttpHandler, HttpResponse } from 'msw';

import { API_BASE_URL } from '@/shared/api/client';
import type { paths } from '@/shared/api/types';

import {
  buildAgent,
  buildErrorBody,
  buildMarket,
  buildPage,
  buildRateLimitBody,
  buildServerStatus,
  buildShip,
  buildSystem,
  buildWaypoint,
  type ErrorBodyOptions,
  TEST_SHIP_SYMBOL,
} from './fixtures';

type ApiPath = Extract<keyof paths, string>;

export const apiUrl = (path: ApiPath): string => `${API_BASE_URL}${path.replace(/\{(\w+)\}/g, ':$1')}`;

type OkJson<P extends ApiPath> = paths[P] extends {
  get: { responses: { 200: { content: { 'application/json': infer R } } } };
}
  ? R
  : never;

type Resolver<P extends ApiPath> = (info: {
  params: Record<string, string | readonly string[] | undefined>;
  request: Request;
  url: URL;
}) => OkJson<P> | Response;

export const mockGet = <P extends ApiPath>(path: P, resolve: Resolver<P>): HttpHandler =>
  http.get(apiUrl(path), ({ params, request }) => {
    const result = resolve({ params, request, url: new URL(request.url) });
    return result instanceof Response ? result : HttpResponse.json(result as Record<string, unknown>);
  });

// Error responses

export const apiErrorResponse = (
  status: number,
  options: ErrorBodyOptions = {},
  headers?: Record<string, string>,
): Response => HttpResponse.json(buildErrorBody(options), headers === undefined ? { status } : { status, headers });

export const rateLimitResponse = (retryAfterSeconds = 1, options: { retryAfterHeader?: boolean } = {}): Response =>
  HttpResponse.json(buildRateLimitBody(retryAfterSeconds), {
    status: 429,
    ...(options.retryAfterHeader === false ? {} : { headers: { 'Retry-After': String(retryAfterSeconds) } }),
  });

export const unauthorizedResponse = (): Response =>
  apiErrorResponse(401, { message: 'Failed to parse token.', code: 4100 });

export const failThenSucceed = <P extends ApiPath>(
  path: P,
  times: number,
  failure: () => Response,
  success: OkJson<P>,
): HttpHandler => {
  let calls = 0;
  return mockGet(path, () => {
    calls += 1;
    return calls <= times ? failure() : success;
  });
};

export const createRequestCounter = (): { count: () => number; handler: HttpHandler } => {
  let calls = 0;
  return {
    count: () => calls,
    handler: http.all(`${API_BASE_URL}/*`, () => {
      calls += 1;
      return undefined;
    }),
  };
};

// Happy-path handlers

export const apiHandlers: HttpHandler[] = [
  mockGet('/', () => buildServerStatus()),
  mockGet('/my/agent', () => ({ data: buildAgent() })),
  mockGet('/my/ships', () =>
    buildPage([buildShip(), buildShip({ symbol: `${TEST_SHIP_SYMBOL}-2`, registration: { role: 'SATELLITE' } })]),
  ),
  mockGet('/my/ships/{shipSymbol}', ({ params }) => ({ data: buildShip({ symbol: String(params.shipSymbol) }) })),
  mockGet('/systems', () => buildPage([buildSystem()])),
  mockGet('/systems/{systemSymbol}', ({ params }) => ({ data: buildSystem({ symbol: String(params.systemSymbol) }) })),
  mockGet('/systems/{systemSymbol}/waypoints', () => buildPage([buildWaypoint()])),
  mockGet('/systems/{systemSymbol}/waypoints/{waypointSymbol}', ({ params }) => ({
    data: buildWaypoint({ symbol: String(params.waypointSymbol) }),
  })),
  mockGet('/systems/{systemSymbol}/waypoints/{waypointSymbol}/market', ({ params }) => ({
    data: buildMarket({ symbol: String(params.waypointSymbol) }),
  })),
];
