import { describe, expect, it } from 'vitest';

import { ApiError, isApiError, readErrorMessage, retryAfterMs, toApiError, toNetworkError } from '@/shared/api/errors';

import { buildErrorBody } from './fixtures';

const jsonResponse = (status: number, body: unknown, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

describe('readErrorMessage', () => {
  it('reads the documented { error: { message } } envelope', async () => {
    expect(await readErrorMessage(jsonResponse(404, buildErrorBody({ message: 'Ship not found.' })))).toBe(
      'Ship not found.',
    );
  });

  it('accepts a bare { message } body, which some proxies return', async () => {
    expect(await readErrorMessage(jsonResponse(502, { message: 'Bad gateway.' }))).toBe('Bad gateway.');
  });

  it.each([
    ['an HTML page', new Response('<html>502</html>', { status: 502 })],
    ['an empty body', new Response(null, { status: 500 })],
    ['a JSON string', jsonResponse(500, 'nope')],
    ['an envelope without a message', jsonResponse(500, { error: { code: 5000 } })],
  ])('reads nothing from %s', async (_label, response) => {
    expect(await readErrorMessage(response)).toBeUndefined();
  });
});

describe('retryAfterMs', () => {
  it('reads Retry-After in delta-seconds', () => {
    expect(retryAfterMs(new Headers({ 'Retry-After': '2' }))).toBe(2000);
    expect(retryAfterMs(new Headers({ 'Retry-After': '0.5' }))).toBe(500);
  });

  it.each([
    ['absent', {}],
    ['blank', { 'Retry-After': ' ' }],
    ['negative', { 'Retry-After': '-5' }],
    ['a date', { 'Retry-After': 'Wed, 21 Oct 2026 07:28:00 GMT' }],
  ])('reads nothing from a header that is %s', (_label, headers) => {
    expect(retryAfterMs(new Headers(headers))).toBeUndefined();
  });
});

describe('ApiError', () => {
  it('classifies by status and uses the server message', () => {
    const error = new ApiError({ status: 404, message: 'Ship not found.' });

    expect(error.status).toBe(404);
    expect(error.kind).toBe('not-found');
    expect(error.message).toBe('Ship not found.');
    expect(error.name).toBe('ApiError');
  });

  it.each([
    [404, 'not-found'],
    [500, 'server'],
    [503, 'server'],
    [400, 'other'],
    [401, 'other'],
    [409, 'other'],
    [429, 'other'],
  ])('files a %i as %s', (status, kind) => {
    expect(new ApiError({ status }).kind).toBe(kind);
  });

  it('falls back to readable copy when the server sent no message', () => {
    expect(new ApiError({ status: 503 }).message).toBe('The SpaceTraders API returned an error without saying why.');
  });

  it('marks 5xx and network failures retryable, and dead tokens not', () => {
    expect(new ApiError({ status: 503 }).isRetryable).toBe(true);
    expect(new ApiError({ status: 0, kind: 'network' }).isRetryable).toBe(true);
    expect(new ApiError({ status: 401 }).isRetryable).toBe(false);
    expect(new ApiError({ status: 404 }).isRetryable).toBe(false);
  });

  it('is recognizable across the app', () => {
    expect(isApiError(new ApiError({ status: 500 }))).toBe(true);
    expect(isApiError(new Error('plain'))).toBe(false);
    expect(isApiError(undefined)).toBe(false);
  });
});

describe('toApiError and toNetworkError', () => {
  it('normalizes a JSON error envelope', async () => {
    const error = await toApiError(jsonResponse(409, buildErrorBody({ message: 'Ship is in transit.' })));

    expect(error.kind).toBe('other');
    expect(error.message).toBe('Ship is in transit.');
  });

  it('survives a body that is not JSON at all', async () => {
    const error = await toApiError(new Response('<html>502</html>', { status: 502 }));

    expect(error.kind).toBe('server');
    expect(error.message).toBe('The SpaceTraders API returned an error without saying why.');
  });

  it('turns a transport failure into a network error with friendly copy', () => {
    const error = toNetworkError();

    expect(error.status).toBe(0);
    expect(error.kind).toBe('network');
    expect(error.message).toBe('Could not reach the SpaceTraders API. Check your connection.');
  });
});
