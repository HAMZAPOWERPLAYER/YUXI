import type { DailyStats } from '@/types/kana';
import { addDaysToKey, compareDayKeys } from '@/utils/date';

/**
 * A day keeps the streak when the goal was met OR at least one session was
 * completed. Session completion is stored separately as meta keys, so callers
 * merge both sources here.
 */
export function collectActiveDays(
  stats: readonly DailyStats[],
  completedSessionDays: readonly string[] = [],
): Set<string> {
  const days = new Set<string>();
  for (const row of stats) {
    if (row.goalMet) days.add(row.day);
  }
  for (const day of completedSessionDays) {
    days.add(day);
  }
  return days;
}

/**
 * Current streak, counting back from today. If today is not active yet, the
 * streak is counted from yesterday so the number does not drop at midnight.
 * Future days (clock moved backwards) are ignored.
 */
export function computeCurrentStreak(today: string, activeDays: Iterable<string>): number {
  const eligible = new Set<string>();
  for (const day of activeDays) {
    if (compareDayKeys(day, today) <= 0) eligible.add(day);
  }

  let cursor = eligible.has(today) ? today : addDaysToKey(today, -1);
  let streak = 0;
  while (eligible.has(cursor)) {
    streak += 1;
    cursor = addDaysToKey(cursor, -1);
  }
  return streak;
}

/** Longest run of consecutive active days, ignoring future days. */
export function computeLongestStreak(today: string, activeDays: Iterable<string>): number {
  const days = [...activeDays]
    .filter((day) => compareDayKeys(day, today) <= 0)
    .sort(compareDayKeys);
  let longest = 0;
  let run = 0;
  let previous: string | null = null;

  for (const day of days) {
    if (previous !== null && addDaysToKey(previous, 1) === day) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    previous = day;
  }
  return longest;
}

export type StreakSummary = {
  current: number;
  longest: number;
  todayActive: boolean;
  /** Longest streak including today, useful for the stats header. */
  totalActiveDays: number;
};

export function summarizeStreak(today: string, activeDays: Iterable<string>): StreakSummary {
  const days = [...activeDays].filter((day) => compareDayKeys(day, today) <= 0);
  return {
    current: computeCurrentStreak(today, days),
    longest: computeLongestStreak(today, days),
    todayActive: days.includes(today),
    totalActiveDays: new Set(days).size,
  };
}

/** Small, local milestones used for an optional celebration. */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365] as const;

export function nextStreakMilestone(current: number): number | null {
  for (const milestone of STREAK_MILESTONES) {
    if (milestone > current) return milestone;
  }
  return null;
}
