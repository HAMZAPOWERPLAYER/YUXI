import type { ExerciseAttempt, GeneratedExercise } from './types';

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

/**
 * Grades an attempt without mutating it. Sentence builders accept any authored
 * alternate order; choice answers are matched by stable option id.
 */
export function isExerciseAnswerCorrect(
  exercise: GeneratedExercise,
  attempt: ExerciseAttempt,
): boolean {
  switch (exercise.kind) {
    case 'meaning-choice':
    case 'reverse-choice':
      return attempt.kind === 'choice' && attempt.optionId === exercise.correctOptionId;
    case 'sentence-builder':
      return (
        attempt.kind === 'sentence-builder' &&
        exercise.acceptedOrders.some((order) => arraysEqual(order, attempt.orderedTileIds))
      );
    case 'particle-cloze':
      return attempt.kind === 'particle-cloze' && attempt.particle === exercise.correctParticle;
  }
}
