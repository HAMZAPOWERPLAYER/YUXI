import {
  addBookmark,
  getAllBookmarks,
  getAllDailyStats,
  getAllLessonProgress,
  getAllMeta,
  getAllReviewLog,
  getAllSrsItems,
  getKanaProgress,
  getSettings,
  getSrsItem,
  insertReviewLog,
  saveDailyStats,
  saveLessonProgress,
  saveSrsItem,
  setMeta,
  updateSettings,
} from '@/db/repositories';
import { runMigrations } from '@/db/migrations/runner';
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  LEGACY_BACKUP_VERSION,
  MAX_BACKUP_BYTES,
  applyBackup,
  backupFileName,
  backupFileNameForTimestamp,
  buildBackup,
  parseBackupJson,
  serializeBackup,
  summarizeBackup,
  type BackupPayload,
} from '@/features/backup';
import { REMINDER_NOTIFICATION_META_KEY } from '@/features/reminders';
import { DEFAULT_SETTINGS } from '@/features/settings/settingsModel';
import type { DailyStats, SrsItem } from '@/types/kana';
import type { Bookmark, LessonProgress } from '@/types/srs';
import { toLocalDayKey } from '@/utils/date';

import { createTestDatabase, type TestDatabase } from '../helpers/testDatabase';

const AT = new Date(2026, 4, 10, 12, 0, 0).getTime();
const DAY = toLocalDayKey(AT);

function makeSrsItem(
  itemId: string,
  itemType: SrsItem['itemType'] = 'kana',
  overrides: Partial<SrsItem> = {},
): SrsItem {
  return {
    itemId,
    itemType,
    seen: 3,
    correct: 2,
    wrong: 1,
    streak: 1,
    ease: 2.5,
    intervalDays: 3,
    repetitions: 2,
    dueAt: AT + 86_400_000,
    lastSeenAt: AT,
    firstSeenAt: AT - 86_400_000,
    lapses: 0,
    ...overrides,
  };
}

function makeLesson(lessonId: string, overrides: Partial<LessonProgress> = {}): LessonProgress {
  return {
    lessonId,
    unitId: 'unit-greetings',
    completed: true,
    startedAt: AT - 3_600_000,
    completedAt: AT,
    lastStudiedAt: AT,
    questions: 7,
    correct: 6,
    ...overrides,
  };
}

function makeBookmark(itemId: string, overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    itemId,
    itemType: 'vocabulary',
    unitId: 'unit-greetings',
    createdAt: AT,
    ...overrides,
  };
}

function makeStats(day: string, overrides: Partial<DailyStats> = {}): DailyStats {
  return {
    day,
    xp: 40,
    secondsActive: 600,
    questions: 10,
    correct: 8,
    goalMet: true,
    ...overrides,
  };
}

const reviewInput = {
  itemId: 'hira-a',
  itemType: 'kana' as const,
  mode: 'kana-to-romaji' as const,
  correct: true,
  quality: 4,
  responseMs: 1_400,
  at: AT,
};

const review = { ...reviewInput, id: 42 };

function makePayload(overrides: Partial<BackupPayload> = {}): BackupPayload {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: AT,
    appVersion: '1.0.0',
    settings: {
      ...DEFAULT_SETTINGS,
      language: 'en',
      onboardingDone: true,
      reminderEnabled: true,
    },
    srsItems: [
      makeSrsItem('hira-a'),
      makeSrsItem('greet-ohayou', 'vocabulary', { seen: 1, dueAt: AT }),
    ],
    lessonProgress: [makeLesson('greetings-1')],
    bookmarks: [makeBookmark('greet-ohayou')],
    dailyStats: [makeStats(DAY)],
    reviewLog: [review],
    meta: { [`session_completed:${DAY}`]: '1' },
    ...overrides,
  };
}

function makeV1Payload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    format: BACKUP_FORMAT,
    version: LEGACY_BACKUP_VERSION,
    exportedAt: AT,
    appVersion: '1.0.0',
    settings: {
      ...DEFAULT_SETTINGS,
      language: 'en',
      onboardingDone: true,
    },
    kanaProgress: [
      {
        kanaId: 'hira-a',
        seen: 3,
        correct: 2,
        wrong: 1,
        streak: 1,
        ease: 2.5,
        intervalDays: 3,
        repetitions: 2,
        dueAt: AT + 86_400_000,
        lastSeenAt: AT,
        firstSeenAt: AT - 86_400_000,
        lapses: 0,
      },
    ],
    dailyStats: [makeStats(DAY)],
    reviewLog: [
      {
        id: 7,
        kanaId: 'hira-a',
        mode: 'kana-to-romaji',
        correct: true,
        quality: 4,
        responseMs: 1_400,
        at: AT,
      },
    ],
    meta: { [`session_completed:${DAY}`]: '1' },
    ...overrides,
  };
}

