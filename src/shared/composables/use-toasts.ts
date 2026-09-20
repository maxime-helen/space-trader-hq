import { computed, type ComputedRef, ref } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

export const MAX_TOASTS = 3;

export const TOAST_DURATION_MS = 6000;

export type ToastBadgeVariant = 'docked' | 'orbit' | 'transit' | 'neutral' | 'danger' | 'positive';

type ToastAction = {
  label: string;
  to: RouteLocationRaw;
};

export type ToastInput = {
  badge?: string;
  badgeVariant?: ToastBadgeVariant;
  subject?: string;
  message: string;
  action?: ToastAction;
  durationMs?: number;
};

type Toast = ToastInput & { id: string };

type ToastQueue = {
  toasts: ComputedRef<Toast[]>;
  push: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

const items = ref<Toast[]>([]);
const timers = new Map<string, ReturnType<typeof setTimeout>>();

let sequence = 0;

const nextId = (): string => {
  sequence += 1;
  return `toast-${String(sequence)}`;
};

const forget = (id: string): void => {
  const timer = timers.get(id);
  if (timer !== undefined) clearTimeout(timer);
  timers.delete(id);
};

const remove = (id: string): void => {
  forget(id);
  items.value = items.value.filter((toast) => toast.id !== id);
};

// A duration of 0 or less means the toast stays until it is dismissed.
const startTimer = (id: string, durationMs: number): void => {
  if (durationMs <= 0) return;
  timers.set(
    id,
    setTimeout(() => {
      remove(id);
    }, durationMs),
  );
};

const toasts = computed<Toast[]>(() => items.value);

const push = (input: ToastInput): string => {
  const toast: Toast = { ...input, id: nextId() };
  const next = [toast, ...items.value];
  for (const dropped of next.splice(MAX_TOASTS)) forget(dropped.id);
  items.value = next;
  startTimer(toast.id, input.durationMs ?? TOAST_DURATION_MS);
  return toast.id;
};

const dismiss = (id: string): void => {
  remove(id);
};

const clear = (): void => {
  for (const toast of items.value) forget(toast.id);
  items.value = [];
};

const queue: ToastQueue = { toasts, push, dismiss, clear };

export const useToasts = (): ToastQueue => queue;
