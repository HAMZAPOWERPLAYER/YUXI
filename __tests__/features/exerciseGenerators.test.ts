import {
  buildMeaningChoice,
  buildParticleCloze,
  buildReverseChoice,
  buildSentenceBuilder,
  generateDefaultExercises,
  generateLessonExercises,
  isExerciseAnswerCorrect,
} from '@/features/exercises';
import type { ExerciseGenerationContext } from '@/features/exercises';
import type { ContentBundle, Lesson, SentenceItem, VocabItem } from '@/features/content';
import { createRng } from '@/utils/random';

import { cloneBundle, makeValidBundle } from '../fixtures/content';

function unitOf(bundle: ContentBundle) {
  const unit = bundle.units[0];
  if (!unit) throw new Error('Fixture unit is missing');
  return unit;
}

function lessonOf(bundle: ContentBundle, index: number): Lesson {
  const lesson = unitOf(bundle).lessons[index];
  if (!lesson) throw new Error(`Fixture lesson ${index} is missing`);
  return lesson;
}

function vocabOf(bundle: ContentBundle, id: string): VocabItem {
  const item = unitOf(bundle).vocabulary.find((entry) => entry.id === id);
  if (!item) throw new Error(`Fixture vocabulary "${id}" is missing`);
  return item;
}

function sentenceOf(bundle: ContentBundle, id: string): SentenceItem {
  const item = unitOf(bundle).sentences.find((entry) => entry.id === id);
  if (!item) throw new Error(`Fixture sentence "${id}" is missing`);
  return item;
}

function contextFor(
  bundle: ContentBundle,
  lessonIndex: number,
  overrides: Partial<ExerciseGenerationContext> = {},
): ExerciseGenerationContext {
  const unit = unitOf(bundle);
  return {
    unitId: unit.unit.id,
    lesson: lessonOf(bundle, lessonIndex),
    pool: { sentences: unit.sentences, vocabulary: unit.vocabulary },
    rng: createRng(123),
    ...overrides,
  };
}

describe('buildMeaningChoice', () => {
  it('builds four unique options with the source item as the answer', () => {
    const bundle = makeValidBundle();
    const item = vocabOf(bundle, 'greet-ohayou');
    const exercise = buildMeaningChoice(item, unitOf(bundle).vocabulary, {
      unitId: 'unit-greetings',
      lessonId: 'greetings-1',
      rng: createRng(1),
    });

    expect(exercise).not.toBeNull();
    if (!exercise) return;
    expect(exercise.kind).toBe('meaning-choice');
    expect(exercise.prompt).toMatchObject({ ja: item.ja, reading: item.reading });
    expect(exercise.options).toHaveLength(4);
    expect(new Set(exercise.options.map((option) => option.id)).size).toBe(4);
    expect(exercise.options.map((option) => option.id)).toContain(exercise.correctOptionId);
    expect(exercise.correctOptionId).toBe(item.id);
    expect(exercise.options.find((option) => option.id === item.id)).toEqual({
      id: item.id,
      en: item.meaningEn,
      ur: item.meaningUr,
    });
  });

  it('keeps furigana segments on the prompt', () => {
    const bundle = makeValidBundle();
    const item = vocabOf(bundle, 'obj-hon');
    const exercise = buildMeaningChoice(item, unitOf(bundle).vocabulary, {
      unitId: 'unit-greetings',
      lessonId: 'objects-3',
      rng: createRng(2),
    });

    expect(exercise?.prompt.segments).toEqual(item.segments);
    expect(exercise?.prompt.ja).toBe('本');
  });

  it('honours the option count and falls back when there are too few distractors', () => {
    const bundle = makeValidBundle();
    const item = vocabOf(bundle, 'greet-ohayou');
    const twoOptions = buildMeaningChoice(item, unitOf(bundle).vocabulary, {
      unitId: 'unit-greetings',
      lessonId: 'greetings-1',
      rng: createRng(3),
      optionCount: 2,
    });
    expect(twoOptions?.options).toHaveLength(2);

    const impossible = buildMeaningChoice(item, [item], {
      unitId: 'unit-greetings',
      lessonId: 'greetings-1',
      rng: createRng(3),
    });
    expect(impossible).toBeNull();
  });

  it('is deterministic for the same seed', () => {
    const bundle = makeValidBundle();
    const item = vocabOf(bundle, 'greet-ohayou');
    const first = buildMeaningChoice(item, unitOf(bundle).vocabulary, {
      unitId: 'unit-greetings',
      lessonId: 'greetings-1',
      rng: createRng(99),
    });
    const second = buildMeaningChoice(item, unitOf(bundle).vocabulary, {
      unitId: 'unit-greetings',
      lessonId: 'greetings-1',
      rng: createRng(99),
    });
    expect(first).toEqual(second);
  });
});