describe('backup model', () => {
  it('round-trips a v2 payload through serialization and parsing', () => {
    const payload = makePayload();
    const result = parseBackupJson(serializeBackup(payload));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload).toEqual(payload);
    expect(result.sourceVersion).toBe(BACKUP_VERSION);
    expect(result.summary).toEqual({
      kanaCount: 1,
      itemCount: 2,
      lessonCount: 1,
      bookmarkCount: 1,
      dayCount: 1,
      reviewCount: 1,
    });
  });

  it('accepts a v1 file and normalizes kana progress and logs', () => {
    const result = parseBackupJson(JSON.stringify(makeV1Payload()));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sourceVersion).toBe(LEGACY_BACKUP_VERSION);
    expect(result.payload.version).toBe(BACKUP_VERSION);
    expect(result.payload.srsItems).toEqual([makeSrsItem('hira-a')]);
    expect(result.payload.reviewLog).toEqual([{ ...review, id: 7 }]);
    expect(result.payload.lessonProgress).toEqual([]);
    expect(result.payload.bookmarks).toEqual([]);
    expect(result.summary).toMatchObject({ kanaCount: 1, itemCount: 1 });
  });

  it('rejects malformed JSON, foreign formats and unknown versions', () => {
    expect(parseBackupJson('{')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseBackupJson(JSON.stringify({ ...makePayload(), format: 'other-app' }))).toEqual({
      ok: false,
      reason: 'invalid',
    });
    expect(parseBackupJson(JSON.stringify({ ...makePayload(), version: 3 }))).toEqual({
      ok: false,
      reason: 'invalid',
    });
  });

  it('rejects out-of-range values and duplicate identities', () => {
    const cases: unknown[] = [
      {
        ...makePayload(),
        settings: { ...makePayload().settings, textScale: 9 },
      },
      {
        ...makePayload(),
        dailyStats: [makeStats('10-05-2026')],
      },
      {
        ...makePayload(),
        srsItems: [makeSrsItem('hira-a', 'kana', { ease: 12 })],
      },
      {
        ...makePayload(),
        reviewLog: [{ ...review, quality: 7 }],
      },
      {
        ...makePayload(),
        srsItems: [makeSrsItem('hira-a'), makeSrsItem('hira-a')],
      },
      {
        ...makePayload(),
        lessonProgress: [makeLesson('greetings-1'), makeLesson('greetings-1')],
      },
      {
        ...makePayload(),
        bookmarks: [makeBookmark('greet-ohayou'), makeBookmark('greet-ohayou')],
      },
    ];
    for (const candidate of cases) {
      expect(parseBackupJson(JSON.stringify(candidate))).toEqual({
        ok: false,
        reason: 'invalid',
      });
    }
  });

  it('rejects a v1 file with an unknown version or bad counters', () => {
    expect(parseBackupJson(JSON.stringify(makeV1Payload({ version: 3 })))).toEqual({
      ok: false,
      reason: 'invalid',
    });

    const badKana = makeV1Payload();
    badKana.kanaProgress = [{ ...(makeV1Payload().kanaProgress as object[])[0], seen: -1 }];
    expect(parseBackupJson(JSON.stringify(badKana))).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects files over the size cap before parsing', () => {
    expect(parseBackupJson('{}', MAX_BACKUP_BYTES + 1)).toEqual({
      ok: false,
      reason: 'too-large',
    });
  });

  it('summarizes counts by type', () => {
    expect(summarizeBackup(makePayload())).toEqual({
      kanaCount: 1,
      itemCount: 2,
      lessonCount: 1,
      bookmarkCount: 1,
      dayCount: 1,
      reviewCount: 1,
    });
  });
});

