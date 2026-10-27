import {
  accuracyOverDays,
  buildActivitySeries,
  emptyDailyStats,
  hasAnyActivity,
  summarizeRange,
  totalQuestions,
  totalSeconds,
} from '@/features/stats';
import type { DailyStats } from '@/types/kana';

function stats(day: string, overrides: Partial<DailyStats> = {}): DailyStats {
  return {
    day,
    xp: 0,
    secondsActive: 0,
    questions: 0,
    correct: 0,
    goalMet: false,
    ...overrides,
  };
}

describe('stats model', () => {
  it('creates neutral rows for a day', () => {
    expect(emptyDailyStats('2026-01-02')).toEqual({
      day: '2026-01-02',
      xp: 0,
      secondsActive: 0,
      questions: 0,
      correct: 0,
      goalMet: false,
    });
  });

  it('summarizes an inclusive range and clamps negative counters', () => {
    const rows = [
      stats('2026-01-01', { questions: 4, correct: 3, secondsActive: 120 }),
      stats('2026-01-02', { questions: 2, correct: 2, secondsActive: 60 }),
      stats('2026-01-03', { questions: 10, correct: 10, secondsActive: 600 }),
      stats('2026-01-04', { questions: -5, correct: -2, secondsActive: -10 }),
    ];

    expect(summarizeRange(rows, '2026-01-01', '2026-01-03')).toEqual({
      questions: 16,
      correct: 15,
      secondsActive: 780,
      accuracy: 15 / 16,
    });
    expect(summarizeRange(rows, '2026-01-04', '2026-01-04')).toEqual({
      questions: 0,
      correct: 0,
      secondsActive: 0,
      accuracy: 0,
    });
  });

  it('caps accuracy at one for corrupt rows', () => {
    const rows = [stats('2026-01-05', { questions: 2, correct: 9 })];
    expect(summarizeRange(rows, '2026-01-01', '2026-01-31').accuracy).toBe(1);
  });

  it('computes accuracy over a rolling window including today', () => {
    const rows = [
      stats('2026-01-01', { questions: 10, correct: 1 }),
      stats('2026-01-06', { questions: 2, correct: 2 }),
      stats('2026-01-07', { questions: 2, correct: 0 }),
    ];
    expect(accuracyOverDays(rows, '2026-01-07', 2)).toBe(0.5);
    expect(accuracyOverDays(rows, '2026-01-07', 7)).toBe(3 / 14);
    expect(accuracyOverDays(rows, '2026-01-07', 0)).toBe(0);
  });

  it('builds a fixed-length activity series oldest to newest', () => {
    const rows = [
      stats('2026-01-06', { secondsActive: 60 }),
      stats('2026-01-07', { secondsActive: 180 }),
      stats('2026-01-05', { secondsActive: -20 }),
    ];
    const series = buildActivitySeries(rows, '2026-01-07', 3);

    expect(series.map((day) => day.day)).toEqual(['2026-01-05', '2026-01-06', '2026-01-07']);
    expect(series.map((day) => day.secondsActive)).toEqual([0, 60, 180]);
    expect(series.map((day) => day.minutes)).toEqual([0, 1, 3]);
    expect(series.map((day) => day.ratio)).toEqual([0, 1 / 3, 1]);
    expect(series.map((day) => day.isToday)).toEqual([false, false, true]);
  });

  it('returns zero ratios for an empty window', () => {
    const series = buildActivitySeries([], '2026-01-07', 4);
    expect(series).toHaveLength(4);
    expect(series.every((day) => day.ratio === 0 && day.secondsActive === 0)).toBe(true);
  });

  it('aggregates totals and detects activity', () => {
    const rows = [
      stats('2026-01-01', { secondsActive: 120, questions: 4 }),
      stats('2026-01-02', { secondsActive: 60, questions: 2, xp: 20 }),
      stats('2026-01-03', { secondsActive: -5, questions: -1 }),
    ];
    expect(totalSeconds(rows)).toBe(180);
    expect(totalQuestions(rows)).toBe(6);
    expect(hasAnyActivity(rows)).toBe(true);
    expect(hasAnyActivity([stats('2026-01-04')])).toBe(false);
  });
});
