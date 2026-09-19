import { describe, expect, it } from 'vitest';

import { looksLikeJwt, normalizeToken } from '@/modules/auth/domain/token';

const TOKEN = 'eyJhbGciOiJSUzI1NiJ9.eyJpZGVudGlmaWVyIjoiQUxJQ0UifQ.c2lnbmF0dXJlLXNlZ21lbnQ';

describe('normalizeToken', () => {
  it('strips surrounding whitespace, line breaks and a leading Bearer prefix', () => {
    expect(normalizeToken(`  ${TOKEN}  `)).toBe(TOKEN);
    expect(normalizeToken(`\n${TOKEN}\n`)).toBe(TOKEN);
    expect(normalizeToken(`Bearer ${TOKEN}`)).toBe(TOKEN);
    expect(normalizeToken(`  Bearer\n${TOKEN}  `)).toBe(TOKEN);
  });

  it('rejoins a token broken across lines by a terminal or a mail client', () => {
    const wrapped = `${TOKEN.slice(0, 20)}\n${TOKEN.slice(20, 40)}\r\n  ${TOKEN.slice(40)}`;

    expect(normalizeToken(wrapped)).toBe(TOKEN);
  });

  it('matches the Bearer prefix whatever its case, and only at the start', () => {
    expect(normalizeToken(`bearer ${TOKEN}`)).toBe(TOKEN);
    expect(normalizeToken(`BEARER ${TOKEN}`)).toBe(TOKEN);
    // "bearer" inside the token is data, not a prefix.
    expect(normalizeToken('a.bearer b.c')).toBe('a.bearerb.c');
  });

  it('leaves an already clean token untouched, and empties a blank paste', () => {
    expect(normalizeToken(TOKEN)).toBe(TOKEN);
    expect(normalizeToken('   \n\t ')).toBe('');
  });
});

describe('looksLikeJwt', () => {
  it('accepts three non-empty base64url segments', () => {
    expect(looksLikeJwt(TOKEN)).toBe(true);
    expect(looksLikeJwt('a-b_c.d-e_f.g-h_i')).toBe(true);
  });

  it('rejects everything that cannot be a token', () => {
    const rejected = [
      '',
      'ALICE', // an agent symbol, the most likely wrong paste
      'not.a', // two segments
      'a.b.c.d', // four
      '.b.c', // empty segment
      'a.b.', // empty signature
      'a b.c.d', // whitespace survived
      'Bearer a.b.c', // not normalized first
      'a.b.c=', // base64 padding is not base64url
    ];

    for (const value of rejected) expect(looksLikeJwt(value)).toBe(false);
  });
});
