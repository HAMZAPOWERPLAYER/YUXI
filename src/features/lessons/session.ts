import type { Lesson, UnitFile } from '@/features/content';
import {
  type ExerciseAttempt,
  type GeneratedExercise,
  generateLessonExercises,
  isExerciseAnswerCorrect,
} from '@/features/exercises';
import type { LearningItemType, LessonProgress, ReviewMode } from '@/types/srs';
import { createRng } from '@/utils/random';

/** One saved answer inside a lesson run. */
export type LessonAttemptRecord = {
  exerciseId: string;
  sourceId: string;
  itemType: LearningItemType;
  mode: ReviewMode;
  correct: boolean;
  at: number;
};

export type LessonRun = {
  unitId: string;
  lessonId: string;
  exercises: GeneratedExercise[];
  /** Index of the exercise waiting for an answer; equals `exercises.length` when done. */
  index: number;
  attempts: LessonAttemptRecord[];
  startedAt: number;
};

export type LessonAnswerResult = {
  run: LessonRun;
  exercise: GeneratedExercise;
  attempt: ExerciseAttempt;
  correct: boolean;
};

export type LessonStats = {
  answered: number;
  correct: number;
  /** 0–1, or 0 when nothing has been answered. */
  accuracy: number;
};

export type StartLessonRunInput = {
  unit: UnitFile;
  lesson: Lesson;
  seed: number;
  nowMs: number;
  optionCount?: number;
};

/**
 * Builds a fresh run. Prompts come from the lesson, while distractors may use
 * the whole unit so options are not limited to the current few words.
 */
export function startLessonRun(input: StartLessonRunInput): LessonRun {
  const exercises = generateLessonExercises({
    unitId: input.unit.unit.id,
    lesson: input.lesson,
    pool: {
      vocabulary: input.unit.vocabulary,
      sentences: input.unit.sentences,
    },
    rng: createRng(input.seed),
    ...(input.optionCount === undefined ? {} : { optionCount: input.optionCount }),
  });

  return {
    unitId: input.unit.unit.id,
    lessonId: input.lesson.id,
    exercises,
    index: 0,
    attempts: [],
    startedAt: input.nowMs,
  };
}

export function currentExercise(run: LessonRun): GeneratedExercise | null {
  return run.exercises[run.index] ?? null;
}

export function isLessonRunComplete(run: LessonRun): boolean {
  return run.index >= run.exercises.length;
}

export function modeForExercise(exercise: GeneratedExercise): ReviewMode {
  switch (exercise.kind) {
    case 'meaning-choice':
      return 'meaning-choice';
    case 'reverse-choice':
      return 'reverse-choice';
    case 'sentence-builder':
      return 'sentence-builder';
    case 'particle-cloze':
      return 'particle-cloze';
  }
}

/** Choice exercises grade vocabulary; builders and cloze grade sentences. */
export function itemForExercise(exercise: GeneratedExercise): {
  itemId: string;
  itemType: 'vocabulary' | 'sentence';
} {
  return {
    itemId: exercise.sourceId,
    itemType:
      exercise.kind === 'meaning-choice' || exercise.kind === 'reverse-choice'
        ? 'vocabulary'
        : 'sentence',
  };
}

/**
 * Grades the attempt and advances the run. Throws when called after the last
 * exercise so a UI bug cannot silently append answers forever.
 */
export function answerCurrentExercise(
  run: LessonRun,
  attempt: ExerciseAttempt,
  at: number,
): LessonAnswerResult {
  const exercise = currentExercise(run);
  if (!exercise) throw new Error('Lesson run is already complete');

  const correct = isExerciseAnswerCorrect(exercise, attempt);
  const item = itemForExercise(exercise);
  const record: LessonAttemptRecord = {
    exerciseId: exercise.id,
    sourceId: item.itemId,
    itemType: item.itemType,
    mode: modeForExercise(exercise),
    correct,
    at,
  };

  return {
    run: {
      ...run,
      index: run.index + 1,
      attempts: [...run.attempts, record],
    },
    exercise,
    attempt,
    correct,
  };
}

export function lessonStats(run: LessonRun): LessonStats {
  const correct = run.attempts.filter((attempt) => attempt.correct).length;
  return {
    answered: run.attempts.length,
    correct,
    accuracy: run.attempts.length > 0 ? correct / run.attempts.length : 0,
  };
}

export type BuildLessonProgressOptions = {
  at: number;
  previous?: LessonProgress | null;
};

/**
 * Converts a run into the row saved in `lesson_progress`. A completed lesson
 * stays completed if the learner repeats it and leaves part-way through, and
 * the original completion time is kept when a repeat also finishes.
 */
export function buildLessonProgress(
  run: LessonRun,
  options: BuildLessonProgressOptions,
): LessonProgress {
  const complete = isLessonRunComplete(run);
  const stats = lessonStats(run);
  const previous = options.previous ?? null;

  return {
    lessonId: run.lessonId,
    unitId: run.unitId,
    completed: previous?.completed === true || complete,
    startedAt: previous && previous.startedAt > 0 ? previous.startedAt : run.startedAt,
    completedAt: complete ? previous?.completedAt || options.at : (previous?.completedAt ?? 0),
    lastStudiedAt: options.at,
    questions: stats.answered,
    correct: stats.correct,
  };
}
