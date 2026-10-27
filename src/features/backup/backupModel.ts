import { z } from 'zod';

import { MAX_TEXT_SCALE, MIN_TEXT_SCALE } from '@/features/settings/settingsModel';
import type { AppSettings } from '@/features/settings/settingsModel';
import type { DailyStats } from '@/types/kana';
import {
  BOOKMARK_ITEM_TYPES,
  LEARNING_ITEM_TYPES,
  REVIEW_MODES,
  type Bookmark,
  type LessonProgress,
  type ReviewLogEntry,
  type SrsItem,
} from '@/types/srs';
import { isValidDayKey } from '@/utils/date';

export const BACKUP_FORMAT = 'yuxi-backup';
/** Current written format. Version 1 files are still accepted on import. */
export const BACKUP_VERSION = 2;
export const LEGACY_BACKUP_VERSION = 1;
/** Hard cap for a picked file; larger files are rejected before parsing. */
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

const nonNegativeInt = z.number().int().min(0).max(1_000_000_000);
const nonNegativeNumber = z.number().min(0).max(1_000_000_000);
/** Millisecond epoch timestamps are far larger than counters, so they get their own bound. */
const timestampMs = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const itemIdSchema = z.string().min(1).max(80);
const unitIdSchema = z.string().min(1).max(80);

const settingsSchema = z.object({
  language: z.enum(['ur', 'en']),
  textScale: z.number().min(MIN_TEXT_SCALE).max(MAX_TEXT_SCALE),
  theme: z.enum(['dark', 'light']),
  dailyGoalMinutes: z.union([z.literal(5), z.literal(10), z.literal(20)]),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  hapticsEnabled: z.boolean(),
  onboardingDone: z.boolean(),
});

const dailyStatsSchema = z.object({
  day: z.string().refine(isValidDayKey, 'Invalid day key'),
  xp: nonNegativeInt,
  secondsActive: nonNegativeInt,
  questions: nonNegativeInt,
  correct: nonNegativeInt,
  goalMet: z.boolean(),
});

const metaSchema = z.record(z.string().min(1).max(120), z.string().max(500).nullable());

const kanaProgressSchema = z.object({
  kanaId: itemIdSchema,
  seen: nonNegativeInt,
  correct: nonNegativeInt,
  wrong: nonNegativeInt,
  streak: nonNegativeInt,
  ease: z.number().min(1).max(5),
  intervalDays: z.number().min(0).max(3_650),
  repetitions: nonNegativeInt,
  dueAt: timestampMs,
  lastSeenAt: timestampMs,
  firstSeenAt: timestampMs,
  lapses: nonNegativeInt,
});

const legacyReviewLogSchema = z.object({
  id: nonNegativeInt.optional(),
  kanaId: itemIdSchema,
  mode: z.enum(['kana-to-romaji', 'romaji-to-kana', 'listening']),
  correct: z.boolean(),
  quality: z.number().int().min(0).max(5),
  responseMs: nonNegativeNumber,
  at: timestampMs,
});

const srsItemSchema = z.object({
  itemId: itemIdSchema,
  itemType: z.enum(LEARNING_ITEM_TYPES),
  seen: nonNegativeInt,
  correct: nonNegativeInt,
  wrong: nonNegativeInt,
  streak: nonNegativeInt,
  ease: z.number().min(1).max(5),
  intervalDays: z.number().min(0).max(3_650),
  repetitions: nonNegativeInt,
  dueAt: timestampMs,
  lastSeenAt: timestampMs,
  firstSeenAt: timestampMs,
  lapses: nonNegativeInt,
});

const lessonProgressSchema = z.object({
  lessonId: itemIdSchema,
  unitId: unitIdSchema,
  completed: z.boolean(),
  startedAt: timestampMs,
  completedAt: timestampMs,
  lastStudiedAt: timestampMs,
  questions: nonNegativeInt,
  correct: nonNegativeInt,
});

const bookmarkSchema = z.object({
  itemId: itemIdSchema,
  itemType: z.enum(BOOKMARK_ITEM_TYPES),
  unitId: unitIdSchema,
  createdAt: timestampMs,
});

const reviewLogSchema = z.object({
  id: nonNegativeInt.optional(),
  itemId: itemIdSchema,
  itemType: z.enum(LEARNING_ITEM_TYPES),
  mode: z.enum(REVIEW_MODES),
  correct: z.boolean(),
  quality: z.number().int().min(0).max(5),
  responseMs: nonNegativeNumber,
  at: timestampMs,
});

