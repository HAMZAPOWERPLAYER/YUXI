import {
  getAllMeta,
  getDailyStats,
  getLessonProgress,
  getReviewLogBetween,
  getSrsItem,
} from '@/db/repositories';
import { runMigrations } from '@/db/migrations/runner';
import type { ExerciseAttempt } from '@/features/exercises';
import {
  answerCurrentExercise,
  currentExercise,
  finishLessonRun,
  isLessonRunComplete,
  recordLessonExerciseAnswer,
  startLessonRun,
} from '@/features/lessons';
import type { LessonRun } from '@/features/lessons';
import { SESSION_META_PREFIX } from '@/features/study';
import { toLocalDayKey } from '@/utils/date';

import { makeValidUnit } from '../fixtures/content';
import { createTestDatabase, type TestDatabase } from '../helpers/testDatabase';

const AT = new Date(2026, 4, 10, 12, 0, 0).getTime();
const DAY = toLocalDayKey(AT);

const unit = makeValidUnit();

function start(lessonIndex: number): LessonRun {
  const lesson = unit.lessons[lessonIndex];
  if (!lesson) throw new Error(`Fixture lesson ${lessonIndex} is missing`);
  return startLessonRun({ unit, lesson, seed: 11, nowMs: AT });
}

function correctAttempt(run: LessonRun): ExerciseAttempt {
  const exercise = currentExercise(run);
  if (!exercise) throw new Error('Run is complete');
  switch (exercise.kind) {
    case 'meaning-choice':
    case 'reverse-choice':
      return { kind: 'choice', optionId: exercise.correctOptionId };
    case 'sentence-builder':
      return { kind: 'sentence-builder', orderedTileIds: exercise.correctTileIds };
    case 'particle-cloze':
      return { kind: 'particle-cloze', particle: exercise.correctParticle };
  }
}

describe('lesson service', () => {
  let db: TestDatabase;

  beforeEach(async () => {
    db = await createTestDatabase();
    await runMigrations(db);
  });

  afterEach(() => {
    db.close();
  });

  it('records a vocabulary answer through the shared SRS and stats path', async () => {
    const run = start(0);
    const exercise = currentExercise(run);
    if (!exercise) throw new Error('Missing exercise');

    const saved = await recordLessonExerciseAnswer(db, {
      exercise,
      correct: true,
      responseMs: 1200,
      at: AT,
      activeSeconds: 30,
      dailyGoalMinutes: 10,
    });

    expect(saved.itemType).toBe('vocabulary');
    expect(saved.itemId).toBe(exercise.sourceId);
    expect(saved.xpEarned).toBeGreaterThan(0);

    const item = await getSrsItem(db, exercise.sourceId, 'vocabulary');
    expect(item?.seen).toBe(1);
    expect(item?.correct).toBe(1);

    const stats = await getDailyStats(db, DAY);
    expect(stats?.questions).toBe(1);
    expect(stats?.correct).toBe(1);

    const log = await getReviewLogBetween(db, AT - 1, AT + 1);
    expect(log).toEqual([
      expect.objectContaining({
        itemId: exercise.sourceId,
        itemType: 'vocabulary',
        correct: true,
        responseMs: 1200,
        at: AT,
      }),
    ]);
  });

  it('records sentence exercises as sentence SRS items', async () => {
    const run = start(2);
    const exercise = currentExercise(run);
    if (!exercise) throw new Error('Missing exercise');

    const saved = await recordLessonExerciseAnswer(db, {
      exercise,
      correct: true,
      responseMs: 800,
      at: AT,
      activeSeconds: 0,
      dailyGoalMinutes: 5,
    });

    expect(saved.itemType).toBe('sentence');
    expect(saved.mode).toBe('sentence-builder');
    expect(await getSrsItem(db, 'obj-book-sentence', 'sentence')).not.toBeNull();
  });

  it('persists a partial run without completing the lesson or awarding a bonus', async () => {
    const run = start(0);
    const attempt = correctAttempt(run);
    const answered = answerCurrentExercise(run, attempt, AT);

    const finished = await finishLessonRun(db, {
      run: answered.run,
      at: AT,
      dailyGoalMinutes: 10,
    });

    expect(finished.bonusXp).toBe(0);
    expect(finished.progress.completed).toBe(false);
    expect(finished.progress.questions).toBe(1);
    expect(finished.progress.correct).toBe(1);

    const stored = await getLessonProgress(db, run.lessonId);
    expect(stored?.completed).toBe(false);
    expect(stored?.completedAt).toBe(0);

    const meta = await getAllMeta(db);
    expect(meta[`${SESSION_META_PREFIX}${DAY}`]).toBeUndefined();
  });

  it('awards the completion bonus once and keeps completed lessons reviewable', async () => {
    let run = start(0);
    while (!isLessonRunComplete(run)) {
      const answered = answerCurrentExercise(run, correctAttempt(run), AT);
      run = answered.run;
    }

    const first = await finishLessonRun(db, {
      run,
      at: AT,
      dailyGoalMinutes: 10,
    });

    expect(first.bonusXp).toBe(20);
    expect(first.progress.completed).toBe(true);
    expect(first.progress.completedAt).toBe(AT);
    expect(first.progress.questions).toBe(run.exercises.length);

    const stored = await getLessonProgress(db, run.lessonId);
    expect(stored?.completed).toBe(true);

    const statsAfterFirst = await getDailyStats(db, DAY);
    const meta = await getAllMeta(db);
    expect(meta[`${SESSION_META_PREFIX}${DAY}`]).toBe('1');

    const repeat = await finishLessonRun(db, {
      run,
      at: AT + 1000,
      dailyGoalMinutes: 10,
    });

    expect(repeat.bonusXp).toBe(0);
    expect(repeat.progress.completed).toBe(true);
    expect(repeat.progress.completedAt).toBe(AT);

    const statsAfterRepeat = await getDailyStats(db, DAY);
    expect(statsAfterRepeat?.xp).toBe(statsAfterFirst?.xp);
  });
});
