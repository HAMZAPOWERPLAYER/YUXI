import type { KanaProgress } from '@/types/kana';

import type { DatabaseConnection } from '../types';

type KanaProgressRow = {
  kana_id: string;
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
  kana_id, seen, correct, wrong, streak, ease, interval_days,
  repetitions, due_at, last_seen_at, first_seen_at, lapses
`;

function mapRow(row: KanaProgressRow): KanaProgress {
  return {
    kanaId: row.kana_id,
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

export async function getKanaProgress(
  db: DatabaseConnection,
  kanaId: string,
): Promise<KanaProgress | null> {
  const row = await db.getFirstAsync<KanaProgressRow>(
    `SELECT ${SELECT_COLUMNS} FROM kana_progress WHERE kana_id = ?`,
    kanaId,
  );
  return row ? mapRow(row) : null;
}

export async function getAllKanaProgress(db: DatabaseConnection): Promise<KanaProgress[]> {
  const rows = await db.getAllAsync<KanaProgressRow>(
    `SELECT ${SELECT_COLUMNS} FROM kana_progress ORDER BY kana_id ASC`,
  );
  return rows.map(mapRow);
}

export async function saveKanaProgress(
  db: DatabaseConnection,
  progress: KanaProgress,
): Promise<void> {
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
    progress.kanaId,
    progress.seen,
    progress.correct,
    progress.wrong,
    progress.streak,
    progress.ease,
    progress.intervalDays,
    progress.repetitions,
    progress.dueAt,
    progress.lastSeenAt,
    progress.firstSeenAt,
    progress.lapses,
  );
}

/**
 * Writes several rows sequentially. Callers that need all-or-nothing semantics
 * wrap this in db.withTransactionAsync() (for example the import flow).
 */
export async function saveManyKanaProgress(
  db: DatabaseConnection,
  items: readonly KanaProgress[],
): Promise<void> {
  for (const item of items) {
    await saveKanaProgress(db, item);
  }
}

export async function getDueKanaProgress(
  db: DatabaseConnection,
  at: number,
  limit: number,
): Promise<KanaProgress[]> {
  const safeLimit = Math.max(0, Math.trunc(limit));
  if (safeLimit === 0) return [];
  const rows = await db.getAllAsync<KanaProgressRow>(
    `SELECT ${SELECT_COLUMNS} FROM kana_progress
     WHERE due_at <= ?
     ORDER BY due_at ASC
     LIMIT ?`,
    at,
    safeLimit,
  );
  return rows.map(mapRow);
}

export async function countDueKanaProgress(db: DatabaseConnection, at: number): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM kana_progress WHERE due_at <= ?',
    at,
  );
  return row?.count ?? 0;
}

export async function countKanaProgress(db: DatabaseConnection): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM kana_progress',
  );
  return row?.count ?? 0;
}

export async function clearKanaProgress(db: DatabaseConnection): Promise<void> {
  await db.execAsync('DELETE FROM kana_progress');
}
