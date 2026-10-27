import {
  addDailyActivity,
  clearDailyStats,
  clearKanaProgress,
  clearMeta,
  clearReviewLog,
  clearSettings,
  countDueKanaProgress,
  countKanaProgress,
  countReviewLogBetween,
  deleteMeta,
  getAllDailyStats,
  getAllKanaProgress,
  getAllMeta,
  getAllReviewLog,
  getDailyStats,
  getDailyStatsRange,
  getDueKanaProgress,
  getKanaProgress,
  getMeta,
  getRecentReviewLog,
  getReviewLogBetween,
  getSettings,
  getTotalSeconds,
  getTotalXp,
  insertReviewLog,
  resetAllData,
  saveDailyStats,
  saveKanaProgress,
  saveManyKanaProgress,
  setMeta,
  updateSettings,
} from '@/db/repositories';
import { runMigrations } from '@/db/migrations/runner';
import type { DailyStats, KanaProgress } from '@/types/kana';

import { createTestDatabase, type TestDatabase } from '../helpers/testDatabase';

function makeProgress(kanaId: string, overrides: Partial<KanaProgress> = {}): KanaProgress {
  return {
    kanaId,
    seen: 1,
    correct: 1,
    wrong: 0,
    streak: 1,
    ease: 2.5,
    intervalDays: 1,
    repetitions: 1,
    dueAt: 1_000,
    lastSeenAt: 500,
    firstSeenAt: 400,
    lapses: 0,
    ...overrides,
  };
}

