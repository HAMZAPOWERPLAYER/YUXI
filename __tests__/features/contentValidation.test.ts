import type { ContentBundle, SentenceItem, UnitFile, VocabItem } from '@/features/content/types';
import { validateContent } from '@/features/content/validation';

import { cloneBundle, makeValidBundle } from '../fixtures/content';

function unitOf(bundle: ContentBundle): UnitFile {
  const file = bundle.units[0];
  if (!file) throw new Error('Fixture unit is missing');
  return file;
}

function lessonOf(bundle: ContentBundle, index: number) {
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

function codes(bundle: ContentBundle): string[] {
  return validateContent(bundle).issues.map((issue) => issue.code);
}

function warnings(bundle: ContentBundle): string[] {
  return validateContent(bundle)
    .issues.filter((issue) => issue.severity === 'warning')
    .map((issue) => issue.code);
}

describe('content bundle validator', () => {
  it('accepts the complete fixture bundle with no issues', () => {
    const result = validateContent(makeValidBundle());

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.stats).toEqual({
      units: 1,
      lessons: 3,
      vocabulary: 17,
      sentences: 4,
      items: 21,
      byUnit: [
        {
          id: 'unit-greetings',
          lessons: 3,
          vocabulary: 17,
          sentences: 4,
          items: 21,
        },
      ],
    });
  });

  it('detects duplicate vocabulary, sentence and lesson ids', () => {
    const duplicateVocab = cloneBundle();
    const duplicateVocabUnit = unitOf(duplicateVocab);
    duplicateVocabUnit.vocabulary[1]!.id = duplicateVocabUnit.vocabulary[0]!.id;
    expect(codes(duplicateVocab)).toEqual(
      expect.arrayContaining(['duplicate-vocab-id', 'duplicate-content-id']),
    );

    const duplicateSentence = cloneBundle();
    const duplicateSentenceUnit = unitOf(duplicateSentence);
    duplicateSentenceUnit.sentences[1]!.id = duplicateSentenceUnit.sentences[0]!.id;
    expect(codes(duplicateSentence)).toContain('duplicate-sentence-id');

    const duplicateLesson = cloneBundle();
    const duplicateLessonUnit = unitOf(duplicateLesson);
    duplicateLessonUnit.lessons[1]!.id = duplicateLessonUnit.lessons[0]!.id;
    expect(codes(duplicateLesson)).toContain('duplicate-lesson-id');
  });

  it('detects duplicate item references and items outside a lesson', () => {
    const duplicateRef = cloneBundle();
    const duplicateRefLesson = lessonOf(duplicateRef, 0);
    duplicateRefLesson.items[1]!.id = duplicateRefLesson.items[0]!.id;
    expect(codes(duplicateRef)).toContain('duplicate-item-ref');

    const missingRef = cloneBundle();
    lessonOf(missingRef, 0).items.pop();
    expect(codes(missingRef)).toContain('item-not-in-lesson');
  });

  it('reports missing Urdu and English meanings with the correct field paths', () => {
    const vocab = cloneBundle();
    const brokenVocab = vocabOf(vocab, 'greet-konnichiwa');
    brokenVocab.meaningUr = '';
    brokenVocab.meaningEn = '';
    const vocabIssues = validateContent(vocab).issues;
    expect(vocabIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'missing-urdu-meaning',
          path: expect.stringContaining('/meaningUr'),
        }),
        expect.objectContaining({
          code: 'missing-english-meaning',
          path: expect.stringContaining('/meaningEn'),
        }),
      ]),
    );

    const sentence = cloneBundle();
    const brokenSentence = sentenceOf(sentence, 'greet-morning-sentence');
    brokenSentence.translationUr = '';
    brokenSentence.translationEn = '';
    const sentenceIssues = validateContent(sentence).issues;
    expect(sentenceIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'missing-urdu-meaning',
          path: expect.stringContaining('/translationUr'),
        }),
        expect.objectContaining({
          code: 'missing-english-meaning',
          path: expect.stringContaining('/translationEn'),
        }),
      ]),
    );
  });

  it('rejects empty, uppercase and non-Hepburn romaji', () => {
    for (const romaji of ['', 'Watashi', 'si', 'sya', 'tu']) {
      const bundle = cloneBundle();
      vocabOf(bundle, 'greet-konnichiwa').romaji = romaji;
      expect(codes(bundle)).toContain('invalid-romaji');
    }
  });

  it('rejects readings that contain non-kana characters', () => {
    const vocab = cloneBundle();
    vocabOf(vocab, 'greet-konnichiwa').reading = 'konnichiwa';
    expect(codes(vocab)).toContain('invalid-reading');

    const sentence = cloneBundle();
    sentenceOf(sentence, 'obj-book-sentence').reading = 'これは本です。';
    expect(codes(sentence)).toContain('invalid-reading');
  });

  it('requires sentence tokens to concatenate to the sentence text', () => {
    const bundle = cloneBundle();
    sentenceOf(bundle, 'obj-book-sentence').tokens[0]!.surface = 'それ';
    expect(codes(bundle)).toContain('token-mismatch');
  });

  it('requires furigana segments to concatenate to the Japanese text', () => {
    const bundle = cloneBundle();
    vocabOf(bundle, 'intro-watashi').segments = [
      { text: '私', reading: 'わたし' },
      { text: 'です' },
    ];
    expect(codes(bundle)).toContain('segment-mismatch');
  });

  it('warns when kanji text lacks furigana without failing validation', () => {
    const bundle = cloneBundle();
    delete vocabOf(bundle, 'intro-watashi').segments;
    const result = validateContent(bundle);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([
      expect.objectContaining({ severity: 'warning', code: 'missing-furigana-segments' }),
    ]);
  });

  it('detects broken example and vocabulary references', () => {
    const examples = cloneBundle();
    vocabOf(examples, 'obj-hon').exampleIds.push('missing-sentence');
    expect(codes(examples)).toContain('broken-example-id');

    const vocab = cloneBundle();
    sentenceOf(vocab, 'obj-book-sentence').vocabIds.push('missing-vocab');
    expect(codes(vocab)).toContain('broken-vocab-id');
  });

  it('detects items whose unitId or lessonId does not match their lesson', () => {
    const unitMismatch = cloneBundle();
    vocabOf(unitMismatch, 'greet-konnichiwa').unitId = 'unit-other';
    expect(codes(unitMismatch)).toContain('item-unit-mismatch');

    const lessonMismatch = cloneBundle();
    vocabOf(lessonMismatch, 'intro-watashi').lessonId = 'greetings-1';
    expect(codes(lessonMismatch)).toContain('item-lesson-mismatch');

    const kindMismatch = cloneBundle();
    lessonOf(kindMismatch, 0).items[0]!.kind = 'phrase';
    expect(codes(kindMismatch)).toContain('item-kind-mismatch');
  });

  it('enforces unit and lesson size limits', () => {
    const smallUnit = cloneBundle();
    const smallUnitFile = unitOf(smallUnit);
    const removed = new Set(['greet-konnichiwa', 'intro-namae', 'obj-kaban']);
    smallUnitFile.vocabulary = smallUnitFile.vocabulary.filter((item) => !removed.has(item.id));
    for (const lesson of smallUnitFile.lessons) {
      lesson.items = lesson.items.filter((item) => !removed.has(item.id));
    }
    expect(codes(smallUnit)).toContain('unit-too-small');

    const fewLessons = cloneBundle();
    unitOf(fewLessons).lessons.pop();
    unitOf(fewLessons).unit.lessons.pop();
    expect(codes(fewLessons)).toContain('unit-lesson-count');

    const shortLesson = cloneBundle();
    lessonOf(shortLesson, 0).items.splice(0, 2);
    expect(codes(shortLesson)).toContain('lesson-item-count');
  });

  it('reports field-level whitespace, segment and token problems', () => {
    const padding = cloneBundle();
    vocabOf(padding, 'greet-konnichiwa').meaningUr = ' صبح';
    expect(codes(padding)).toContain('edge-whitespace');

    const doubleSpace = cloneBundle();
    vocabOf(doubleSpace, 'greet-konnichiwa').meaningEn = 'Good  morning';
    expect(codes(doubleSpace)).toContain('double-space');

    const emptySegment = cloneBundle();
    vocabOf(emptySegment, 'intro-watashi').segments = [{ text: '', reading: 'わたし' }];
    expect(codes(emptySegment)).toContain('empty-segment');

    const badSegmentReading = cloneBundle();
    vocabOf(badSegmentReading, 'intro-watashi').segments = [{ text: '私', reading: 'watashi' }];
    expect(codes(badSegmentReading)).toContain('invalid-segment-reading');

    const emptyToken = cloneBundle();
    sentenceOf(emptyToken, 'obj-book-sentence').tokens[0]!.surface = '';
    expect(codes(emptyToken)).toContain('empty-token');

    const badTokenReading = cloneBundle();
    sentenceOf(badTokenReading, 'obj-book-sentence').tokens[0]!.reading = 'kore';
    expect(codes(badTokenReading)).toContain('invalid-token-reading');

    const missingAudio = cloneBundle();
    vocabOf(missingAudio, 'greet-konnichiwa').audioText = '';
    expect(codes(missingAudio)).toContain('missing-audio-text');

    const missingVocabJapanese = cloneBundle();
    vocabOf(missingVocabJapanese, 'greet-konnichiwa').ja = '   ';
    expect(codes(missingVocabJapanese)).toContain('missing-japanese');

    const missingSentenceJapanese = cloneBundle();
    sentenceOf(missingSentenceJapanese, 'obj-book-sentence').ja = '';
    expect(codes(missingSentenceJapanese)).toContain('missing-japanese');

    const sentenceSegments = cloneBundle();
    sentenceOf(sentenceSegments, 'obj-book-sentence').segments = [
      { text: 'これは', reading: 'これは' },
      { text: '本です。' },
    ];
    expect(codes(sentenceSegments)).toEqual([]);
  });

  it('rejects forbidden terms unless the item is a halal or dietary request', () => {
    const forbidden = cloneBundle();
    vocabOf(forbidden, 'greet-konnichiwa').meaningEn = 'Pork';
    expect(codes(forbidden)).toContain('forbidden-term');

    const music = cloneBundle();
    vocabOf(music, 'greet-konnichiwa').meaningEn = 'Music';
    expect(codes(music)).toContain('forbidden-term');

    const allowed = cloneBundle();
    const allowedItem = vocabOf(allowed, 'greet-konnichiwa');
    allowedItem.meaningEn = 'Is this pork?';
    allowedItem.tags.push('halal-request');
    const result = validateContent(allowed);
    expect(result.ok).toBe(true);
    expect(warnings(allowed)).toContain('forbidden-term-allowed');
  });

  it('validates course and unit metadata links', () => {
    const mismatch = cloneBundle();
    mismatch.course.course.units[0]!.titleEn = 'Other title';
    expect(codes(mismatch)).toContain('course-metadata-mismatch');

    const missingFile = cloneBundle();
    missingFile.course.course.units.push({
      id: 'unit-other',
      order: 2,
      titleUr: 'دوسرا یونٹ',
      titleEn: 'Other unit',
      icon: 'star',
    });
    expect(codes(missingFile)).toContain('missing-unit-file');

    const notInCourse = cloneBundle();
    notInCourse.course.course.units = [];
    expect(codes(notInCourse)).toContain('unit-not-in-course');

    const duplicateOrder = cloneBundle();
    duplicateOrder.course.course.units.push({
      id: 'unit-other',
      order: 1,
      titleUr: 'دوسرا یونٹ',
      titleEn: 'Other unit',
      icon: 'star',
    });
    expect(codes(duplicateOrder)).toContain('duplicate-unit-order');

    const duplicateRef = cloneBundle();
    duplicateRef.course.course.units.push({ ...duplicateRef.course.course.units[0]! });
    expect(codes(duplicateRef)).toContain('duplicate-unit-ref');

    const duplicateFile = cloneBundle();
    duplicateFile.units.push(structuredClone(unitOf(duplicateFile)));
    expect(codes(duplicateFile)).toContain('duplicate-unit-id');

    const duplicateGlobalLesson = cloneBundle();
    const secondUnit = structuredClone(unitOf(duplicateGlobalLesson));
    secondUnit.unit.id = 'unit-second';
    secondUnit.unit.order = 2;
    duplicateGlobalLesson.units.push(secondUnit);
    duplicateGlobalLesson.course.course.units.push({
      id: 'unit-second',
      order: 2,
      titleUr: 'دوسرا یونٹ',
      titleEn: 'Second unit',
      icon: 'star',
    });
    expect(codes(duplicateGlobalLesson)).toContain('duplicate-global-lesson-id');
  });

  it('checks unlock rules', () => {
    const self = cloneBundle();
    unitOf(self).unit.unlock.requiresUnitId = 'unit-greetings';
    expect(codes(self)).toContain('self-unlock');

    const unknown = cloneBundle();
    unitOf(unknown).unit.unlock.requiresUnitId = 'unit-missing';
    expect(codes(unknown)).toContain('unknown-unlock-unit');

    const later = cloneBundle();
    unitOf(later).unit.unlock.requiresUnitId = 'unit-later';
    later.course.course.units.push({
      id: 'unit-later',
      order: 2,
      titleUr: 'بعد کا یونٹ',
      titleEn: 'Later unit',
      icon: 'star',
    });
    expect(codes(later)).toContain('unlock-order');
  });

  it('checks lesson references and exercise references', () => {
    const duplicateLessonRef = cloneBundle();
    unitOf(duplicateLessonRef).unit.lessons.push({ id: 'greetings-1' });
    expect(codes(duplicateLessonRef)).toContain('duplicate-lesson-ref');

    const missingLesson = cloneBundle();
    unitOf(missingLesson).unit.lessons[0]!.id = 'missing-lesson';
    expect(codes(missingLesson)).toContain('missing-lesson');

    const extraLesson = cloneBundle();
    unitOf(extraLesson).unit.lessons.pop();
    expect(codes(extraLesson)).toContain('lesson-not-in-unit');

    const brokenExercise = cloneBundle();
    lessonOf(brokenExercise, 0).exercises![0]!.itemId = 'missing-item';
    expect(codes(brokenExercise)).toContain('broken-exercise-ref');

    const outsideLesson = cloneBundle();
    lessonOf(outsideLesson, 0).exercises!.push({
      type: 'meaning-choice',
      itemId: 'intro-watashi',
    });
    expect(codes(outsideLesson)).toContain('exercise-ref-not-in-lesson');
  });

  it('rejects unsupported and incomplete exercise templates', () => {
    const unsupported = cloneBundle();
    lessonOf(unsupported, 0).exercises = [{ type: 'type-romaji', itemId: 'greet-ohayou' }];
    expect(codes(unsupported)).toContain('unsupported-exercise-type');

    const missingItem = cloneBundle();
    lessonOf(missingItem, 0).exercises = [{ type: 'meaning-choice' }];
    expect(codes(missingItem)).toContain('missing-exercise-item');

    const missingSentence = cloneBundle();
    lessonOf(missingSentence, 0).exercises = [{ type: 'sentence-builder' }];
    expect(codes(missingSentence)).toContain('missing-exercise-item');
  });

  it('rejects irrelevant fields and wrong item kinds', () => {
    const irrelevant = cloneBundle();
    lessonOf(irrelevant, 0).exercises = [
      {
        type: 'meaning-choice',
        itemId: 'greet-ohayou',
        sentenceId: 'greet-morning-sentence',
      },
    ];
    expect(codes(irrelevant)).toContain('irrelevant-exercise-field');

    const vocabAsSentence = cloneBundle();
    lessonOf(vocabAsSentence, 0).exercises = [
      { type: 'sentence-builder', sentenceId: 'greet-ohayou' },
    ];
    expect(codes(vocabAsSentence)).toContain('exercise-item-kind');

    const sentenceAsVocab = cloneBundle();
    lessonOf(sentenceAsVocab, 0).exercises = [
      { type: 'reverse-choice', itemId: 'greet-morning-sentence' },
    ];
    expect(codes(sentenceAsVocab)).toContain('exercise-item-kind');
  });

  it('rejects malformed sentence-builder orders', () => {
    const bundle = cloneBundle();
    lessonOf(bundle, 2).exercises = [
      {
        type: 'sentence-builder',
        sentenceId: 'obj-book-sentence',
        acceptedOrders: [['これ', 'は', '本', 'です']],
      },
    ];
    expect(codes(bundle)).toContain('malformed-accepted-order');
  });

  it('rejects duplicate, absent and ambiguous cloze particles', () => {
    const duplicate = cloneBundle();
    lessonOf(duplicate, 2).exercises = [
      {
        type: 'particle-cloze',
        sentenceId: 'obj-book-sentence',
        particleOptions: ['は', 'は'],
      },
    ];
    expect(codes(duplicate)).toContain('duplicate-particle-option');

    const absent = cloneBundle();
    lessonOf(absent, 2).exercises = [
      {
        type: 'particle-cloze',
        sentenceId: 'obj-book-sentence',
        particleOptions: ['が', 'を'],
      },
    ];
    expect(codes(absent)).toContain('missing-cloze-particle');

    const ambiguous = cloneBundle();
    lessonOf(ambiguous, 2).exercises = [
      {
        type: 'particle-cloze',
        sentenceId: 'obj-book-sentence',
        particleOptions: ['は', 'です'],
      },
    ];
    expect(codes(ambiguous)).toContain('ambiguous-cloze-particle');

    const valid = cloneBundle();
    lessonOf(valid, 2).exercises = [
      {
        type: 'particle-cloze',
        sentenceId: 'obj-book-sentence',
        particleOptions: ['は', 'が'],
      },
    ];
    expect(codes(valid)).toEqual([]);
  });

  it('requires consecutive lesson order numbers', () => {
    const gap = cloneBundle();
    lessonOf(gap, 2).order = 4;
    expect(codes(gap)).toContain('lesson-order-gap');
  });
});