describe('buildReverseChoice', () => {
  it('shows meanings as the prompt and Japanese as options', () => {
    const bundle = makeValidBundle();
    const item = vocabOf(bundle, 'intro-watashi');
    const exercise = buildReverseChoice(item, unitOf(bundle).vocabulary, {
      unitId: 'unit-greetings',
      lessonId: 'introductions-2',
      rng: createRng(4),
    });

    expect(exercise).not.toBeNull();
    if (!exercise) return;
    expect(exercise.prompt).toEqual({ en: item.meaningEn, ur: item.meaningUr });
    expect(exercise.prompt.ja).toBeUndefined();
    expect(exercise.options).toHaveLength(4);
    expect(exercise.options.find((option) => option.id === item.id)).toEqual({
      id: item.id,
      ja: item.ja,
      reading: item.reading,
    });
    expect(exercise.options.filter((option) => option.ja === item.ja)).toHaveLength(1);
  });
});

describe('buildSentenceBuilder', () => {
  it('shuffles tiles while keeping the canonical answer available', () => {
    const bundle = makeValidBundle();
    const sentence = sentenceOf(bundle, 'obj-book-sentence');
    const exercise = buildSentenceBuilder(sentence, {
      unitId: 'unit-greetings',
      lessonId: 'objects-3',
      rng: createRng(5),
    });

    expect(exercise).not.toBeNull();
    if (!exercise) return;
    expect(exercise.prompt).toEqual({
      en: sentence.translationEn,
      ur: sentence.translationUr,
    });
    expect(exercise.tiles).toHaveLength(sentence.tokens.length);
    expect(exercise.tiles.map((tile) => tile.surface).sort()).toEqual(
      sentence.tokens.map((token) => token.surface).sort(),
    );
    expect(exercise.acceptedOrders).toEqual([exercise.correctTileIds]);
    expect(
      exercise.correctTileIds.map((id) => exercise.tiles.find((t) => t.id === id)?.surface),
    ).toEqual(sentence.tokens.map((token) => token.surface));
  });

  it('converts authored alternate orders into tile ids and ignores invalid ones', () => {
    const bundle = makeValidBundle();
    const sentence = sentenceOf(bundle, 'intro-student-sentence');
    const exercise = buildSentenceBuilder(
      sentence,
      {
        unitId: 'unit-greetings',
        lessonId: 'introductions-2',
        rng: createRng(6),
      },
      [
        ['私', 'は', '学生', 'です', '。'],
        ['私', 'が', '学生', 'です', '。'],
        ['学生', 'は', '私', 'です'],
      ],
    );

    expect(exercise).not.toBeNull();
    if (!exercise) return;
    expect(exercise.acceptedOrders).toHaveLength(1);
  });

  it('honours a valid alternate order', () => {
    const bundle = makeValidBundle();
    const sentence = sentenceOf(bundle, 'obj-book-sentence');
    const exercise = buildSentenceBuilder(
      sentence,
      {
        unitId: 'unit-greetings',
        lessonId: 'objects-3',
        rng: createRng(7),
      },
      [['本', 'は', 'これ', 'です', '。']],
    );

    expect(exercise?.acceptedOrders).toHaveLength(2);
    expect(
      exercise?.acceptedOrders[1]?.map(
        (id) => exercise.tiles.find((tile) => tile.id === id)?.surface,
      ),
    ).toEqual(['本', 'は', 'これ', 'です', '。']);
  });
});

