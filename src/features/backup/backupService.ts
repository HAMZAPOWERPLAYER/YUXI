import {
  getAllBookmarks,
  getAllDailyStats,
  getAllLessonProgress,
  getAllMeta,
  getAllReviewLog,
  getAllSrsItems,
  getSettings,
} from '@/db/repositories';
import { replaceAllUserData } from '@/db/repositories/importRepository';
import type { DatabaseConnection } from '@/db/types';
import type { BackupPayload, BackupSummary } from '@/features/backup/backupModel';
import { BACKUP_FORMAT, BACKUP_VERSION, summarizeBackup } from '@/features/backup/backupModel';
import { REMINDER_NOTIFICATION_META_KEY } from '@/features/reminders';
import { toLocalDayKey } from '@/utils/date';

/** Device-local meta keys that must never travel between installations. */
export const DEVICE_META_KEYS = [REMINDER_NOTIFICATION_META_KEY] as const;

function withoutDeviceMeta(
  meta: Readonly<Record<string, string | null>>,
): Record<string, string | null> {
  const clean: Record<string, string | null> = { ...meta };
  for (const key of DEVICE_META_KEYS) {
    delete clean[key];
  }
  return clean;
}

export function backupFileName(day: string): string {
  return `yuxi-backup-${day}.json`;
}

/** Reads every user table into a versioned, serializable payload. */
export async function buildBackup(
  db: DatabaseConnection,
  appVersion: string,
  exportedAt: number,
): Promise<BackupPayload> {
  const [settings, srsItems, lessonProgress, bookmarks, dailyStats, reviewLog, meta] =
    await Promise.all([
      getSettings(db),
      getAllSrsItems(db),
      getAllLessonProgress(db),
      getAllBookmarks(db),
      getAllDailyStats(db),
      getAllReviewLog(db),
      getAllMeta(db),
    ]);

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt,
    appVersion,
    settings,
    srsItems,
    lessonProgress,
    bookmarks,
    dailyStats,
    reviewLog,
    meta: withoutDeviceMeta(meta),
  };
}

export type AppliedBackup = BackupSummary;

/** Atomically replaces local progress with the validated backup. */
export async function applyBackup(
  db: DatabaseConnection,
  payload: BackupPayload,
): Promise<AppliedBackup> {
  await replaceAllUserData(db, {
    settings: payload.settings,
    srsItems: payload.srsItems,
    lessonProgress: payload.lessonProgress,
    bookmarks: payload.bookmarks,
    dailyStats: payload.dailyStats,
    reviewLog: payload.reviewLog,
    meta: withoutDeviceMeta(payload.meta),
  });
  return summarizeBackup(payload);
}

/** Suggested file name for the current local day. */
export function backupFileNameForTimestamp(timestampMs: number): string {
  return backupFileName(toLocalDayKey(timestampMs));
}
