import { describe, expect, it } from 'vitest';

import { isInternalPath, isLoginPath, loginPath, safeRedirect } from '@/modules/auth/domain/redirect';

describe('isInternalPath', () => {
  it('accepts a path that starts with exactly one slash', () => {
    expect(isInternalPath('/')).toBe(true);
    expect(isInternalPath('/fleet')).toBe(true);
    expect(isInternalPath('/systems/X1-AB12?page=2')).toBe(true);
  });

  it('rejects anything that could leave the app', () => {
    const external = [
      'https://evil.example',
      '//evil.example', // protocol-relative
      '/\\evil.example', // browsers read this as protocol-relative too
      'javascript:alert(1)',
      'fleet', // relative, would resolve against the current page
      '',
      undefined,
      null,
      42,
      ['/fleet'], // a repeated query parameter arrives as an array
    ];

    for (const value of external) expect(isInternalPath(value)).toBe(false);
  });

  it('rejects a path carrying a control character', () => {
    expect(isInternalPath('/fleet\n')).toBe(false);
    expect(isInternalPath('/fleet\t')).toBe(false);
  });
});

describe('safeRedirect', () => {
  it('returns the requested internal path', () => {
    expect(safeRedirect('/fleet/ALICE-1')).toBe('/fleet/ALICE-1');
  });

  it('falls back to the agent page for an external value', () => {
    expect(safeRedirect('https://evil.example')).toBe('/');
    expect(safeRedirect('//evil.example')).toBe('/');
    expect(safeRedirect(undefined)).toBe('/');
  });

  it('never redirects back to the login page, which would loop', () => {
    expect(safeRedirect('/login')).toBe('/');
    expect(safeRedirect('/login?reason=expired')).toBe('/');
    expect(isLoginPath('/logout')).toBe(false);
  });

  it('takes the fallback it is given', () => {
    expect(safeRedirect('https://evil.example', '/fleet')).toBe('/fleet');
  });
});

describe('loginPath', () => {
  it('builds the expiry target: reason first, then the path to come back to', () => {
    expect(loginPath({ reason: 'expired', redirect: '/fleet' })).toBe('/login?reason=expired&redirect=/fleet');
  });

  it('drops a redirect that is not an internal path', () => {
    expect(loginPath({ reason: 'expired', redirect: 'https://evil.example' })).toBe('/login?reason=expired');
    expect(loginPath({ redirect: '/login?reason=expired' })).toBe('/login');
  });

  it('is the bare path when nothing is asked for, as on sign-out', () => {
    expect(loginPath()).toBe('/login');
  });

  it('encodes a query string inside the redirect, but leaves its slashes readable', () => {
    expect(loginPath({ redirect: '/systems/X1-AB12?page=2&type=PLANET' })).toBe(
      '/login?redirect=/systems/X1-AB12%3Fpage%3D2%26type%3DPLANET',
    );
  });
});
