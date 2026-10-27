import {
  getAllDailyStats,
  getAllKanaProgress,
  getAllMeta,
  getAllReviewLog,
  getSettings,
  insertReviewLog,
  saveDailyStats,
  saveKanaProgress,
  setMeta,
  updateSettings,
} from '@/db/repositories';
import { runMigrations } from '@/db/migrations/runner';
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
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
import type { DailyStats, KanaProgress, ReviewLogEntry } from '@/types/kana';
import { toLocalDayKey } from '@/utils/date';

import { createTestDatabase, type TestDatabase } from '../helpers/testDatabase';

const AT = new Date(2026, 4, 10, 12, 0, 0).getTime();
const DAY = toLocalDayKey(AT);

function makeProgress(kanaId: string, overrides: Partial<KanaProgress> = {}): KanaProgress {
  return {
    kanaId,
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

const reviewInput: Omit<ReviewLogEntry, 'id'> = {
  kanaId: 'hira-a',
  mode: 'kana-to-romaji',
  correct: true,
  quality: 4,
  responseMs: 1_400,
  at: AT,
};

const review: ReviewLogEntry = { ...reviewInput, id: 42 };

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
    kanaProgress: [makeProgress('hira-a')],
    dailyStats: [makeStats(DAY)],
    reviewLog: [review],
    meta: { [`session_completed:${DAY}`]: '1' },
    ...overrides,
  };
}

describe('backup model', () => {
  it('round-trips a payload through serialization and parsing', () => {
    const payload = makePayload();
    const result = parseBackupJson(serializeBackup(payload));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload).toEqual(payload);
    expect(result.summary).toEqual({
      kanaCount: 1,
      dayCount: 1,
      reviewCount: 1,
    });
  });

  it('rejects malformed JSON and foreign formats', () => {
    expect(parseBackupJson('{')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseBackupJson(JSON.stringify({ ...makePayload(), format: 'other-app' }))).toEqual({
      ok: false,
      reason: 'invalid',
    });
  });

  it('rejects unsupported versions and out-of-range values', () => {
    const cases: unknown[] = [
      { ...makePayload(), version: 2 },
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
        kanaProgress: [makeProgress('hira-a', { ease: 12 })],
      },
      {
        ...makePayload(),
        reviewLog: [{ ...review, quality: 7 }],
      },
    ];
    for (const candidate of cases) {
      expect(parseBackupJson(JSON.stringify(candidate))).toEqual({
        ok: false,
        reason: 'invalid',
      });
    }
  });

  it('rejects files over the size cap before parsing', () => {
    expect(parseBackupJson('{}', MAX_BACKUP_BYTES + 1)).toEqual({
      ok: false,
      reason: 'too-large',
    });
  });

  it('summarizes counts', () => {
    expect(summarizeBackup(makePayload())).toEqual({
      kanaCount: 1,
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

  it('builds a complete payload and omits device-local meta', async () => {
    await updateSettings(db, {
      language: 'en',
      onboardingDone: true,
      reminderEnabled: true,
    });
    await saveKanaProgress(db, makeProgress('hira-a'));
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
    expect(payload.kanaProgress).toHaveLength(1);
    expect(payload.dailyStats).toHaveLength(1);
    expect(payload.reviewLog).toHaveLength(1);
    expect(payload.meta).toEqual({ [`session_completed:${DAY}`]: '1' });

    expect(parseBackupJson(serializeBackup(payload)).ok).toBe(true);
  });

  it('replaces all user data atomically and keeps device meta local', async () => {
    await updateSettings(db, { language: 'ur', onboardingDone: true });
    await saveKanaProgress(db, makeProgress('old-kana'));
    await saveDailyStats(db, makeStats('2026-01-01', { xp: 5 }));
    await insertReviewLog(db, { ...reviewInput, kanaId: 'old-kana' });
    await setMeta(db, 'old-meta', 'value');
    await setMeta(db, REMINDER_NOTIFICATION_META_KEY, 'local-notification');

    const payload = makePayload({
      meta: {
        [`session_completed:${DAY}`]: '1',
        [REMINDER_NOTIFICATION_META_KEY]: 'imported-notification',
      },
    });
    const summary = await applyBackup(db, payload);

    expect(summary).toEqual({ kanaCount: 1, dayCount: 1, reviewCount: 1 });
    expect(await getSettings(db)).toMatchObject({
      language: 'en',
      onboardingDone: true,
      reminderEnabled: true,
    });
    expect((await getAllKanaProgress(db)).map((row) => row.kanaId)).toEqual(['hira-a']);
    expect((await getAllDailyStats(db)).map((row) => row.day)).toEqual([DAY]);
    expect((await getAllReviewLog(db)).map((row) => row.kanaId)).toEqual(['hira-a']);

    const meta = await getAllMeta(db);
    expect(meta).toEqual({ [`session_completed:${DAY}`]: '1' });
    expect(meta[REMINDER_NOTIFICATION_META_KEY]).toBeUndefined();
  });

  it('names files by local day', () => {
    expect(backupFileName('2026-05-10')).toBe('yuxi-backup-2026-05-10.json');
    expect(backupFileNameForTimestamp(AT)).toBe(`yuxi-backup-${DAY}.json`);
  });
});
