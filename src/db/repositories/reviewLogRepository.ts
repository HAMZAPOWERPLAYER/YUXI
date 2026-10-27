import type { ReviewLogEntry, ReviewMode } from '@/types/kana';

import type { DatabaseConnection } from '../types';

type ReviewLogRow = {
  id: number;
  kana_id: string;
  mode: string;
  correct: number;
  quality: number;
  response_ms: number;
  at: number;
};

function mapRow(row: ReviewLogRow): ReviewLogEntry {
  return {
    id: row.id,
    kanaId: row.kana_id,
    mode: row.mode as ReviewMode,
    correct: row.correct === 1,
    quality: row.quality,
    responseMs: row.response_ms,
    at: row.at,
  };
}

export async function insertReviewLog(
  db: DatabaseConnection,
  entry: Omit<ReviewLogEntry, 'id'>,
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO review_log (kana_id, mode, correct, quality, response_ms, at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    entry.kanaId,
    entry.mode,
    entry.correct ? 1 : 0,
    entry.quality,
    entry.responseMs,
    entry.at,
  );
  return result.lastInsertRowId;
}

export async function getRecentReviewLog(
  db: DatabaseConnection,
  limit: number,
): Promise<ReviewLogEntry[]> {
  const safeLimit = Math.max(0, Math.trunc(limit));
  if (safeLimit === 0) return [];
  const rows = await db.getAllAsync<ReviewLogRow>(
    `SELECT id, kana_id, mode, correct, quality, response_ms, at
     FROM review_log
     ORDER BY at DESC, id DESC
     LIMIT ?`,
    safeLimit,
  );
  return rows.map(mapRow);
}

export async function getReviewLogBetween(
  db: DatabaseConnection,
  fromAt: number,
  toAt: number,
): Promise<ReviewLogEntry[]> {
  const rows = await db.getAllAsync<ReviewLogRow>(
    `SELECT id, kana_id, mode, correct, quality, response_ms, at
     FROM review_log
     WHERE at >= ? AND at < ?
     ORDER BY at ASC, id ASC`,
    fromAt,
    toAt,
  );
  return rows.map(mapRow);
}

export async function getAllReviewLog(db: DatabaseConnection): Promise<ReviewLogEntry[]> {
  const rows = await db.getAllAsync<ReviewLogRow>(
    `SELECT id, kana_id, mode, correct, quality, response_ms, at
     FROM review_log
     ORDER BY at ASC, id ASC`,
  );
  return rows.map(mapRow);
}

export async function countReviewLogBetween(
  db: DatabaseConnection,
  fromAt: number,
  toAt: number,
): Promise<{ questions: number; correct: number }> {
  const row = await db.getFirstAsync<{ questions: number; correct: number }>(
    `SELECT COUNT(*) AS questions, COALESCE(SUM(correct), 0) AS correct
     FROM review_log
     WHERE at >= ? AND at < ?`,
    fromAt,
    toAt,
  );
  return { questions: row?.questions ?? 0, correct: row?.correct ?? 0 };
}

export async function clearReviewLog(db: DatabaseConnection): Promise<void> {
  await db.execAsync('DELETE FROM review_log');
}
