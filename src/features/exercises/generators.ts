import type { Lesson, SentenceItem, VocabItem } from '@/features/content';
import { type Rng, shuffle } from '@/utils/random';

import type {
  ChoiceExercise,
  ChoiceExerciseOption,
  ClozePiece,
  GeneratedExercise,
  ParticleClozeExercise,
  SentenceBuilderExercise,
  SentenceBuilderTile,
} from './types';

export const DEFAULT_OPTION_COUNT = 4;
export const MIN_OPTION_COUNT = 2;
export const MAX_OPTION_COUNT = 6;

/** Common beginner particles used when a template omits `particleOptions`. */
export const DEFAULT_PARTICLE_OPTIONS = ['は', 'が', 'を', 'に', 'で', 'と', 'も', 'へ'] as const;

export type ExerciseContentPool = {
  vocabulary: readonly VocabItem[];
  sentences: readonly SentenceItem[];
};

export type ExerciseBuildOptions = {
  unitId: string;
  lessonId: string;
  rng: Rng;
  optionCount?: number;
};

export type ExerciseGenerationContext = {
  unitId: string;
  lesson: Lesson;
  pool: ExerciseContentPool;
  /** Distractors may come from the whole unit while prompts stay in the lesson. */
  distractorPool?: ExerciseContentPool;
  rng: Rng;
  optionCount?: number;
};

function clampOptionCount(value: number | undefined): number {
  const requested = value ?? DEFAULT_OPTION_COUNT;
  if (!Number.isFinite(requested)) return DEFAULT_OPTION_COUNT;
  return Math.max(MIN_OPTION_COUNT, Math.min(MAX_OPTION_COUNT, Math.trunc(requested)));
}

