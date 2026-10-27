import { z } from 'zod';

import { MAX_TEXT_SCALE, MIN_TEXT_SCALE } from '@/features/settings/settingsModel';
import type { AppSettings } from '@/features/settings/settingsModel';
import type { DailyStats, KanaProgress, ReviewLogEntry } from '@/types/kana';
import { isValidDayKey } from '@/utils/date';

export const BACKUP_FORMAT = 'yuxi-backup';
export const BACKUP_VERSION = 1;
/** Hard cap for a picked file; larger files are rejected before parsing. */
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

const nonNegativeInt = z.number().int().min(0).max(1_000_000_000);
const nonNegativeNumber = z.number().min(0).max(1_000_000_000);
/** Millisecond epoch timestamps are far larger than counters, so they get their own bound. */
const timestampMs = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);

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

const kanaProgressSchema = z.object({
  kanaId: z.string().min(1).max(80),
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

const dailyStatsSchema = z.object({
  day: z.string().refine(isValidDayKey, 'Invalid day key'),
  xp: nonNegativeInt,
  secondsActive: nonNegativeInt,
  questions: nonNegativeInt,
  correct: nonNegativeInt,
  goalMet: z.boolean(),
});

const reviewLogSchema = z.object({
  id: nonNegativeInt.optional(),
  kanaId: z.string().min(1).max(80),
  mode: z.enum(['kana-to-romaji', 'romaji-to-kana', 'listening']),
  correct: z.boolean(),
  quality: z.number().int().min(0).max(5),
  responseMs: nonNegativeNumber,
  at: timestampMs,
});

const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  exportedAt: timestampMs,
  appVersion: z.string().min(1).max(40),
  settings: settingsSchema,
  kanaProgress: z.array(kanaProgressSchema).max(5_000),
  dailyStats: z.array(dailyStatsSchema).max(20_000),
  reviewLog: z.array(reviewLogSchema).max(200_000),
  meta: z.record(z.string().min(1).max(120), z.string().max(500).nullable()),
});

export type BackupPayload = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: number;
  appVersion: string;
  settings: AppSettings;
  kanaProgress: KanaProgress[];
  dailyStats: DailyStats[];
  reviewLog: ReviewLogEntry[];
  meta: Record<string, string | null>;
};

export type BackupSummary = {
  kanaCount: number;
  dayCount: number;
  reviewCount: number;
};

export type BackupParseResult =
  | { ok: true; payload: BackupPayload; summary: BackupSummary }
  | { ok: false; reason: 'too-large' | 'invalid' };

export function summarizeBackup(payload: BackupPayload): BackupSummary {
  return {
    kanaCount: payload.kanaProgress.length,
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

  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: 'invalid' };

  const payload: BackupPayload = {
    ...parsed.data,
    kanaProgress: parsed.data.kanaProgress.map((row) => ({ ...row })),
    dailyStats: parsed.data.dailyStats.map((row) => ({ ...row })),
    reviewLog: parsed.data.reviewLog.map((row) => ({ ...row })),
  };

  return { ok: true, payload, summary: summarizeBackup(payload) };
}

export function serializeBackup(payload: BackupPayload): string {
  return JSON.stringify(payload, null, 2);
}