describe('repositories', () => {
  let db: TestDatabase;

  beforeEach(async () => {
    db = await createTestDatabase();
    await runMigrations(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('settings', () => {
    it('returns defaults when nothing is stored', async () => {
      const settings = await getSettings(db);
      expect(settings.language).toBe('ur');
      expect(settings.dailyGoalMinutes).toBe(10);
      expect(settings.onboardingDone).toBe(false);
    });

    it('supports a device-language override on first run', async () => {
      const settings = await getSettings(db, { language: 'en' });
      expect(settings.language).toBe('en');
    });

    it('updates only the supplied fields and persists them', async () => {
      await updateSettings(db, { language: 'en', dailyGoalMinutes: 20 });
      const afterGoal = await updateSettings(db, { dailyGoalMinutes: 5 });
      expect(afterGoal.language).toBe('en');
      expect(afterGoal.dailyGoalMinutes).toBe(5);
      expect(afterGoal.hapticsEnabled).toBe(true);

      await expect(getSettings(db)).resolves.toMatchObject({
        language: 'en',
        dailyGoalMinutes: 5,
      });
    });

    it('can clear all settings', async () => {
      await updateSettings(db, { language: 'en', hapticsEnabled: false });
      await clearSettings(db);
      await expect(getSettings(db)).resolves.toMatchObject({
        language: 'ur',
        hapticsEnabled: true,
      });
    });

    it('ignores corrupt stored values', async () => {
      await db.runAsync(
        `INSERT INTO kv_settings (key, value) VALUES (?, ?), (?, ?), (?, ?)`,
        'language',
        'klingon',
        'textScale',
        'huge',
        'dailyGoalMinutes',
        '999',
      );
      const settings = await getSettings(db);
      expect(settings.language).toBe('ur');
      expect(settings.textScale).toBe(1);
      expect(settings.dailyGoalMinutes).toBe(10);
    });
  });

  describe('meta', () => {
    it('writes, reads and overwrites values', async () => {
      await setMeta(db, 'firstRunAt', '100');
      await expect(getMeta(db, 'firstRunAt')).resolves.toBe('100');
      await setMeta(db, 'firstRunAt', '200');
      await expect(getMeta(db, 'firstRunAt')).resolves.toBe('200');
      await expect(getMeta(db, 'missing')).resolves.toBeNull();
    });

    it('lists, deletes and clears meta rows', async () => {
      await setMeta(db, 'a', '1');
      await setMeta(db, 'b', null);
      await expect(getAllMeta(db)).resolves.toEqual({ a: '1', b: null });

      await deleteMeta(db, 'a');
      await expect(getAllMeta(db)).resolves.toEqual({ b: null });

      await clearMeta(db);
      await expect(getAllMeta(db)).resolves.toEqual({});
    });
  });

  describe('kana progress', () => {
    it('round-trips a progress row', async () => {
      await saveKanaProgress(db, makeProgress('hiragana-a'));
      const loaded = await getKanaProgress(db, 'hiragana-a');
      expect(loaded).toEqual(makeProgress('hiragana-a'));
      await expect(getKanaProgress(db, 'missing')).resolves.toBeNull();
    });

    it('updates stats but preserves the first-seen timestamp', async () => {
      await saveKanaProgress(db, makeProgress('hiragana-a'));
      await saveKanaProgress(
        db,
        makeProgress('hiragana-a', { seen: 5, correct: 4, firstSeenAt: 0, dueAt: 9_000 }),
      );
      const loaded = await getKanaProgress(db, 'hiragana-a');
      expect(loaded?.seen).toBe(5);
      expect(loaded?.correct).toBe(4);
      expect(loaded?.firstSeenAt).toBe(400);
      expect(loaded?.dueAt).toBe(9_000);
    });

    it('returns due items in due order and respects the limit', async () => {
      await saveManyKanaProgress(db, [
        makeProgress('a', { dueAt: 500 }),
        makeProgress('b', { dueAt: 100 }),
        makeProgress('c', { dueAt: 9_000 }),
        makeProgress('d', { dueAt: 100 }),
      ]);

      await expect(countDueKanaProgress(db, 1_000)).resolves.toBe(3);
      await expect(countKanaProgress(db)).resolves.toBe(4);

      const due = await getDueKanaProgress(db, 1_000, 10);
      expect(due.map((item) => item.kanaId)).toEqual(['b', 'd', 'a']);
      expect(due.map((item) => item.dueAt)).toEqual([100, 100, 500]);

      const limited = await getDueKanaProgress(db, 1_000, 2);
      expect(limited).toHaveLength(2);
      await expect(getDueKanaProgress(db, 1_000, 0)).resolves.toEqual([]);
    });

    it('lists all progress sorted by id', async () => {
      await saveManyKanaProgress(db, [makeProgress('katakana-a'), makeProgress('hiragana-a')]);
      const all = await getAllKanaProgress(db);
      expect(all.map((item) => item.kanaId)).toEqual(['hiragana-a', 'katakana-a']);

      await clearKanaProgress(db);
      await expect(countKanaProgress(db)).resolves.toBe(0);
    });
  });

  describe('review log', () => {
    it('inserts entries and computes range accuracy', async () => {
      const id = await insertReviewLog(db, {
        kanaId: 'hiragana-a',
        mode: 'kana-to-romaji',
        correct: true,
        quality: 5,
        responseMs: 1_200,
        at: 1_000,
      });
      expect(id).toBeGreaterThan(0);

      await insertReviewLog(db, {
        kanaId: 'hiragana-i',
        mode: 'listening',
        correct: false,
        quality: 1,
        responseMs: 4_000,
        at: 2_000,
      });

      await expect(countReviewLogBetween(db, 0, 3_000)).resolves.toEqual({
        questions: 2,
        correct: 1,
      });
      await expect(countReviewLogBetween(db, 0, 1_500)).resolves.toEqual({
        questions: 1,
        correct: 1,
      });
    });

    it('lists recent, ranged and all entries, then clears them', async () => {
      for (const at of [1_000, 2_000, 3_000]) {
        await insertReviewLog(db, {
          kanaId: 'hiragana-a',
          mode: 'kana-to-romaji',
          correct: at !== 2_000,
          quality: at === 2_000 ? 1 : 4,
          responseMs: 1_000,
          at,
        });
      }

      expect((await getRecentReviewLog(db, 2)).map((entry) => entry.at)).toEqual([3_000, 2_000]);
      expect(await getRecentReviewLog(db, 0)).toEqual([]);
      expect((await getReviewLogBetween(db, 1_500, 3_500)).map((entry) => entry.at)).toEqual([
        2_000, 3_000,
      ]);
      expect(await getAllReviewLog(db)).toHaveLength(3);
      expect((await getRecentReviewLog(db, 1))[0]?.correct).toBe(true);

      await clearReviewLog(db);
      await expect(getAllReviewLog(db)).resolves.toEqual([]);
    });
  });

  describe('daily stats', () => {
    const day = '2026-05-20';

    it('accumulates activity and keeps goal_met once set', async () => {
      await addDailyActivity(db, day, {
        xp: 10,
        secondsActive: 60,
        questions: 1,
        correct: 1,
        goalMet: false,
      });
      await addDailyActivity(db, day, {
        xp: 12,
        secondsActive: 120,
        questions: 2,
        correct: 1,
        goalMet: true,
      });
      await addDailyActivity(db, day, {
        xp: 0,
        secondsActive: 0,
        questions: 0,
        correct: 0,
        goalMet: false,
      });

      const stats = await getDailyStats(db, day);
      expect(stats).toEqual({
        day,
        xp: 22,
        secondsActive: 180,
        questions: 3,
        correct: 2,
        goalMet: true,
      } satisfies DailyStats);
    });

    it('stores exact values and reports totals', async () => {
      await saveDailyStats(db, {
        day,
        xp: 50,
        secondsActive: 300,
        questions: 10,
        correct: 8,
        goalMet: true,
      });
      await saveDailyStats(db, {
        day: '2026-05-21',
        xp: 30,
        secondsActive: 120,
        questions: 5,
        correct: 2,
        goalMet: false,
      });

      await expect(getTotalXp(db)).resolves.toBe(80);
      await expect(getTotalSeconds(db)).resolves.toBe(420);
      await expect(getDailyStats(db, '2026-05-22')).resolves.toBeNull();
      const all = await getAllDailyStats(db);
      expect(all.map((row) => row.day)).toEqual(['2026-05-20', '2026-05-21']);

      const range = await getDailyStatsRange(db, '2026-05-21', '2026-05-31');
      expect(range.map((row) => row.day)).toEqual(['2026-05-21']);

      await clearDailyStats(db);
      await expect(getTotalXp(db)).resolves.toBe(0);
    });
  });

  describe('reset', () => {
    it('clears every user-owned table atomically', async () => {
      await updateSettings(db, { language: 'en' });
      await saveKanaProgress(db, makeProgress('hiragana-a'));
      await insertReviewLog(db, {
        kanaId: 'hiragana-a',
        mode: 'romaji-to-kana',
        correct: true,
        quality: 4,
        responseMs: 900,
        at: 1_000,
      });
      await saveDailyStats(db, {
        day: '2026-05-20',
        xp: 10,
        secondsActive: 60,
        questions: 1,
        correct: 1,
        goalMet: false,
      });
      await setMeta(db, 'firstRunAt', '100');

      await resetAllData(db);

      await expect(countKanaProgress(db)).resolves.toBe(0);
      await expect(getTotalXp(db)).resolves.toBe(0);
      await expect(getMeta(db, 'firstRunAt')).resolves.toBeNull();
      const settings = await getSettings(db);
      expect(settings.language).toBe('ur');
      expect(settings.onboardingDone).toBe(false);
    });
  });
});
