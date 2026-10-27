import type { DatabaseConnection } from '@/db/types';
import type { LearningItemType, SrsItem } from '@/types/srs';

type SrsItemRow = {
  item_id: string;
  item_type: string;
  seen: number;
  correct: number;
  wrong: number;
  streak: number;
  ease: number;
  interval_days: number;
  repetitions: number;
  due_at: number;
  last_seen_at: number;
  first_seen_at: number;
  lapses: number;
};

const SELECT_COLUMNS = `
  item_id, item_type, seen, correct, wrong, streak, ease, interval_days,
  repetitions, due_at, last_seen_at, first_seen_at, lapses
`;

function mapRow(row: SrsItemRow): SrsItem {
  return {
    itemId: row.item_id,
    itemType: row.item_type as LearningItemType,
    seen: row.seen,
    correct: row.correct,
    wrong: row.wrong,
    streak: row.streak,
    ease: row.ease,
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    dueAt: row.due_at,
    lastSeenAt: row.last_seen_at,
    firstSeenAt: row.first_seen_at,
    lapses: row.lapses,
  };
}

export async function getSrsItem(
  db: DatabaseConnection,
  itemId: string,
  itemType: LearningItemType,
): Promise<SrsItem | null> {
  const row = await db.getFirstAsync<SrsItemRow>(
    `SELECT ${SELECT_COLUMNS} FROM srs_items WHERE item_id = ? AND item_type = ?`,
    itemId,
    itemType,
  );
  return row ? mapRow(row) : null;
}

export async function getAllSrsItems(db: DatabaseConnection): Promise<SrsItem[]> {
  const rows = await db.getAllAsync<SrsItemRow>(
    `SELECT ${SELECT_COLUMNS} FROM srs_items ORDER BY item_type ASC, item_id ASC`,
  );
  return rows.map(mapRow);
}

export async function getSrsItemsByType(
  db: DatabaseConnection,
  itemType: LearningItemType,
): Promise<SrsItem[]> {
  const rows = await db.getAllAsync<SrsItemRow>(
    `SELECT ${SELECT_COLUMNS} FROM srs_items WHERE item_type = ? ORDER BY item_id ASC`,
    itemType,
  );
  return rows.map(mapRow);
}

/**
 * Keeps the v1 table readable for one release after upgrading. Only kana rows
 * are mirrored; vocabulary and sentence rows exist only in `srs_items`.
 */
async function mirrorKanaProgress(db: DatabaseConnection, item: SrsItem): Promise<void> {
  await db.runAsync(
    `INSERT INTO kana_progress (
       kana_id, seen, correct, wrong, streak, ease, interval_days,
       repetitions, due_at, last_seen_at, first_seen_at, lapses
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(kana_id) DO UPDATE SET
       seen = excluded.seen,
       correct = excluded.correct,
       wrong = excluded.wrong,
       streak = excluded.streak,
       ease = excluded.ease,
       interval_days = excluded.interval_days,
       repetitions = excluded.repetitions,
       due_at = excluded.due_at,
       last_seen_at = excluded.last_seen_at,
       first_seen_at = CASE
         WHEN kana_progress.first_seen_at = 0 THEN excluded.first_seen_at
         ELSE kana_progress.first_seen_at
       END,
       lapses = excluded.lapses`,
    item.itemId,
    item.seen,
    item.correct,
    item.wrong,
    item.streak,
    item.ease,
    item.intervalDays,
    item.repetitions,
    item.dueAt,
    item.lastSeenAt,
    item.firstSeenAt,
    item.lapses,
  );
}

export async function saveSrsItem(db: DatabaseConnection, item: SrsItem): Promise<void> {
  await db.runAsync(
    `INSERT INTO srs_items (
       item_id, item_type, seen, correct, wrong, streak, ease, interval_days,
       repetitions, due_at, last_seen_at, first_seen_at, lapses
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(item_id, item_type) DO UPDATE SET
       seen = excluded.seen,
       correct = excluded.correct,
       wrong = excluded.wrong,
       streak = excluded.streak,
       ease = excluded.ease,
       interval_days = excluded.interval_days,
       repetitions = excluded.repetitions,
       due_at = excluded.due_at,
       last_seen_at = excluded.last_seen_at,
       first_seen_at = CASE
         WHEN srs_items.first_seen_at = 0 THEN excluded.first_seen_at
         ELSE srs_items.first_seen_at
       END,
       lapses = excluded.lapses`,
    item.itemId,
    item.itemType,
    item.seen,
    item.correct,
    item.wrong,
    item.streak,
    item.ease,
    item.intervalDays,
    item.repetitions,
    item.dueAt,
    item.lastSeenAt,
    item.firstSeenAt,
    item.lapses,
  );

  if (item.itemType === 'kana') {
    await mirrorKanaProgress(db, item);
  }
}

/** Writes several rows sequentially; wrap in a transaction for all-or-nothing. */
export async function saveManySrsItems(
  db: DatabaseConnection,
  items: readonly SrsItem[],
): Promise<void> {
  for (const item of items) {
    await saveSrsItem(db, item);
  }
}

export async function getDueSrsItems(
  db: DatabaseConnection,
  at: number,
  limit: number,
  itemType?: LearningItemType,
): Promise<SrsItem[]> {
  const safeLimit = Math.max(0, Math.trunc(limit));
  if (safeLimit === 0) return [];

  const rows = itemType
    ? await db.getAllAsync<SrsItemRow>(
        `SELECT ${SELECT_COLUMNS} FROM srs_items
         WHERE item_type = ? AND due_at <= ?
         ORDER BY due_at ASC, item_id ASC
         LIMIT ?`,
        itemType,
        at,
        safeLimit,
      )
    : await db.getAllAsync<SrsItemRow>(
        `SELECT ${SELECT_COLUMNS} FROM srs_items
         WHERE due_at <= ?
         ORDER BY due_at ASC, item_id ASC
         LIMIT ?`,
        at,
        safeLimit,
      );
  return rows.map(mapRow);
}

export async function countDueSrsItems(
  db: DatabaseConnection,
  at: number,
  itemType?: LearningItemType,
): Promise<number> {
  const row = itemType
    ? await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) AS count FROM srs_items WHERE item_type = ? AND due_at <= ?',
        itemType,
        at,
      )
    : await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) AS count FROM srs_items WHERE due_at <= ?',
        at,
      );
  return row?.count ?? 0;
}

export async function countSrsItems(
  db: DatabaseConnection,
  itemType?: LearningItemType,
): Promise<number> {
  const row = itemType
    ? await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) AS count FROM srs_items WHERE item_type = ?',
        itemType,
      )
    : await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM srs_items');
  return row?.count ?? 0;
}

export async function clearSrsItems(
  db: DatabaseConnection,
  itemType?: LearningItemType,
): Promise<void> {
  if (itemType) {
    await db.runAsync('DELETE FROM srs_items WHERE item_type = ?', itemType);
  } else {
    await db.execAsync('DELETE FROM srs_items');
  }
}