function addDuplicateIssues<T>(
  context: z.RefinementCtx,
  items: readonly T[],
  keyOf: (item: T) => string,
  path: string,
  label: string,
): void {
  const seen = new Map<string, number>();
  items.forEach((item, index) => {
    const key = keyOf(item);
    const first = seen.get(key);
    if (first === undefined) {
      seen.set(key, index);
      return;
    }
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Duplicate ${label} "${key}" (first at index ${first})`,
      path: [path, index],
    });
  });
}

export const backupV1Schema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(LEGACY_BACKUP_VERSION),
  exportedAt: timestampMs,
  appVersion: z.string().min(1).max(40),
  settings: settingsSchema,
  kanaProgress: z.array(kanaProgressSchema).max(5_000),
  dailyStats: z.array(dailyStatsSchema).max(20_000),
  reviewLog: z.array(legacyReviewLogSchema).max(200_000),
  meta: metaSchema,
});

export const backupV2Schema = z
  .object({
    format: z.literal(BACKUP_FORMAT),
    version: z.literal(BACKUP_VERSION),
    exportedAt: timestampMs,
    appVersion: z.string().min(1).max(40),
    settings: settingsSchema,
    srsItems: z.array(srsItemSchema).max(20_000),
    lessonProgress: z.array(lessonProgressSchema).max(5_000),
    bookmarks: z.array(bookmarkSchema).max(20_000),
    dailyStats: z.array(dailyStatsSchema).max(20_000),
    reviewLog: z.array(reviewLogSchema).max(200_000),
    meta: metaSchema,
  })
  .superRefine((value, context) => {
    addDuplicateIssues(
      context,
      value.srsItems,
      (item) => `${item.itemType}:${item.itemId}`,
      'srsItems',
      'SRS item',
    );
    addDuplicateIssues(
      context,
      value.lessonProgress,
      (item) => item.lessonId,
      'lessonProgress',
      'lesson',
    );
    addDuplicateIssues(
      context,
      value.bookmarks,
      (item) => `${item.itemType}:${item.itemId}`,
      'bookmarks',
      'bookmark',
    );
  });

export type BackupPayload = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: number;
  appVersion: string;
  settings: AppSettings;
  srsItems: SrsItem[];
  lessonProgress: LessonProgress[];
  bookmarks: Bookmark[];
  dailyStats: DailyStats[];
  reviewLog: ReviewLogEntry[];
  meta: Record<string, string | null>;
};

export type BackupSummary = {
  /** Kana rows, kept for the import confirmation copy and v1 compatibility. */
  kanaCount: number;
  itemCount: number;
  lessonCount: number;
  bookmarkCount: number;
  dayCount: number;
  reviewCount: number;
};

export type BackupParseResult =
  | {
      ok: true;
      payload: BackupPayload;
      summary: BackupSummary;
      /** Format version found in the file, before normalization. */
      sourceVersion: typeof LEGACY_BACKUP_VERSION | typeof BACKUP_VERSION;
    }
  | { ok: false; reason: 'too-large' | 'invalid' };

function normalizeV1(parsed: z.infer<typeof backupV1Schema>): BackupPayload {
  const srsItems: SrsItem[] = parsed.kanaProgress.map((row) => ({
    itemId: row.kanaId,
    itemType: 'kana',
    seen: row.seen,
    correct: row.correct,
    wrong: row.wrong,
    streak: row.streak,
    ease: row.ease,
    intervalDays: row.intervalDays,
    repetitions: row.repetitions,
    dueAt: row.dueAt,
    lastSeenAt: row.lastSeenAt,
    firstSeenAt: row.firstSeenAt,
    lapses: row.lapses,
  }));

  const reviewLog: ReviewLogEntry[] = parsed.reviewLog.map((entry) => {
    const { kanaId, ...rest } = entry;
    return { ...rest, itemId: kanaId, itemType: 'kana' };
  });

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: parsed.exportedAt,
    appVersion: parsed.appVersion,
    settings: parsed.settings,
    srsItems,
    lessonProgress: [],
    bookmarks: [],
    dailyStats: parsed.dailyStats,
    reviewLog,
    meta: parsed.meta,
  };
}

export function summarizeBackup(payload: BackupPayload): BackupSummary {
  return {
    kanaCount: payload.srsItems.filter((item) => item.itemType === 'kana').length,
    itemCount: payload.srsItems.length,
    lessonCount: payload.lessonProgress.length,
    bookmarkCount: payload.bookmarks.length,
    dayCount: payload.dailyStats.length,
    reviewCount: payload.reviewLog.length,
  };
}

export function parseBackupJson(text: string, byteSize = text.length): BackupParseResult {
  if (byteSize > MAX_BACKUP_BYTES || text.length > MAX_BACKUP_BYTES) {
    return { ok: false, reason: 'too-large' };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  const v1 = backupV1Schema.safeParse(raw);
  if (v1.success) {
    const payload = normalizeV1(v1.data);
    return {
      ok: true,
      payload,
      summary: summarizeBackup(payload),
      sourceVersion: LEGACY_BACKUP_VERSION,
    };
  }

  const v2 = backupV2Schema.safeParse(raw);
  if (v2.success) {
    const payload: BackupPayload = {
      ...v2.data,
      srsItems: v2.data.srsItems.map((row) => ({ ...row })),
      lessonProgress: v2.data.lessonProgress.map((row) => ({ ...row })),
      bookmarks: v2.data.bookmarks.map((row) => ({ ...row })),
      dailyStats: v2.data.dailyStats.map((row) => ({ ...row })),
      reviewLog: v2.data.reviewLog.map((row) => ({ ...row })),
    };
    return {
      ok: true,
      payload,
      summary: summarizeBackup(payload),
      sourceVersion: BACKUP_VERSION,
    };
  }

  return { ok: false, reason: 'invalid' };
}

export function serializeBackup(payload: BackupPayload): string {
  return JSON.stringify(payload, null, 2);
}
