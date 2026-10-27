import type { DatabaseConnection } from '@/db/types';
import type { LessonProgress } from '@/types/srs';

type LessonProgressRow = {
  lesson_id: string;
  unit_id: string;
  completed: number;
  started_at: number;
  completed_at: number;
  last_studied_at: number;
  questions: number;
  correct: number;
};

function mapRow(row: LessonProgressRow): LessonProgress {
  return {
    lessonId: row.lesson_id,
    unitId: row.unit_id,
    completed: row.completed === 1,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    lastStudiedAt: row.last_studied_at,
    questions: row.questions,
    correct: row.correct,
  };
}

export async function getLessonProgress(
  db: DatabaseConnection,
  lessonId: string,
): Promise<LessonProgress | null> {
  const row = await db.getFirstAsync<LessonProgressRow>(
    `SELECT lesson_id, unit_id, completed, started_at, completed_at,
            last_studied_at, questions, correct
     FROM lesson_progress WHERE lesson_id = ?`,
    lessonId,
  );
  return row ? mapRow(row) : null;
}

export async function getAllLessonProgress(db: DatabaseConnection): Promise<LessonProgress[]> {
  const rows = await db.getAllAsync<LessonProgressRow>(
    `SELECT lesson_id, unit_id, completed, started_at, completed_at,
            last_studied_at, questions, correct
     FROM lesson_progress
     ORDER BY unit_id ASC, lesson_id ASC`,
  );
  return rows.map(mapRow);
}

export async function saveLessonProgress(
  db: DatabaseConnection,
  progress: LessonProgress,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO lesson_progress (
       lesson_id, unit_id, completed, started_at, completed_at,
       last_studied_at, questions, correct
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(lesson_id) DO UPDATE SET
       unit_id = excluded.unit_id,
       completed = excluded.completed,
       started_at = CASE
         WHEN lesson_progress.started_at = 0 THEN excluded.started_at
         ELSE lesson_progress.started_at
       END,
       completed_at = excluded.completed_at,
       last_studied_at = excluded.last_studied_at,
       questions = excluded.questions,
       correct = excluded.correct`,
    progress.lessonId,
    progress.unitId,
    progress.completed ? 1 : 0,
    progress.startedAt,
    progress.completedAt,
    progress.lastStudiedAt,
    progress.questions,
    progress.correct,
  );
}

export async function saveManyLessonProgress(
  db: DatabaseConnection,
  items: readonly LessonProgress[],
): Promise<void> {
  for (const item of items) {
    await saveLessonProgress(db, item);
  }
}

export async function clearLessonProgress(db: DatabaseConnection): Promise<void> {
  await db.execAsync('DELETE FROM lesson_progress');
}
