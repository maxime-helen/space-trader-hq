import { formatResetCountdown, isElapsed, type TimeInput } from '@/shared/lib/format';

type ResetCountdown = {
  label: string;
  reached: boolean;
};

export const resetCountdown = (next: TimeInput, now: number): ResetCountdown => ({
  label: formatResetCountdown(next, now),
  reached: isElapsed(next, now),
});

export const isServerOnline = (status: string): boolean => /\bonline\b/i.test(status);

export const resetFrequencyLabel = (frequency: string): string => `Resets ${frequency.toLowerCase()}`;
