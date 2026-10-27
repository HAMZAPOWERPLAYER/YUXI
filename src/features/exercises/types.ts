import type { FuriganaSegment } from '@/features/content';

/** Exercise kinds that the Part 2 generators can build today. */
export const GENERATED_EXERCISE_KINDS = [
  'meaning-choice',
  'reverse-choice',
  'sentence-builder',
  'particle-cloze',
] as const;

export type GeneratedExerciseKind = (typeof GENERATED_EXERCISE_KINDS)[number];

/**
 * A prompt is language-complete: callers pick the fields for the active
 * language. Japanese prompts keep their authored furigana segments.
 */
export type ExercisePrompt = {
  ja?: string;
  reading?: string;
  segments?: FuriganaSegment[];
  en?: string;
  ur?: string;
};

export type ChoiceExerciseOption = {
  /** Stable identity; for generated options this is the source item id. */
  id: string;
  ja?: string;
  reading?: string;
  en?: string;
  ur?: string;
};

export type ChoiceExercise = {
  kind: 'meaning-choice' | 'reverse-choice';
  id: string;
  sourceId: string;
  unitId: string;
  lessonId: string;
  prompt: ExercisePrompt;
  options: ChoiceExerciseOption[];
  correctOptionId: string;
};

export type SentenceBuilderTile = {
  /** Stable inside one exercise, derived from the canonical token index. */
  id: string;
  surface: string;
  reading?: string;
};

export type SentenceBuilderExercise = {
  kind: 'sentence-builder';
  id: string;
  sourceId: string;
  unitId: string;
  lessonId: string;
  prompt: ExercisePrompt;
  /** Tiles in display order; compare ids, not this order. */
  tiles: SentenceBuilderTile[];
  /** Accepted tile-id orders, canonical first. */
  acceptedOrders: string[][];
  /** Canonical tile-id order. */
  correctTileIds: string[];
};

export type ClozeTextPiece = {
  kind: 'text';
  text: string;
  reading?: string;
};

export type ClozeBlankPiece = {
  kind: 'blank';
};

export type ClozePiece = ClozeTextPiece | ClozeBlankPiece;

export type ParticleClozeExercise = {
  kind: 'particle-cloze';
  id: string;
  sourceId: string;
  unitId: string;
  lessonId: string;
  /** The translation prompt; the Japanese sentence stays hidden until grading. */
  prompt: ExercisePrompt;
  pieces: ClozePiece[];
  /** Shuffled options, including `correctParticle`. */
  options: string[];
  correctParticle: string;
};

export type GeneratedExercise = ChoiceExercise | SentenceBuilderExercise | ParticleClozeExercise;

export type ExerciseAttempt =
  | { kind: 'choice'; optionId: string }
  | { kind: 'sentence-builder'; orderedTileIds: readonly string[] }
  | { kind: 'particle-cloze'; particle: string };
