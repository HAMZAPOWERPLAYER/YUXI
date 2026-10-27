import type { DailyStats } from '@/types/kana';

import type { DatabaseConnection } from '../types';

type DailyStatsRow = {
  day: string;
  xp: number;
  seconds_active: number;
  questions: number;
  correct: number;
  goal_met: number;
};

function mapRow(row: DailyStatsRow): DailyStats {
  return {
    day: row.day,
    xp: row.xp,
    secondsActive: row.seconds_active,
    questions: row.questions,
    correct: row.correct,
    goalMet: row.goal_met === 1,
  };
}

export async function getDailyStats(
  db: DatabaseConnection,
  day: string,
): Promise<DailyStats | null> {
  const row = await db.getFirstAsync<DailyStatsRow>(
    `SELECT day, xp, seconds_active, questions, correct, goal_met
     FROM daily_stats WHERE day = ?`,
    day,
  );
  return row ? mapRow(row) : null;
}

export async function getDailyStatsRange(
  db: DatabaseConnection,
  fromDay: string,
  toDay: string,
): Promise<DailyStats[]> {
  const rows = await db.getAllAsync<DailyStatsRow>(
    `SELECT day, xp, seconds_active, questions, correct, goal_met
     FROM daily_stats
     WHERE day >= ? AND day <= ?
     ORDER BY day ASC`,
    fromDay,
    toDay,
  );
  return rows.map(mapRow);
}

export async function getAllDailyStats(db: DatabaseConnection): Promise<DailyStats[]> {
  const rows = await db.getAllAsync<DailyStatsRow>(
    `SELECT day, xp, seconds_active, questions, correct, goal_met
     FROM daily_stats ORDER BY day ASC`,
  );
  return rows.map(mapRow);
}

export async function saveDailyStats(db: DatabaseConnection, stats: DailyStats): Promise<void> {
  await db.runAsync(
    `INSERT INTO daily_stats (day, xp, seconds_active, questions, correct, goal_met)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET
       xp = excluded.xp,
       seconds_active = excluded.seconds_active,
       questions = excluded.questions,
       correct = excluded.correct,
       goal_met = excluded.goal_met`,
    stats.day,
    stats.xp,
    stats.secondsActive,
    stats.questions,
    stats.correct,
    stats.goalMet ? 1 : 0,
  );
}

/**
 * Atomically adds activity to a day. goal_met is computed by the caller and
 * passed as an absolute flag so the SQL stays a single upsert.
 */
export async function addDailyActivity(
  db: DatabaseConnection,
  day: string,
  delta: {
    xp: number;
    secondsActive: number;
    questions: number;
    correct: number;
    goalMet: boolean;
  },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO daily_stats (day, xp, seconds_active, questions, correct, goal_met)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET
       xp = daily_stats.xp + excluded.xp,
       seconds_active = daily_stats.seconds_active + excluded.seconds_active,
       questions = daily_stats.questions + excluded.questions,
       correct = daily_stats.correct + excluded.correct,
       goal_met = MAX(daily_stats.goal_met, excluded.goal_met)`,
    day,
    delta.xp,
    delta.secondsActive,
    delta.questions,
    delta.correct,
    delta.goalMet ? 1 : 0,
  );
}

export async function getTotalXp(db: DatabaseConnection): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(xp), 0) AS total FROM daily_stats',
  );
  return row?.total ?? 0;
}

export async function getTotalSeconds(db: DatabaseConnection): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(seconds_active), 0) AS total FROM daily_stats',
  );
  return row?.total ?? 0;
}

export async function clearDailyStats(db: DatabaseConnection): Promise<void> {
  await db.execAsync('DELETE FROM daily_stats');
}