describe('buildParticleCloze', () => {
  it('blanks the first matching particle and includes the answer', () => {
    const bundle = makeValidBundle();
    const sentence = sentenceOf(bundle, 'intro-student-sentence');
    const exercise = buildParticleCloze(sentence, ['は', 'が', 'を'], {
      unitId: 'unit-greetings',
      lessonId: 'introductions-2',
      rng: createRng(8),
    });

    expect(exercise).not.toBeNull();
    if (!exercise) return;
    expect(exercise.correctParticle).toBe('は');
    expect(exercise.pieces).toHaveLength(sentence.tokens.length);
    expect(exercise.pieces[1]).toEqual({ kind: 'blank' });
    expect(exercise.pieces[0]).toEqual({
      kind: 'text',
      text: '私',
      reading: 'わたし',
    });
    expect(exercise.options).toHaveLength(3);
    expect(exercise.options).toContain('は');
    expect(exercise.options).not.toContain('です');
  });

  it('supports an explicit blank index and rejects impossible blanks', () => {
    const bundle = makeValidBundle();
    const sentence = sentenceOf(bundle, 'intro-student-sentence');
    const options = {
      unitId: 'unit-greetings',
      lessonId: 'introductions-2',
      rng: createRng(9),
    };

    expect(buildParticleCloze(sentence, ['は', 'が'], options, 0)).toBeNull();
    expect(buildParticleCloze(sentence, ['は', 'が'], options, 1)?.correctParticle).toBe('は');
    expect(buildParticleCloze(sentence, ['は', 'が'], options, 99)).toBeNull();
    expect(buildParticleCloze(sentence, ['を', 'に'], options)).toBeNull();
    expect(buildParticleCloze(sentence, ['は'], options)).toBeNull();
  });
});

describe('generateLessonExercises', () => {
  it('uses explicit templates and skips unsupported or broken ones', () => {
    const bundle = makeValidBundle();
    const unit = unitOf(bundle);
    const lesson = lessonOf(bundle, 1);
    lesson.exercises = [
      { type: 'meaning-choice', itemId: 'intro-gakusei' },
      { type: 'reverse-choice', itemId: 'intro-watashi' },
      { type: 'sentence-builder', sentenceId: 'intro-student-sentence' },
      {
        type: 'particle-cloze',
        sentenceId: 'intro-student-sentence',
        particleOptions: ['は', 'が', 'を'],
      },
      { type: 'listening-choice', itemId: 'intro-watashi' },
      { type: 'meaning-choice', itemId: 'missing-item' },
    ];

    const exercises = generateLessonExercises(
      contextFor(bundle, 1, {
        lesson,
        pool: { sentences: unit.sentences, vocabulary: unit.vocabulary },
      }),
    );

    expect(exercises.map((exercise) => exercise.kind)).toEqual([
      'meaning-choice',
      'reverse-choice',
      'sentence-builder',
      'particle-cloze',
    ]);
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(4);
    expect(exercises.every((exercise) => exercise.unitId === 'unit-greetings')).toBe(true);
    expect(exercises.every((exercise) => exercise.lessonId === 'introductions-2')).toBe(true);
  });

  it('builds a full default set when a lesson has no templates', () => {
    const bundle = makeValidBundle();
    const lesson = lessonOf(bundle, 2);
    lesson.exercises = undefined;
    const exercises = generateLessonExercises(contextFor(bundle, 2, { lesson }));

    const kinds = exercises.map((exercise) => exercise.kind);
    expect(kinds.filter((kind) => kind === 'meaning-choice')).toHaveLength(5);
    expect(kinds.filter((kind) => kind === 'reverse-choice')).toHaveLength(5);
    expect(kinds.filter((kind) => kind === 'sentence-builder')).toHaveLength(2);
    expect(kinds.filter((kind) => kind === 'particle-cloze')).toHaveLength(2);
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(exercises.length);
  });

  it('returns an empty list for a lesson with no matching content', () => {
    const bundle = makeValidBundle();
    const lesson = cloneBundle(bundle).units[0]?.lessons[0];
    if (!lesson) throw new Error('Fixture lesson is missing');
    lesson.items = [{ id: 'missing-item', kind: 'word' }];
    lesson.exercises = undefined;

    expect(generateDefaultExercises(contextFor(bundle, 0, { lesson }))).toEqual([]);
  });

  it('keeps ids unique when a lesson repeats the same template', () => {
    const bundle = makeValidBundle();
    const lesson = lessonOf(bundle, 0);
    lesson.exercises = [
      { type: 'meaning-choice', itemId: 'greet-ohayou' },
      { type: 'meaning-choice', itemId: 'greet-ohayou' },
    ];

    const exercises = generateLessonExercises(contextFor(bundle, 0, { lesson }));
    expect(exercises.map((exercise) => exercise.id)).toEqual([
      'greetings-1:meaning:greet-ohayou',
      'greetings-1:meaning:greet-ohayou:2',
    ]);
  });
});

