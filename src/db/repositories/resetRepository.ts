import type { DatabaseConnection } from '../types';

/**
 * Clears every user-owned table in one transaction. Used by the double-confirm
 * reset flow. The schema itself stays in place.
 */
export async function resetAllData(db: DatabaseConnection): Promise<void> {
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
  });
}
