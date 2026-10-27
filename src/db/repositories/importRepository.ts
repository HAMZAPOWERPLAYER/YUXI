import {
  addBookmark,
  insertReviewLog,
  saveDailyStats,
  saveManyLessonProgress,
  saveManySrsItems,
  setMeta,
} from '@/db/repositories';
import type { DatabaseConnection } from '@/db/types';
import { encodeSettingsPatch } from '@/features/settings/settingsModel';
import type { AppSettings } from '@/features/settings/settingsModel';
import type { DailyStats } from '@/types/kana';
import type { Bookmark, LessonProgress, ReviewLogEntry, SrsItem } from '@/types/srs';

export type UserDataSnapshot = {
  settings: AppSettings;
  srsItems: readonly SrsItem[];
  lessonProgress: readonly LessonProgress[];
  bookmarks: readonly Bookmark[];
  dailyStats: readonly DailyStats[];
  reviewLog: readonly ReviewLogEntry[];
  meta: Readonly<Record<string, string | null>>;
};

/**
 * Replaces every user-owned row in a single transaction. Used by backup
 * import so a failure cannot leave a half-restored profile behind.
 */
export async function replaceAllUserData(
  db: DatabaseConnection,
  data: UserDataSnapshot,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM bookmarks;
      DELETE FROM lesson_progress;
      DELETE FROM review_log;
      DELETE FROM srs_items;
      DELETE FROM kana_progress;
      DELETE FROM daily_stats;
      DELETE FROM kv_settings;
      DELETE FROM meta;
    `);

    for (const [key, value] of encodeSettingsPatch(data.settings)) {
      await db.runAsync(
        `INSERT INTO kv_settings (key, value)
         VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        key,
        value,
      );
    }

    await saveManySrsItems(db, data.srsItems);
    await saveManyLessonProgress(db, data.lessonProgress);
    for (const bookmark of data.bookmarks) {
      await addBookmark(db, bookmark);
    }
    for (const stats of data.dailyStats) {
      await saveDailyStats(db, stats);
    }
    for (const entry of data.reviewLog) {
      const { id: _ignored, ...row } = entry;
      await insertReviewLog(db, row);
    }
    for (const [key, value] of Object.entries(data.meta)) {
      await setMeta(db, key, value);
    }
  });
}