describe('isExerciseAnswerCorrect', () => {
  it('grades choices by option id', () => {
    const bundle = makeValidBundle();
    const exercise = buildMeaningChoice(
      vocabOf(bundle, 'greet-ohayou'),
      unitOf(bundle).vocabulary,
      {
        unitId: 'unit-greetings',
        lessonId: 'greetings-1',
        rng: createRng(10),
      },
    );
    if (!exercise) throw new Error('Expected an exercise');

    expect(
      isExerciseAnswerCorrect(exercise, {
        kind: 'choice',
        optionId: exercise.correctOptionId,
      }),
    ).toBe(true);
    expect(isExerciseAnswerCorrect(exercise, { kind: 'choice', optionId: 'wrong' })).toBe(false);
    expect(isExerciseAnswerCorrect(exercise, { kind: 'particle-cloze', particle: 'は' })).toBe(
      false,
    );
  });

  it('grades sentence builders by accepted tile order', () => {
    const bundle = makeValidBundle();
    const exercise = buildSentenceBuilder(sentenceOf(bundle, 'obj-book-sentence'), {
      unitId: 'unit-greetings',
      lessonId: 'objects-3',
      rng: createRng(11),
    });
    if (!exercise) throw new Error('Expected an exercise');

    expect(
      isExerciseAnswerCorrect(exercise, {
        kind: 'sentence-builder',
        orderedTileIds: exercise.correctTileIds,
      }),
    ).toBe(true);
    expect(
      isExerciseAnswerCorrect(exercise, {
        kind: 'sentence-builder',
        orderedTileIds: [...exercise.correctTileIds].reverse(),
      }),
    ).toBe(false);
    expect(
      isExerciseAnswerCorrect(exercise, {
        kind: 'sentence-builder',
        orderedTileIds: exercise.correctTileIds.slice(0, -1),
      }),
    ).toBe(false);
  });

  it('grades particle cloze by exact particle', () => {
    const bundle = makeValidBundle();
    const exercise = buildParticleCloze(sentenceOf(bundle, 'obj-book-sentence'), ['は', 'が'], {
      unitId: 'unit-greetings',
      lessonId: 'objects-3',
      rng: createRng(12),
    });
    if (!exercise) throw new Error('Expected an exercise');

    expect(
      isExerciseAnswerCorrect(exercise, {
        kind: 'particle-cloze',
        particle: exercise.correctParticle,
      }),
    ).toBe(true);
    expect(isExerciseAnswerCorrect(exercise, { kind: 'particle-cloze', particle: 'が' })).toBe(
      false,
    );
  });
});
