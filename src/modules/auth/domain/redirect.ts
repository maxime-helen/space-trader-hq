export const DEFAULT_REDIRECT = '/';

export const LOGIN_PATH = '/login';

const CONTROL_CHARACTER = /[\u0000-\u001F\u007F]/;

export const isInternalPath = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length === 0) return false;
  if (!value.startsWith('/')) return false;
  if (value.startsWith('//') || value.startsWith('/\\')) return false;
  return !CONTROL_CHARACTER.test(value);
};

export const safeRedirect = (value: unknown, fallback: string = DEFAULT_REDIRECT): string => {
  if (!isInternalPath(value)) return fallback;
  if (isLoginPath(value)) return fallback;
  return value;
};

export const isLoginPath = (path: string): boolean =>
  path === LOGIN_PATH || path.startsWith(`${LOGIN_PATH}?`) || path.startsWith(`${LOGIN_PATH}/`);

export type LoginReason = 'expired';

type LoginPathOptions = {
  reason?: LoginReason;
  redirect?: string;
};

export const loginPath = (options: LoginPathOptions = {}): string => {
  const params = new URLSearchParams();
  if (options.reason !== undefined) params.set('reason', options.reason);
  if (options.redirect !== undefined && isInternalPath(options.redirect) && !isLoginPath(options.redirect)) {
    params.set('redirect', options.redirect);
  }
  const query = params.toString().replace(/%2F/g, '/');
  return query.length === 0 ? LOGIN_PATH : `${LOGIN_PATH}?${query}`;
};
