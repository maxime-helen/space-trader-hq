const BEARER_PREFIX = /^bearer\s+/i;

const WHITESPACE = /\s+/g;

const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export const normalizeToken = (raw: string): string => raw.trim().replace(BEARER_PREFIX, '').replace(WHITESPACE, '');

export const looksLikeJwt = (token: string): boolean => JWT_SHAPE.test(token);