function positiveOptions(options: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const option of options) {
    const trimmed = option.trim();
    if (trimmed === '' || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

function uniqueBy<T>(items: readonly T[], keyOf: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyOf(item).trim().toLowerCase();
    if (key === '' || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

/** Deduplicates on several display languages at once. */
function uniqueByTexts<T>(items: readonly T[], textsOf: (item: T) => readonly string[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const texts = textsOf(item)
      .map((text) => text.trim().toLowerCase())
      .filter((text) => text !== '');
    if (texts.length === 0 || texts.some((text) => seen.has(text))) continue;
    for (const text of texts) seen.add(text);
    result.push(item);
  }
  return result;
}

function promptFromVocab(item: VocabItem) {
  return {
    ja: item.ja,
    reading: item.reading,
    ...(item.segments ? { segments: item.segments.map((segment) => ({ ...segment })) } : {}),
  };
}

/**
 * Japanese prompt with four meaning options. Distractors are sampled from
 * `pool`, excluding duplicate ids and duplicate meanings in either language.
 */
export function buildMeaningChoice(
  item: VocabItem,
  pool: readonly VocabItem[],
  options: ExerciseBuildOptions,
): ChoiceExercise | null {
  const optionCount = clampOptionCount(options.optionCount);
  const correctEn = item.meaningEn.trim().toLowerCase();
  const correctUr = item.meaningUr.trim();
  const candidates = uniqueByTexts(
    pool.filter(
      (candidate) =>
        candidate.id !== item.id &&
        candidate.meaningEn.trim().toLowerCase() !== correctEn &&
        candidate.meaningUr.trim() !== correctUr,
    ),
    (candidate) => [candidate.meaningEn, candidate.meaningUr],
  );

  const selected = shuffle(candidates, options.rng).slice(0, optionCount - 1);
  if (selected.length === 0) return null;

  const correct: ChoiceExerciseOption = {
    id: item.id,
    en: item.meaningEn,
    ur: item.meaningUr,
  };
  const choiceOptions = shuffle(
    [
      correct,
      ...selected.map((candidate): ChoiceExerciseOption => ({
        id: candidate.id,
        en: candidate.meaningEn,
        ur: candidate.meaningUr,
      })),
    ],
    options.rng,
  );

  return {
    kind: 'meaning-choice',
    id: `${options.lessonId}:meaning:${item.id}`,
    sourceId: item.id,
    unitId: options.unitId,
    lessonId: options.lessonId,
    prompt: promptFromVocab(item),
    options: choiceOptions,
    correctOptionId: item.id,
  };
}

/**
 * Meaning prompt with Japanese options. Options include their readings so the
 * UI can render furigana or a reading hint.
 */
export function buildReverseChoice(
  item: VocabItem,
  pool: readonly VocabItem[],
  options: ExerciseBuildOptions,
): ChoiceExercise | null {
  const optionCount = clampOptionCount(options.optionCount);
  const candidates = uniqueBy(
    pool.filter((candidate) => candidate.id !== item.id && candidate.ja !== item.ja),
    (candidate) => candidate.ja,
  );

  const selected = shuffle(candidates, options.rng).slice(0, optionCount - 1);
  if (selected.length === 0) return null;

  const correct: ChoiceExerciseOption = {
    id: item.id,
    ja: item.ja,
    reading: item.reading,
  };
  const choiceOptions = shuffle(
    [
      correct,
      ...selected.map((candidate): ChoiceExerciseOption => ({
        id: candidate.id,
        ja: candidate.ja,
        reading: candidate.reading,
      })),
    ],
    options.rng,
  );

  return {
    kind: 'reverse-choice',
    id: `${options.lessonId}:reverse:${item.id}`,
    sourceId: item.id,
    unitId: options.unitId,
    lessonId: options.lessonId,
    prompt: { en: item.meaningEn, ur: item.meaningUr },
    options: choiceOptions,
    correctOptionId: item.id,
  };
}

function tileIdFor(sentenceId: string, index: number): string {
  return `${sentenceId}:tile:${index}`;
}

/**
 * Converts a surface order into tile ids. Rejects orders that are not a full
 * permutation of the sentence tokens, so malformed authored alternates cannot
 * teach an impossible answer.
 */
function surfaceOrderToTileIds(order: readonly string[], sentence: SentenceItem): string[] | null {
  if (order.length !== sentence.tokens.length) return null;
  const used = new Set<number>();
  const ids: string[] = [];

  for (const surface of order) {
    let match = -1;
    for (let index = 0; index < sentence.tokens.length; index += 1) {
      const token = sentence.tokens[index];
      if (!used.has(index) && token?.surface === surface) {
        match = index;
        break;
      }
    }
    if (match === -1) return null;
    used.add(match);
    ids.push(tileIdFor(sentence.id, match));
  }

  return used.size === sentence.tokens.length ? ids : null;
}

/**
 * Shuffled token tiles plus every accepted order (canonical first). The answer
 * is graded by tile ids, which stays unambiguous when a surface repeats.
 */
export function buildSentenceBuilder(
  sentence: SentenceItem,
  options: ExerciseBuildOptions,
  acceptedOrders: readonly (readonly string[])[] = [],
): SentenceBuilderExercise | null {
  if (sentence.tokens.length === 0) return null;

  const canonicalIds = sentence.tokens.map((_token, index) => tileIdFor(sentence.id, index));

  const accepted = [canonicalIds];
  const seen = new Set([canonicalIds.join('\u0000')]);
  for (const order of acceptedOrders) {
    const ids = surfaceOrderToTileIds(order, sentence);
    if (!ids) continue;
    const key = ids.join('\u0000');
    if (seen.has(key)) continue;
    seen.add(key);
    accepted.push(ids);
  }

  const tiles: SentenceBuilderTile[] = sentence.tokens.map((token, index) => ({
    id: tileIdFor(sentence.id, index),
    surface: token.surface,
    ...(token.reading ? { reading: token.reading } : {}),
  }));

  return {
    kind: 'sentence-builder',
    id: `${options.lessonId}:builder:${sentence.id}`,
    sourceId: sentence.id,
    unitId: options.unitId,
    lessonId: options.lessonId,
    prompt: { en: sentence.translationEn, ur: sentence.translationUr },
    tiles: shuffle(tiles, options.rng),
    acceptedOrders: accepted,
    correctTileIds: canonicalIds,
  };
}

/**
 * Replaces one particle token with a blank. When `blankIndex` is absent the
 * first token whose surface is one of the options is used. Returns null when
 * the sentence has no such token or fewer than two options.
 */
export function buildParticleCloze(
  sentence: SentenceItem,
  particleOptions: readonly string[],
  options: ExerciseBuildOptions,
  blankIndex?: number,
): ParticleClozeExercise | null {
  const candidates = positiveOptions(particleOptions);
  if (candidates.length < 2) return null;

  let index = -1;
  if (blankIndex !== undefined) {
    if (!Number.isInteger(blankIndex) || blankIndex < 0 || blankIndex >= sentence.tokens.length) {
      return null;
    }
    const token = sentence.tokens[blankIndex];
    if (!token || !candidates.includes(token.surface)) return null;
    index = blankIndex;
  } else {
    index = sentence.tokens.findIndex((token) => candidates.includes(token.surface));
  }
  if (index === -1) return null;

  const correctParticle = sentence.tokens[index]?.surface;
  if (!correctParticle) return null;

  const pieces: ClozePiece[] = sentence.tokens.map((token, tokenIndex) =>
    tokenIndex === index
      ? { kind: 'blank' }
      : {
          kind: 'text',
          text: token.surface,
          ...(token.reading ? { reading: token.reading } : {}),
        },
  );

  return {
    kind: 'particle-cloze',
    id: `${options.lessonId}:cloze:${sentence.id}`,
    sourceId: sentence.id,
    unitId: options.unitId,
    lessonId: options.lessonId,
    prompt: { en: sentence.translationEn, ur: sentence.translationUr },
    pieces,
    options: shuffle(candidates, options.rng),
    correctParticle,
  };
}

function findVocab(pool: readonly VocabItem[], id: string | undefined): VocabItem | null {
  if (!id) return null;
  return pool.find((item) => item.id === id) ?? null;
}

function findSentence(pool: readonly SentenceItem[], id: string | undefined): SentenceItem | null {
  if (!id) return null;
  return pool.find((item) => item.id === id) ?? null;
}

function uniqueExerciseIds(exercises: readonly GeneratedExercise[]): GeneratedExercise[] {
  const seen = new Set<string>();
  return exercises.map((exercise) => {
    let id = exercise.id;
    let suffix = 2;
    while (seen.has(id)) {
      id = `${exercise.id}:${suffix}`;
      suffix += 1;
    }
    seen.add(id);
    return { ...exercise, id };
  });
}

function buildFromTemplate(
  template: NonNullable<Lesson['exercises']>[number],
  context: ExerciseGenerationContext,
): GeneratedExercise | null {
  const options: ExerciseBuildOptions = {
    unitId: context.unitId,
    lessonId: context.lesson.id,
    rng: context.rng,
    optionCount: context.optionCount,
  };
  const distractorPool = context.distractorPool ?? context.pool;

  switch (template.type) {
    case 'meaning-choice': {
      const item = findVocab(context.pool.vocabulary, template.itemId);
      if (!item) return null;
      return buildMeaningChoice(item, distractorPool.vocabulary, options);
    }
    case 'reverse-choice': {
      const item = findVocab(context.pool.vocabulary, template.itemId);
      if (!item) return null;
      return buildReverseChoice(item, distractorPool.vocabulary, options);
    }
    case 'sentence-builder': {
      const sentence = findSentence(context.pool.sentences, template.sentenceId);
      if (!sentence) return null;
      return buildSentenceBuilder(sentence, options, template.acceptedOrders ?? []);
    }
    case 'particle-cloze': {
      const sentence = findSentence(context.pool.sentences, template.sentenceId);
      if (!sentence) return null;
      return buildParticleCloze(
        sentence,
        template.particleOptions ?? DEFAULT_PARTICLE_OPTIONS,
        options,
      );
    }
    default:
      return null;
  }
}

/**
 * Default lesson set: both directions for each vocabulary item, a sentence
 * builder for each sentence and a particle cloze when a common particle is
 * present. Explicit `lesson.exercises` replaces this set entirely.
 */
export function generateDefaultExercises(context: ExerciseGenerationContext): GeneratedExercise[] {
  const options: ExerciseBuildOptions = {
    unitId: context.unitId,
    lessonId: context.lesson.id,
    rng: context.rng,
    optionCount: context.optionCount,
  };
  const generated: GeneratedExercise[] = [];
  const seen = new Set<string>();

  for (const ref of context.lesson.items) {
    if (seen.has(ref.id)) continue;
    seen.add(ref.id);

    const vocab = findVocab(context.pool.vocabulary, ref.id);
    if (vocab) {
      const meaning = buildMeaningChoice(vocab, context.pool.vocabulary, options);
      if (meaning) generated.push(meaning);
      const reverse = buildReverseChoice(vocab, context.pool.vocabulary, options);
      if (reverse) generated.push(reverse);
      continue;
    }

    const sentence = findSentence(context.pool.sentences, ref.id);
    if (!sentence) continue;
    const builder = buildSentenceBuilder(sentence, options);
    if (builder) generated.push(builder);
    const cloze = buildParticleCloze(sentence, DEFAULT_PARTICLE_OPTIONS, options);
    if (cloze) generated.push(cloze);
  }

  return uniqueExerciseIds(generated);
}

/**
 * Builds the concrete exercise list for a lesson. Explicit templates are used
 * when present; otherwise a sensible default set is generated from the lesson
 * items. Unsupported template types are skipped so later exercise types can be
 * added without breaking older lessons.
 */
export function generateLessonExercises(context: ExerciseGenerationContext): GeneratedExercise[] {
  const templates = context.lesson.exercises ?? [];
  if (templates.length === 0) return generateDefaultExercises(context);

  const exercises: GeneratedExercise[] = [];
  for (const template of templates) {
    const exercise = buildFromTemplate(template, context);
    if (exercise) exercises.push(exercise);
  }
  return uniqueExerciseIds(exercises);
}
