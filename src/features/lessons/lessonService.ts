import { getLessonProgress, saveLessonProgress } from '@/db/repositories';
import type { DatabaseConnection } from '@/db/types';
import type { GeneratedExercise } from '@/features/exercises';
import type { DailyGoalMinutes } from '@/features/settings/settingsModel';
import { completeSession, recordItemAnswer } from '@/features/study';
import type { LessonProgress } from '@/types/srs';

import { type LessonRun, buildLessonProgress, itemForExercise, modeForExercise } from './session';

export type RecordLessonExerciseInput = {
  exercise: GeneratedExercise;
  correct: boolean;
  responseMs: number;
  at: number;
  activeSeconds: number;
  dailyGoalMinutes: DailyGoalMinutes;
};

export type RecordLessonExerciseResult = {
  xpEarned: number;
  itemId: string;
  itemType: 'vocabulary' | 'sentence';
  mode: ReturnType<typeof modeForExercise>;
};

/** Writes one lesson answer through the shared SRS and daily-stats path. */
export async function recordLessonExerciseAnswer(
  db: DatabaseConnection,
  input: RecordLessonExerciseInput,
): Promise<RecordLessonExerciseResult> {
  const item = itemForExercise(input.exercise);
  const mode = modeForExercise(input.exercise);
  const result = await recordItemAnswer(db, {
    itemId: item.itemId,
    itemType: item.itemType,
    mode,
    correct: input.correct,
    responseMs: input.responseMs,
    at: input.at,
    dailyGoalMinutes: input.dailyGoalMinutes,
    activeSeconds: input.activeSeconds,
  });

  return {
    xpEarned: result.xpEarned,
    itemId: item.itemId,
    itemType: item.itemType,
    mode,
  };
}

export type FinishLessonInput = {
  run: LessonRun;
  previous?: LessonProgress | null;
  at: number;
  dailyGoalMinutes: DailyGoalMinutes;
};

export type FinishLessonResult = {
  progress: LessonProgress;
  bonusXp: number;
};

/**
 * Persists the current run. Completing a lesson for the first time also marks
 * the day and awards the session bonus; repeating it only records the stats,
 * so the bonus cannot be farmed by replaying one lesson. The stored row is the
 * source of truth so a stale in-memory copy cannot re-award the bonus.
 */
export async function finishLessonRun(
  db: DatabaseConnection,
  input: FinishLessonInput,
): Promise<FinishLessonResult> {
  const stored = await getLessonProgress(db, input.run.lessonId);
  const previous = stored ?? input.previous ?? null;
  const progress = buildLessonProgress(input.run, {
    at: input.at,
    previous,
  });
  await saveLessonProgress(db, progress);

  if (!progress.completed) return { progress, bonusXp: 0 };

  const alreadyCompleted = previous?.completed === true;
  const completion = await completeSession(db, {
    at: input.at,
    questionCount: alreadyCompleted ? 0 : progress.questions,
    dailyGoalMinutes: input.dailyGoalMinutes,
  });

  return { progress, bonusXp: completion.bonusXp };
}
