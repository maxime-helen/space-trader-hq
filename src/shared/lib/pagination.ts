import type { Meta } from '@/shared/api/types';

export const FIRST_PAGE = 1;

// The page a `?page=` query names, or the first page for anything that is not one.
export const parsePageParam = (value: unknown): number => {
  const first: unknown = Array.isArray(value) ? value[0] : value;
  if (typeof first !== 'string' && typeof first !== 'number') return FIRST_PAGE;
  const parsed = Number(first);
  return Number.isInteger(parsed) && parsed >= FIRST_PAGE ? parsed : FIRST_PAGE;
};

export const pageCount = (meta: Meta | undefined): number => {
  if (meta === undefined || meta.limit <= 0) return FIRST_PAGE;
  return Math.max(FIRST_PAGE, Math.ceil(meta.total / meta.limit));
};

// A requested page kept inside [1, pageCount]; trusted as-is until a response says how many pages there are.
export const clampPage = (page: number, meta?: Meta): number => {
  const requested = Number.isFinite(page) ? Math.trunc(page) : FIRST_PAGE;
  if (requested < FIRST_PAGE) return FIRST_PAGE;
  return meta === undefined ? requested : Math.min(requested, pageCount(meta));
};