describe('backup service', () => {
  let db: TestDatabase;

  beforeEach(async () => {
    db = await createTestDatabase();
    await runMigrations(db);
  });

  afterEach(() => {
    db.close();
  });

  async function seedOldData(): Promise<void> {
    await updateSettings(db, { language: 'ur', onboardingDone: true });
    await saveSrsItem(db, makeSrsItem('old-kana'));
    await saveLessonProgress(db, makeLesson('old-lesson', { unitId: 'unit-old' }));
    await addBookmark(db, makeBookmark('old-vocab', { unitId: 'unit-old' }));
    await saveDailyStats(db, makeStats('2026-01-01', { xp: 5 }));
    await insertReviewLog(db, { ...reviewInput, itemId: 'old-kana' });
    await setMeta(db, 'old-meta', 'value');
    await setMeta(db, REMINDER_NOTIFICATION_META_KEY, 'local-notification');
  }

  it('builds a complete v2 payload and omits device-local meta', async () => {
    await updateSettings(db, {
      language: 'en',
      onboardingDone: true,
      reminderEnabled: true,
    });
    await saveSrsItem(db, makeSrsItem('hira-a'));
    await saveSrsItem(db, makeSrsItem('greet-ohayou', 'vocabulary'));
    await saveLessonProgress(db, makeLesson('greetings-1'));
    await addBookmark(db, makeBookmark('greet-ohayou'));
    await saveDailyStats(db, makeStats(DAY));
    await insertReviewLog(db, reviewInput);
    await setMeta(db, REMINDER_NOTIFICATION_META_KEY, 'notification-1');
    await setMeta(db, `session_completed:${DAY}`, '1');

    const payload = await buildBackup(db, '1.2.3', AT);

    expect(payload).toMatchObject({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      appVersion: '1.2.3',
      exportedAt: AT,
    });
    expect(payload.settings).toMatchObject({ language: 'en', onboardingDone: true });
    expect(payload.srsItems).toHaveLength(2);
    expect(payload.lessonProgress).toHaveLength(1);
    expect(payload.bookmarks).toHaveLength(1);
    expect(payload.dailyStats).toHaveLength(1);
    expect(payload.reviewLog).toHaveLength(1);
    expect(payload.meta).toEqual({ [`session_completed:${DAY}`]: '1' });

    const parsed = parseBackupJson(serializeBackup(payload));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.sourceVersion).toBe(BACKUP_VERSION);
  });

  it('replaces all user data atomically and keeps device meta local', async () => {
    await seedOldData();

    const payload = makePayload({
      meta: {
        [`session_completed:${DAY}`]: '1',
        [REMINDER_NOTIFICATION_META_KEY]: 'imported-notification',
      },
    });
    const summary = await applyBackup(db, payload);

    expect(summary).toEqual({
      kanaCount: 1,
      itemCount: 2,
      lessonCount: 1,
      bookmarkCount: 1,
      dayCount: 1,
      reviewCount: 1,
    });
    expect(await getSettings(db)).toMatchObject({
      language: 'en',
      onboardingDone: true,
      reminderEnabled: true,
    });
    expect((await getAllSrsItems(db)).map((row) => `${row.itemType}:${row.itemId}`)).toEqual([
      'kana:hira-a',
      'vocabulary:greet-ohayou',
    ]);
    await expect(getSrsItem(db, 'old-kana', 'kana')).resolves.toBeNull();
    await expect(getKanaProgress(db, 'hira-a')).resolves.toMatchObject({
      seen: 3,
      dueAt: AT + 86_400_000,
    });
    expect((await getAllLessonProgress(db)).map((row) => row.lessonId)).toEqual(['greetings-1']);
    expect((await getAllBookmarks(db)).map((row) => row.itemId)).toEqual(['greet-ohayou']);
    expect((await getAllDailyStats(db)).map((row) => row.day)).toEqual([DAY]);
    expect((await getAllReviewLog(db)).map((row) => row.itemId)).toEqual(['hira-a']);

    const meta = await getAllMeta(db);
    expect(meta).toEqual({ [`session_completed:${DAY}`]: '1' });
    expect(meta[REMINDER_NOTIFICATION_META_KEY]).toBeUndefined();

    const legacy = await getKanaProgress(db, 'hira-a');
    expect(legacy?.kanaId).toBe('hira-a');
  });

  it('applies a normalized v1 payload into the generalized tables', async () => {
    const parsed = parseBackupJson(JSON.stringify(makeV1Payload()));
    if (!parsed.ok) throw new Error('Expected the v1 fixture to parse');

    await applyBackup(db, parsed.payload);

    await expect(getSrsItem(db, 'hira-a', 'kana')).resolves.toMatchObject({
      seen: 3,
      itemType: 'kana',
    });
    await expect(getKanaProgress(db, 'hira-a')).resolves.toMatchObject({ seen: 3 });
    expect(await getAllReviewLog(db)).toEqual([{ ...review, id: 1 }]);
    await expect(getAllLessonProgress(db)).resolves.toEqual([]);
    await expect(getAllBookmarks(db)).resolves.toEqual([]);
  });

  it('rolls back every table when an import fails part-way', async () => {
    await seedOldData();
    await db.execAsync(`
      CREATE TRIGGER fail_srs_insert
      BEFORE INSERT ON srs_items
      BEGIN
        SELECT RAISE(ABORT, 'simulated disk failure');
      END;
    `);

    await expect(applyBackup(db, makePayload())).rejects.toThrow(/simulated disk failure/);

    await expect(getSrsItem(db, 'old-kana', 'kana')).resolves.toMatchObject({ seen: 3 });
    await expect(getSrsItem(db, 'hira-a', 'kana')).resolves.toBeNull();
    expect((await getAllLessonProgress(db)).map((row) => row.lessonId)).toEqual(['old-lesson']);
    expect((await getAllBookmarks(db)).map((row) => row.itemId)).toEqual(['old-vocab']);
    expect((await getAllMeta(db))['old-meta']).toBe('value');
  });

  it('names files by local day', () => {
    expect(backupFileName('2026-05-10')).toBe('yuxi-backup-2026-05-10.json');
    expect(backupFileNameForTimestamp(AT)).toBe(`yuxi-backup-${DAY}.json`);
  });
});
