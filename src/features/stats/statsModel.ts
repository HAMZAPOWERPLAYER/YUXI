import type { DailyStats } from '@/types/kana';
import { addDaysToKey, minutesFromSeconds, recentDayKeys } from '@/utils/date';

export function emptyDailyStats(day: string): DailyStats {
  return { day, xp: 0, secondsActive: 0, questions: 0, correct: 0, goalMet: false };
}

export type RangeSummary = {
  questions: number;
  correct: number;
  secondsActive: number;
  /** 0–1; zero questions reports 0 rather than NaN. */
  accuracy: number;
};

function inRange(day: string, fromDay: string, toDay: string): boolean {
  return day >= fromDay && day <= toDay;
}

/** Aggregates daily rows from `fromDay` through `toDay` inclusive. */
export function summarizeRange(
  stats: readonly DailyStats[],
  fromDay: string,
  toDay: string,
): RangeSummary {
  let questions = 0;
  let correct = 0;
  let secondsActive = 0;
  for (const row of stats) {
    if (!inRange(row.day, fromDay, toDay)) continue;
    questions += Math.max(0, row.questions);
    correct += Math.max(0, row.correct);
    secondsActive += Math.max(0, row.secondsActive);
  }
  return {
    questions,
    correct,
    secondsActive,
    accuracy: questions === 0 ? 0 : Math.min(1, correct / questions),
  };
}

export function accuracyOverDays(
  stats: readonly DailyStats[],
  today: string,
  days: number,
): number {
  const window = Math.max(1, Math.trunc(days));
  return summarizeRange(stats, addDaysToKey(today, -(window - 1)), today).accuracy;
}

export type ActivityDay = {
  day: string;
  secondsActive: number;
  minutes: number;
  /** Bar height relative to the busiest day in the window, 0–1. */
  ratio: number;
  isToday: boolean;
};

/** Minute bars for the stats screen, always oldest → newest. */
export function buildActivitySeries(
  stats: readonly DailyStats[],
  today: string,
  days = 14,
): ActivityDay[] {
  const keys = recentDayKeys(today, days);
  const byDay = new Map(stats.map((row) => [row.day, row]));
  const seconds = keys.map((day) => Math.max(0, byDay.get(day)?.secondsActive ?? 0));
  const max = Math.max(0, ...seconds);

  return keys.map((day, index) => {
    const secondsActive = seconds[index] ?? 0;
    return {
      day,
      secondsActive,
      minutes: minutesFromSeconds(secondsActive),
      ratio: max === 0 ? 0 : secondsActive / max,
      isToday: day === today,
    };
  });
}

export function totalSeconds(stats: readonly DailyStats[]): number {
  return stats.reduce((sum, row) => sum + Math.max(0, row.secondsActive), 0);
}

export function totalQuestions(stats: readonly DailyStats[]): number {
  return stats.reduce((sum, row) => sum + Math.max(0, row.questions), 0);
}

export function hasAnyActivity(stats: readonly DailyStats[]): boolean {
  return stats.some((row) => row.xp > 0 || row.secondsActive > 0 || row.questions > 0);
}
