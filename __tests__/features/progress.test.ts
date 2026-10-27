import {
  STREAK_MILESTONES,
  XP_PER_CORRECT,
  XP_PER_LEVEL,
  XP_PER_WRONG,
  XP_SESSION_BONUS,
  addActiveSeconds,
  addXp,
  collectActiveDays,
  computeCurrentStreak,
  computeLongestStreak,
  getDailyGoalProgress,
  isGoalMet,
  levelForXp,
  nextStreakMilestone,
  resolveGoalMet,
  safeSeconds,
  summarizeStreak,
  xpForAnswer,
  xpForCompletedSession,
} from '@/features/progress';
import type { DailyStats } from '@/types/kana';

function stats(day: string, goalMet: boolean): DailyStats {
  return { day, xp: 0, secondsActive: 0, questions: 0, correct: 0, goalMet };
}

describe('XP', () => {
  it('awards effort XP for every answer', () => {
    expect(xpForAnswer(true)).toBe(XP_PER_CORRECT);
    expect(xpForAnswer(false)).toBe(XP_PER_WRONG);
    expect(XP_PER_CORRECT).toBe(10);
    expect(XP_PER_WRONG).toBe(2);
  });

  it('only grants a completion bonus for a non-empty session', () => {
    expect(xpForCompletedSession(0)).toBe(0);
    expect(xpForCompletedSession(10)).toBe(XP_SESSION_BONUS);
  });

  it('maps total XP to a level with progress toward the next one', () => {
    expect(levelForXp(0)).toEqual({
      level: 1,
      xpIntoLevel: 0,
      xpForNextLevel: XP_PER_LEVEL,
      progress: 0,
      totalXp: 0,
    });
    expect(levelForXp(199).level).toBe(1);
    expect(levelForXp(200).level).toBe(2);
    const mid = levelForXp(350);
    expect(mid.level).toBe(2);
    expect(mid.xpIntoLevel).toBe(150);
    expect(mid.progress).toBeCloseTo(0.75, 5);
  });

  it('guards against negative and invalid XP', () => {
    expect(levelForXp(-100).totalXp).toBe(0);
    expect(levelForXp(Number.NaN).totalXp).toBe(0);
    expect(addXp(10, 5)).toBe(15);
    expect(addXp(10, -5)).toBe(10);
    expect(addXp(10, Number.NaN)).toBe(10);
    expect(addXp(-10, 5)).toBe(5);
  });
});

describe('daily goal', () => {
  it('reports progress, remaining time and met state', () => {
    expect(getDailyGoalProgress(0, 10)).toEqual({
      secondsActive: 0,
      goalSeconds: 600,
      ratio: 0,
      remainingSeconds: 600,
      met: false,
    });
    expect(getDailyGoalProgress(300, 10)).toMatchObject({
      ratio: 0.5,
      remainingSeconds: 300,
      met: false,
    });
    expect(getDailyGoalProgress(900, 10)).toMatchObject({
      ratio: 1,
      remainingSeconds: 0,
      met: true,
    });
  });

  it('compares whole seconds against the goal', () => {
    expect(isGoalMet(299, 5)).toBe(false);
    expect(isGoalMet(300, 5)).toBe(true);
    expect(isGoalMet(599, 10)).toBe(false);
    expect(isGoalMet(600, 10)).toBe(true);
  });

  it('sanitizes seconds', () => {
    expect(safeSeconds(-10)).toBe(0);
    expect(safeSeconds(Number.NaN)).toBe(0);
    expect(safeSeconds(12.9)).toBe(12);
  });

  it('adds elapsed time with a cap and ignores backwards time', () => {
    expect(addActiveSeconds(10, 5_000)).toBe(15);
    expect(addActiveSeconds(10, 5_000, 2_000)).toBe(12);
    expect(addActiveSeconds(10, -5_000)).toBe(10);
    expect(addActiveSeconds(10, Number.NaN)).toBe(10);
    expect(addActiveSeconds(-4, 1_000)).toBe(1);
  });

  it('keeps goal_met sticky once it is set for the day', () => {
    expect(resolveGoalMet(false, 600, 10)).toBe(true);
    expect(resolveGoalMet(true, 0, 10)).toBe(true);
    expect(resolveGoalMet(false, 60, 10)).toBe(false);
  });
});

describe('streak', () => {
  it('counts consecutive active days up to today', () => {
    const days = new Set(['2026-05-18', '2026-05-19', '2026-05-20']);
    expect(computeCurrentStreak('2026-05-20', days)).toBe(3);
  });

  it('keeps yesterday’s streak alive when today is not active yet', () => {
    const days = new Set(['2026-05-18', '2026-05-19']);
    expect(computeCurrentStreak('2026-05-20', days)).toBe(2);
  });

  it('breaks on a gap', () => {
    const days = new Set(['2026-05-15', '2026-05-16', '2026-05-19']);
    expect(computeCurrentStreak('2026-05-20', days)).toBe(1);
    expect(computeCurrentStreak('2026-05-20', new Set())).toBe(0);
    expect(computeCurrentStreak('2026-05-20', new Set(['2026-05-01']))).toBe(0);
  });

  it('ignores future days caused by a clock moved backwards', () => {
    const days = new Set(['2026-05-20', '2026-05-21', '2026-05-22']);
    expect(computeCurrentStreak('2026-05-20', days)).toBe(1);
    expect(computeCurrentStreak('2026-05-19', days)).toBe(0);
  });

  it('finds the longest run across month and year boundaries', () => {
    const days = [
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-04',
      '2027-01-05',
      '2027-01-06',
      '2027-01-07',
    ];
    expect(computeLongestStreak('2027-01-10', days)).toBe(4);
    expect(computeLongestStreak('2027-01-10', [])).toBe(0);
    expect(computeLongestStreak('2027-01-10', ['2027-02-01'])).toBe(0);
  });

  it('deduplicates days and summarizes the streak', () => {
    const days = ['2026-05-18', '2026-05-18', '2026-05-19', '2026-05-20'];
    expect(summarizeStreak('2026-05-20', days)).toEqual({
      current: 3,
      longest: 3,
      todayActive: true,
      totalActiveDays: 3,
    });
    expect(summarizeStreak('2026-05-21', days)).toMatchObject({
      current: 3,
      todayActive: false,
    });
  });

  it('merges goal-met days with completed session days', () => {
    const rows = [stats('2026-05-18', true), stats('2026-05-19', false)];
    const active = collectActiveDays(rows, ['2026-05-19', '2026-05-20']);
    expect([...active].sort()).toEqual(['2026-05-18', '2026-05-19', '2026-05-20']);
    expect(collectActiveDays([])).toEqual(new Set());
  });

  it('reports the next milestone', () => {
    expect(nextStreakMilestone(0)).toBe(STREAK_MILESTONES[0]);
    expect(nextStreakMilestone(2)).toBe(3);
    expect(nextStreakMilestone(3)).toBe(7);
    expect(nextStreakMilestone(365)).toBeNull();
  });
});
