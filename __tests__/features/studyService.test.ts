import {
  getAllMeta,
  getAllReviewLog,
  getDailyStats,
  getKanaProgress,
  setMeta,
} from '@/db/repositories';
import { runMigrations } from '@/db/migrations/runner';
import {
  MAX_ACTIVE_SECONDS_PER_TICK,
  SESSION_META_PREFIX,
  completeSession,
  logStudyError,
  readCompletedSessionDays,
  recordAnswer,
  recordStudySeconds,
} from '@/features/study';
import { toLocalDayKey } from '@/utils/date';
import { getLogEntries } from '@/utils/logger';

import { createTestDatabase, type TestDatabase } from '../helpers/testDatabase';

const AT = new Date(2026, 4, 10, 12, 0, 0).getTime();
const DAY = toLocalDayKey(AT);

describe('study service', () => {
  let db: TestDatabase;

  beforeEach(async () => {
    db = await createTestDatabase();
    await runMigrations(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('recordAnswer', () => {
    it('writes progress, review log and daily stats atomically', async () => {
      const result = await recordAnswer(db, {
        activeSeconds: 30,
        at: AT,
        correct: true,
        dailyGoalMinutes: 5,
        kanaId: 'hira-a',
        mode: 'kana-to-romaji',
        responseMs: 900,
      });

      expect(result).toMatchObject({
        day: DAY,
        xpEarned: 10,
        quality: 5,
        secondsActive: 30,
        goalMet: false,
      });

      const progress = await getKanaProgress(db, 'hira-a');
      expect(progress).toMatchObject({
        seen: 1,
        correct: 1,
        wrong: 0,
        streak: 1,
        repetitions: 1,
        intervalDays: 1,
      });
      expect(progress?.dueAt).toBe(AT + 86_400_000);

      const stats = await getDailyStats(db, DAY);
      expect(stats).toMatchObject({
        xp: 10,
        secondsActive: 30,
        questions: 1,
        correct: 1,
        goalMet: false,
      });

      const log = await getAllReviewLog(db);
      expect(log).toHaveLength(1);
      expect(log[0]).toMatchObject({
        kanaId: 'hira-a',
        mode: 'kana-to-romaji',
        correct: true,
        quality: 5,
        responseMs: 900,
      });
    });

    it('schedules a short lapse and lowers ease for a wrong answer', async () => {
      const result = await recordAnswer(db, {
        activeSeconds: 10,
        at: AT,
        correct: false,
        dailyGoalMinutes: 10,
        kanaId: 'hira-i',
        mode: 'romaji-to-kana',
        responseMs: 13_000,
      });

      expect(result.quality).toBe(0);
      expect(result.xpEarned).toBe(2);
      const progress = await getKanaProgress(db, 'hira-i');
      expect(progress).toMatchObject({
        seen: 1,
        correct: 0,
        wrong: 1,
        streak: 0,
        repetitions: 0,
        ease: 2.3,
        lapses: 1,
      });
      expect(progress?.dueAt).toBe(AT + 10 * 60_000);
    });

    it('updates an existing card and accepts a preloaded progress row', async () => {
      const first = await recordAnswer(db, {
        at: AT,
        correct: true,
        dailyGoalMinutes: 10,
        kanaId: 'hira-u',
        mode: 'kana-to-romaji',
        responseMs: 1_000,
      });

      const second = await recordAnswer(db, {
        at: AT + 5_000,
        correct: true,
        currentProgress: first.progress,
        dailyGoalMinutes: 10,
        kanaId: 'hira-u',
        mode: 'kana-to-romaji',
        responseMs: 1_000,
      });

      expect(second.progress).toMatchObject({
        seen: 2,
        correct: 2,
        streak: 2,
        repetitions: 2,
        intervalDays: 3,
      });
      const stats = await getDailyStats(db, DAY);
      expect(stats).toMatchObject({ xp: 20, questions: 2, correct: 2 });
      expect(await getAllReviewLog(db)).toHaveLength(2);
    });

    it('clamps per-answer active seconds and marks the goal once reached', async () => {
      const first = await recordAnswer(db, {
        activeSeconds: 500,
        at: AT,
        correct: true,
        dailyGoalMinutes: 5,
        kanaId: 'hira-e',
        mode: 'kana-to-romaji',
        responseMs: 1_000,
      });
      expect(first.secondsActive).toBe(MAX_ACTIVE_SECONDS_PER_TICK);

      await recordStudySeconds(db, { at: AT, dailyGoalMinutes: 5, seconds: 120 });
      await recordStudySeconds(db, { at: AT, dailyGoalMinutes: 5, seconds: 120 });
      const final = await recordStudySeconds(db, {
        at: AT,
        dailyGoalMinutes: 5,
        seconds: 60,
      });

      expect(final.goalMet).toBe(true);
      expect((await getDailyStats(db, DAY))?.goalMet).toBe(true);
    });

    it('normalizes invalid timing input to zero', async () => {
      const result = await recordAnswer(db, {
        activeSeconds: Number.NaN,
        at: AT,
        correct: true,
        dailyGoalMinutes: 10,
        kanaId: 'hira-o',
        mode: 'kana-to-romaji',
        responseMs: Number.NaN,
      });
      expect(result.secondsActive).toBe(0);
      expect(result.quality).toBe(5);
      const progress = await getKanaProgress(db, 'hira-o');
      expect(progress?.dueAt).toBe(AT + 86_400_000);
    });
  });

  describe('completeSession', () => {
    it('stores the completed-session marker and awards bonus XP', async () => {
      const result = await completeSession(db, {
        at: AT,
        dailyGoalMinutes: 5,
        questionCount: 10,
      });

      expect(result).toEqual({ day: DAY, bonusXp: 20 });
      const meta = await getAllMeta(db);
      expect(meta[`${SESSION_META_PREFIX}${DAY}`]).toBe('1');
      expect(await getDailyStats(db, DAY)).toMatchObject({
        xp: 20,
        questions: 0,
        secondsActive: 0,
      });
      expect(readCompletedSessionDays(meta)).toEqual([DAY]);
    });

    it('writes the marker without XP for an empty session', async () => {
      const result = await completeSession(db, {
        at: AT,
        dailyGoalMinutes: 10,
        questionCount: 0,
      });
      expect(result.bonusXp).toBe(0);
      expect(await getDailyStats(db, DAY)).toBeNull();
      expect((await getAllMeta(db))[`${SESSION_META_PREFIX}${DAY}`]).toBe('1');
    });
  });

  describe('recordStudySeconds', () => {
    it('does nothing for zero or negative time', async () => {
      const result = await recordStudySeconds(db, {
        at: AT,
        dailyGoalMinutes: 5,
        seconds: -20,
      });
      expect(result).toEqual({ day: DAY, secondsAdded: 0, goalMet: false });
      expect(await getDailyStats(db, DAY)).toBeNull();
    });

    it('reports an already-met goal when asked to add nothing', async () => {
      await setMeta(db, 'unrelated', 'value');
      await recordStudySeconds(db, { at: AT, dailyGoalMinutes: 5, seconds: 120 });
      await recordStudySeconds(db, { at: AT, dailyGoalMinutes: 5, seconds: 120 });
      await recordStudySeconds(db, { at: AT, dailyGoalMinutes: 5, seconds: 120 });

      const result = await recordStudySeconds(db, {
        at: AT,
        dailyGoalMinutes: 5,
        seconds: 0,
      });
      expect(result).toEqual({ day: DAY, secondsAdded: 0, goalMet: true });
    });
  });

  describe('readCompletedSessionDays', () => {
    it('ignores disabled, null and corrupt markers and sorts the rest', () => {
      const meta = {
        [`${SESSION_META_PREFIX}2026-05-11`]: '1',
        [`${SESSION_META_PREFIX}2026-05-09`]: '1',
        [`${SESSION_META_PREFIX}2026-05-10`]: '0',
        [`${SESSION_META_PREFIX}2026-02-31`]: '1',
        [`${SESSION_META_PREFIX}not-a-day`]: '1',
        [`${SESSION_META_PREFIX}2026-05-08`]: null,
        other: '1',
      };
      expect(readCompletedSessionDays(meta)).toEqual(['2026-05-09', '2026-05-11']);
    });
  });

  it('logs persistence failures locally', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const before = getLogEntries().length;
    logStudyError('unit test', new Error('disk full'));
    const entries = getLogEntries();
    expect(entries.length).toBe(before + 1);
    expect(entries.at(-1)).toMatchObject({ level: 'error' });
    consoleError.mockRestore();
  });
});
