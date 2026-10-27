import type { ExerciseAttempt } from '@/features/exercises';
import {
  answerCurrentExercise,
  buildLessonProgress,
  currentExercise,
  isLessonRunComplete,
  itemForExercise,
  lessonStats,
  modeForExercise,
  startLessonRun,
} from '@/features/lessons/session';
import type { LessonRun } from '@/features/lessons/session';

import { makeValidBundle } from '../fixtures/content';

const bundle = makeValidBundle();
const unit = bundle.units[0]!;

function start(lessonIndex: number, seed = 7): LessonRun {
  const lesson = unit.lessons[lessonIndex];
  if (!lesson) throw new Error(`Fixture lesson ${lessonIndex} is missing`);
  return startLessonRun({ unit, lesson, seed, nowMs: 1000 });
}

function answer(run: LessonRun, attempt: ExerciseAttempt, at = 2000) {
  return answerCurrentExercise(run, attempt, at);
}

describe('lesson session', () => {
  it('starts at the first exercise with a stable seeded shuffle', () => {
    const first = start(0);
    const second = start(0);

    expect(first.lessonId).toBe('greetings-1');
    expect(first.unitId).toBe(unit.unit.id);
    expect(first.index).toBe(0);
    expect(first.attempts).toEqual([]);
    expect(first.exercises).toHaveLength(2);
    expect(second.exercises).toEqual(first.exercises);
    expect(currentExercise(first)?.id).toBe(first.exercises[0]?.id);
  });

  it('uses default generation when a lesson has no explicit exercises', () => {
    const lesson = structuredClone(unit.lessons[2]!);
    delete lesson.exercises;
    const run = startLessonRun({ unit, lesson, seed: 3, nowMs: 1000 });

    expect(run.exercises.length).toBeGreaterThan(2);
    expect(new Set(run.exercises.map((exercise) => exercise.kind))).toEqual(
      new Set(['meaning-choice', 'reverse-choice', 'sentence-builder', 'particle-cloze']),
    );
  });

  it('grades a correct choice, records the attempt and advances', () => {
    const run = start(0);
    const exercise = currentExercise(run);
    if (!exercise) throw new Error('Missing first exercise');
    if (exercise.kind !== 'meaning-choice' && exercise.kind !== 'reverse-choice') {
      throw new Error('Unexpected first exercise kind');
    }

    const result = answer(run, { kind: 'choice', optionId: exercise.correctOptionId });
    expect(result.correct).toBe(true);
    expect(result.run.index).toBe(1);
    expect(result.run.attempts).toEqual([
      {
        exerciseId: exercise.id,
        sourceId: exercise.sourceId,
        itemType: 'vocabulary',
        mode: exercise.kind,
        correct: true,
        at: 2000,
      },
    ]);
    expect(isLessonRunComplete(result.run)).toBe(false);
  });

  it('marks a wrong choice as incorrect but still advances', () => {
    const run = start(0);
    const exercise = currentExercise(run);
    if (!exercise || (exercise.kind !== 'meaning-choice' && exercise.kind !== 'reverse-choice')) {
      throw new Error('Unexpected first exercise');
    }
    const wrong = exercise.options.find((option) => option.id !== exercise.correctOptionId);
    if (!wrong) throw new Error('Missing distractor');

    const result = answer(run, { kind: 'choice', optionId: wrong.id });
    expect(result.correct).toBe(false);
    expect(result.run.attempts[0]?.correct).toBe(false);
  });

  it('grades sentence-builder tile orders by id', () => {
    const run = start(2);
    const exercise = currentExercise(run);
    if (!exercise || exercise.kind !== 'sentence-builder') {
      throw new Error('Expected a sentence-builder exercise');
    }

    const correct = answer(run, {
      kind: 'sentence-builder',
      orderedTileIds: exercise.correctTileIds,
    });
    expect(correct.correct).toBe(true);
    expect(correct.run.attempts[0]?.itemType).toBe('sentence');
    expect(correct.run.attempts[0]?.mode).toBe('sentence-builder');

    const wrong = answer(run, {
      kind: 'sentence-builder',
      orderedTileIds: [...exercise.correctTileIds].reverse(),
    });
    expect(wrong.correct).toBe(false);
  });

  it('grades particle cloze by the selected particle', () => {
    const lesson = structuredClone(unit.lessons[2]!);
    lesson.exercises = [
      {
        type: 'particle-cloze',
        sentenceId: 'obj-book-sentence',
        particleOptions: ['は', 'が'],
      },
    ];
    const run = startLessonRun({ unit, lesson, seed: 5, nowMs: 1000 });
    const exercise = currentExercise(run);
    if (!exercise || exercise.kind !== 'particle-cloze') {
      throw new Error('Expected a particle-cloze exercise');
    }

    expect(exercise.correctParticle).toBe('は');
    expect(answer(run, { kind: 'particle-cloze', particle: 'は' }).correct).toBe(true);
    expect(answer(run, { kind: 'particle-cloze', particle: 'が' }).correct).toBe(false);
    expect(modeForExercise(exercise)).toBe('particle-cloze');
    expect(itemForExercise(exercise)).toEqual({
      itemId: 'obj-book-sentence',
      itemType: 'sentence',
    });
  });

  it('completes after the last exercise and refuses extra answers', () => {
    let run = start(2);
    const exercise = currentExercise(run);
    if (!exercise || exercise.kind !== 'sentence-builder') {
      throw new Error('Expected a sentence-builder exercise');
    }

    run = answer(run, {
      kind: 'sentence-builder',
      orderedTileIds: exercise.correctTileIds,
    }).run;
    expect(isLessonRunComplete(run)).toBe(true);
    expect(currentExercise(run)).toBeNull();
    expect(lessonStats(run)).toEqual({ answered: 1, correct: 1, accuracy: 1 });

    expect(() => answer(run, { kind: 'choice', optionId: 'x' })).toThrow(
      'Lesson run is already complete',
    );
  });

  it('maps exercise kinds to item kinds and review modes', () => {
    const run = start(0);
    const meaning = run.exercises.find((exercise) => exercise.kind === 'meaning-choice');
    const reverse = run.exercises.find((exercise) => exercise.kind === 'reverse-choice');
    if (!meaning || !reverse) throw new Error('Missing choice exercises');

    expect(modeForExercise(meaning)).toBe('meaning-choice');
    expect(modeForExercise(reverse)).toBe('reverse-choice');
    expect(itemForExercise(meaning).itemType).toBe('vocabulary');
    expect(itemForExercise(reverse).itemType).toBe('vocabulary');
  });

  it('builds incomplete progress and preserves an earlier completion', () => {
    const run = start(0);
    const exercise = currentExercise(run);
    if (!exercise || (exercise.kind !== 'meaning-choice' && exercise.kind !== 'reverse-choice')) {
      throw new Error('Unexpected first exercise');
    }
    const answered = answer(run, {
      kind: 'choice',
      optionId: exercise.correctOptionId,
    }).run;

    const fresh = buildLessonProgress(answered, { at: 5000 });
    expect(fresh).toEqual({
      lessonId: 'greetings-1',
      unitId: unit.unit.id,
      completed: false,
      startedAt: 1000,
      completedAt: 0,
      lastStudiedAt: 5000,
      questions: 1,
      correct: 1,
    });

    const repeated = buildLessonProgress(answered, {
      at: 6000,
      previous: {
        ...fresh,
        completed: true,
        startedAt: 500,
        completedAt: 4000,
      },
    });
    expect(repeated.completed).toBe(true);
    expect(repeated.startedAt).toBe(500);
    expect(repeated.completedAt).toBe(4000);
    expect(repeated.lastStudiedAt).toBe(6000);
  });

  it('stamps completedAt when every exercise is answered', () => {
    let run = start(0);
    while (!isLessonRunComplete(run)) {
      const exercise = currentExercise(run);
      if (!exercise) throw new Error('Missing exercise');
      if (exercise.kind === 'meaning-choice' || exercise.kind === 'reverse-choice') {
        run = answer(run, { kind: 'choice', optionId: exercise.correctOptionId }, 3000).run;
      } else if (exercise.kind === 'sentence-builder') {
        run = answer(
          run,
          { kind: 'sentence-builder', orderedTileIds: exercise.correctTileIds },
          3000,
        ).run;
      } else if (exercise.kind === 'particle-cloze') {
        run = answer(run, { kind: 'particle-cloze', particle: exercise.correctParticle }, 3000).run;
      } else {
        throw new Error('Unexpected exercise kind');
      }
    }

    const progress = buildLessonProgress(run, { at: 9000 });
    expect(progress.completed).toBe(true);
    expect(progress.questions).toBe(2);
    expect(progress.correct).toBe(2);
    expect(progress.completedAt).toBe(9000);
  });
});
