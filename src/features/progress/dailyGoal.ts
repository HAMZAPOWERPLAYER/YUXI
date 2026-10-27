import type { DailyGoalMinutes } from '@/features/settings/settingsModel';

export const SECONDS_PER_MINUTE = 60;

export type DailyGoalProgress = {
  secondsActive: number;
  goalSeconds: number;
  ratio: number;
  remainingSeconds: number;
  met: boolean;
};

/** Clamps session seconds to a sensible value and drops clock-backwards input. */
export function safeSeconds(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return Math.floor(seconds);
}

export function isGoalMet(secondsActive: number, goalMinutes: DailyGoalMinutes): boolean {
  return safeSeconds(secondsActive) >= goalMinutes * SECONDS_PER_MINUTE;
}

export function getDailyGoalProgress(
  secondsActive: number,
  goalMinutes: DailyGoalMinutes,
): DailyGoalProgress {
  const seconds = safeSeconds(secondsActive);
  const goalSeconds = Math.max(1, goalMinutes * SECONDS_PER_MINUTE);
  return {
    secondsActive: seconds,
    goalSeconds,
    ratio: Math.min(1, seconds / goalSeconds),
    remainingSeconds: Math.max(0, goalSeconds - seconds),
    met: seconds >= goalSeconds,
  };
}

/**
 * Adds active time between two ticks. The cap prevents a backgrounded app or a
 * device clock jump from crediting hours of study at once.
 */
export function addActiveSeconds(
  currentSeconds: number,
  elapsedMs: number,
  maxTickMs = 30_000,
): number {
  const base = safeSeconds(currentSeconds);
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return base;
  const cappedMs = Math.min(elapsedMs, Math.max(0, maxTickMs));
  return base + Math.round(cappedMs / 1000);
}

/**
 * Compares the persisted goal flag with a freshly computed one. goal_met is
 * sticky for the day, so a later edit of the goal cannot take it away.
 */
export function resolveGoalMet(
  storedGoalMet: boolean,
  secondsActive: number,
  goalMinutes: DailyGoalMinutes,
): boolean {
  return storedGoalMet || isGoalMet(secondsActive, goalMinutes);
}
