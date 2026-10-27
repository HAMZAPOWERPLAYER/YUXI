import type {
  ContentBundle,
  CourseFile,
  FuriganaSegment,
  ItemRef,
  Lesson,
  SentenceItem,
  SentenceToken,
  UnitFile,
  VocabItem,
} from '@/features/content/types';

/**
 * Small but complete bundle used by content tests. It deliberately exercises
 * words, phrases, kanji with furigana, demonstration sentences, example links
 * and all three lesson sizes (7 items each, 21 items total).
 */
export const FIXTURE_UNIT_ID = 'unit-greetings';
export const FIXTURE_LESSON_IDS = ['greetings-1', 'introductions-2', 'objects-3'] as const;

const UNIT_TITLE_UR = 'سلام اور تعارف';
const UNIT_TITLE_EN = 'Greetings and introductions';
const UNIT_ICON = 'hand-wave';

type VocabInput = {
  id: string;
  ja: string;
  reading: string;
  romaji: string;
  meaningUr: string;
  meaningEn: string;
  pos: VocabItem['pos'];
  lessonId: string;
  kind?: VocabItem['kind'];
  tags?: string[];
  exampleIds?: string[];
  kanji?: string;
  segments?: FuriganaSegment[];
};

function makeVocab(input: VocabInput): VocabItem {
  return {
    kind: input.kind ?? 'word',
    id: input.id,
    ja: input.ja,
    reading: input.reading,
    romaji: input.romaji,
    ...(input.kanji ? { kanji: input.kanji } : {}),
    meaningUr: input.meaningUr,
    meaningEn: input.meaningEn,
    ...(input.segments ? { segments: input.segments } : {}),
    pos: input.pos,
    tags: input.tags ?? [],
    exampleIds: input.exampleIds ?? [],
    audioText: input.ja,
    level: 'N5-ish',
    unitId: FIXTURE_UNIT_ID,
    lessonId: input.lessonId,
    needsHumanReview: true,
  };
}

type SentenceInput = {
  id: string;
  ja: string;
  reading: string;
  romaji: string;
  translationUr: string;
  translationEn: string;
  tokens: SentenceToken[];
  vocabIds: string[];
  lessonId: string;
  grammarTags?: string[];
  tags?: string[];
  difficulty?: 1 | 2 | 3;
  segments?: FuriganaSegment[];
};

function makeSentence(input: SentenceInput): SentenceItem {
  return {
    id: input.id,
    kind: 'sentence',
    ja: input.ja,
    reading: input.reading,
    romaji: input.romaji,
    translationUr: input.translationUr,
    translationEn: input.translationEn,
    tokens: input.tokens,
    vocabIds: input.vocabIds,
    grammarTags: input.grammarTags ?? [],
    tags: input.tags ?? [],
    difficulty: input.difficulty ?? 1,
    ...(input.segments ? { segments: input.segments } : {}),
    unitId: FIXTURE_UNIT_ID,
    lessonId: input.lessonId,
    needsHumanReview: true,
  };
}

function makeLesson(
  id: string,
  order: number,
  titleUr: string,
  titleEn: string,
  items: ItemRef[],
): Lesson {
  return { id, unitId: FIXTURE_UNIT_ID, order, titleUr, titleEn, items };
}

const vocabulary: VocabItem[] = [
  makeVocab({
    id: 'greet-ohayou',
    ja: 'おはようございます',
    reading: 'おはようございます',
    romaji: 'ohayou gozaimasu',
    meaningUr: 'صبح بخیر',
    meaningEn: 'Good morning',
    pos: 'expression',
    lessonId: 'greetings-1',
    tags: ['greeting', 'politeness'],
    exampleIds: ['greet-morning-sentence'],
  }),
  makeVocab({
    id: 'greet-konnichiwa',
    ja: 'こんにちは',
    reading: 'こんにちは',
    romaji: 'konnichiwa',
    meaningUr: 'سلام',
    meaningEn: 'Hello',
    pos: 'expression',
    lessonId: 'greetings-1',
    tags: ['greeting'],
  }),
  makeVocab({
    id: 'greet-arigatou',
    ja: 'ありがとうございます',
    reading: 'ありがとうございます',
    romaji: 'arigatou gozaimasu',
    meaningUr: 'شکریہ',
    meaningEn: 'Thank you',
    pos: 'expression',
    lessonId: 'greetings-1',
    tags: ['politeness'],
  }),
  makeVocab({
    id: 'greet-sumimasen',
    ja: 'すみません',
    reading: 'すみません',
    romaji: 'sumimasen',
    meaningUr: 'معاف کیجیے',
    meaningEn: 'Excuse me',
    pos: 'expression',
    lessonId: 'greetings-1',
    tags: ['politeness'],
  }),
  makeVocab({
    id: 'greet-onegai',
    ja: 'おねがいします',
    reading: 'おねがいします',
    romaji: 'onegai shimasu',
    meaningUr: 'براہ کرم',
    meaningEn: 'Please',
    pos: 'expression',
    lessonId: 'greetings-1',
    tags: ['politeness'],
  }),
  makeVocab({
    id: 'greet-sayounara',
    ja: 'さようなら',
    reading: 'さようなら',
    romaji: 'sayounara',
    meaningUr: 'خدا حافظ',
    meaningEn: 'Goodbye',
    pos: 'expression',
    lessonId: 'greetings-1',
    tags: ['greeting'],
  }),
  makeVocab({
    id: 'intro-watashi',
    ja: '私',
    reading: 'わたし',
    romaji: 'watashi',
    kanji: '私',
    segments: [{ text: '私', reading: 'わたし' }],
    meaningUr: 'میں',
    meaningEn: 'I',
    pos: 'pronoun',
    lessonId: 'introductions-2',
    tags: ['people'],
    exampleIds: ['intro-student-sentence'],
  }),
  makeVocab({
    id: 'intro-gakusei',
    ja: '学生',
    reading: 'がくせい',
    romaji: 'gakusei',
    kanji: '学生',
    segments: [{ text: '学生', reading: 'がくせい' }],
    meaningUr: 'طالب علم',
    meaningEn: 'Student',
    pos: 'noun',
    lessonId: 'introductions-2',
    tags: ['people', 'study'],
    exampleIds: ['intro-student-sentence'],
  }),
  makeVocab({
    id: 'intro-namae',
    ja: '名前',
    reading: 'なまえ',
    romaji: 'namae',
    kanji: '名前',
    segments: [{ text: '名前', reading: 'なまえ' }],
    meaningUr: 'نام',
    meaningEn: 'Name',
    pos: 'noun',
    lessonId: 'introductions-2',
    tags: ['people'],
  }),
  makeVocab({
    id: 'intro-pakistan',
    ja: 'パキスタン',
    reading: 'パキスタン',
    romaji: 'pakisutan',
    meaningUr: 'پاکستان',
    meaningEn: 'Pakistan',
    pos: 'noun',
    lessonId: 'introductions-2',
    tags: ['places'],
  }),
  makeVocab({
    id: 'intro-hajimemashite',
    ja: 'はじめまして',
    reading: 'はじめまして',
    romaji: 'hajimemashite',
    meaningUr: 'پہلی ملاقات پر خوشی',
    meaningEn: 'Nice to meet you',
    pos: 'expression',
    lessonId: 'introductions-2',
    tags: ['greeting'],
  }),
  makeVocab({
    id: 'intro-yoroshiku',
    ja: 'よろしくおねがいします',
    reading: 'よろしくおねがいします',
    romaji: 'yoroshiku onegai shimasu',
    meaningUr: 'آپ سے تعاون کی درخواست ہے',
    meaningEn: 'Pleased to meet you',
    pos: 'expression',
    lessonId: 'introductions-2',
    tags: ['greeting', 'politeness'],
  }),
  makeVocab({
    id: 'obj-kore',
    ja: 'これ',
    reading: 'これ',
    romaji: 'kore',
    meaningUr: 'یہ (قریب کی چیز)',
    meaningEn: 'This (thing near the speaker)',
    pos: 'pronoun',
    lessonId: 'objects-3',
    tags: ['objects'],
    exampleIds: ['obj-book-sentence', 'obj-pen-sentence'],
  }),
  makeVocab({
    id: 'obj-hon',
    ja: '本',
    reading: 'ほん',
    romaji: 'hon',
    kanji: '本',
    segments: [{ text: '本', reading: 'ほん' }],
    meaningUr: 'کتاب',
    meaningEn: 'Book',
    pos: 'noun',
    lessonId: 'objects-3',
    tags: ['objects', 'study'],
    exampleIds: ['obj-book-sentence'],
  }),
  makeVocab({
    id: 'obj-pen',
    ja: 'ペン',
    reading: 'ペン',
    romaji: 'pen',
    meaningUr: 'قلم',
    meaningEn: 'Pen',
    pos: 'noun',
    lessonId: 'objects-3',
    tags: ['objects'],
    exampleIds: ['obj-pen-sentence'],
  }),
  makeVocab({
    id: 'obj-kaban',
    ja: 'かばん',
    reading: 'かばん',
    romaji: 'kaban',
    meaningUr: 'بیگ',
    meaningEn: 'Bag',
    pos: 'noun',
    lessonId: 'objects-3',
    tags: ['objects'],
  }),
  makeVocab({
    id: 'obj-mizu',
    ja: '水',
    reading: 'みず',
    romaji: 'mizu',
    kanji: '水',
    segments: [{ text: '水', reading: 'みず' }],
    meaningUr: 'پانی',
    meaningEn: 'Water',
    pos: 'noun',
    lessonId: 'objects-3',
    tags: ['food'],
  }),
];

const sentences: SentenceItem[] = [
  makeSentence({
    id: 'greet-morning-sentence',
    ja: 'おはようございます。',
    reading: 'おはようございます。',
    romaji: 'ohayou gozaimasu',
    translationUr: 'صبح بخیر۔',
    translationEn: 'Good morning.',
    tokens: [
      { surface: 'おはようございます', reading: 'おはようございます', gloss: 'good morning' },
      { surface: '。' },
    ],
    vocabIds: ['greet-ohayou'],
    lessonId: 'greetings-1',
    grammarTags: ['greeting'],
    tags: ['greeting'],
  }),
  makeSentence({
    id: 'intro-student-sentence',
    ja: '私は学生です。',
    reading: 'わたしはがくせいです。',
    romaji: 'watashi wa gakusei desu',
    translationUr: 'میں طالب علم ہوں۔',
    translationEn: 'I am a student.',
    tokens: [
      { surface: '私', reading: 'わたし', gloss: 'I' },
      { surface: 'は', gloss: 'topic marker' },
      { surface: '学生', reading: 'がくせい', gloss: 'student' },
      { surface: 'です', gloss: 'to be (polite)' },
      { surface: '。' },
    ],
    vocabIds: ['intro-watashi', 'intro-gakusei'],
    lessonId: 'introductions-2',
    grammarTags: ['copula', 'particle-wa'],
    tags: ['introductions'],
  }),
  makeSentence({
    id: 'obj-book-sentence',
    ja: 'これは本です。',
    reading: 'これはほんです。',
    romaji: 'kore wa hon desu',
    translationUr: 'یہ کتاب ہے۔',
    translationEn: 'This is a book.',
    tokens: [
      { surface: 'これ', gloss: 'this' },
      { surface: 'は', gloss: 'topic marker' },
      { surface: '本', reading: 'ほん', gloss: 'book' },
      { surface: 'です', gloss: 'to be (polite)' },
      { surface: '。' },
    ],
    vocabIds: ['obj-kore', 'obj-hon'],
    lessonId: 'objects-3',
    grammarTags: ['copula', 'particle-wa'],
    tags: ['objects'],
  }),
  makeSentence({
    id: 'obj-pen-sentence',
    ja: 'これはペンです。',
    reading: 'これはペンです。',
    romaji: 'kore wa pen desu',
    translationUr: 'یہ قلم ہے۔',
    translationEn: 'This is a pen.',
    tokens: [
      { surface: 'これ', gloss: 'this' },
      { surface: 'は', gloss: 'topic marker' },
      { surface: 'ペン', gloss: 'pen' },
      { surface: 'です', gloss: 'to be (polite)' },
      { surface: '。' },
    ],
    vocabIds: ['obj-kore', 'obj-pen'],
    lessonId: 'objects-3',
    grammarTags: ['copula', 'particle-wa'],
    tags: ['objects'],
  }),
];

const lessons: Lesson[] = [
  makeLesson('greetings-1', 1, 'سلام اور شکر گزاری', 'Greetings and thanks', [
    ...[
      'greet-ohayou',
      'greet-konnichiwa',
      'greet-arigatou',
      'greet-sumimasen',
      'greet-onegai',
      'greet-sayounara',
    ].map((id): ItemRef => ({ id, kind: 'word' })),
    { id: 'greet-morning-sentence', kind: 'sentence' },
  ]),
  makeLesson('introductions-2', 2, 'اپنا تعارف', 'Introducing yourself', [
    ...[
      'intro-watashi',
      'intro-gakusei',
      'intro-namae',
      'intro-pakistan',
      'intro-hajimemashite',
      'intro-yoroshiku',
    ].map((id): ItemRef => ({ id, kind: 'word' })),
    { id: 'intro-student-sentence', kind: 'sentence' },
  ]),
  makeLesson('objects-3', 3, 'یہ کیا ہے؟', 'What is this?', [
    ...['obj-kore', 'obj-hon', 'obj-pen', 'obj-kaban', 'obj-mizu'].map((id): ItemRef => ({
      id,
      kind: 'word',
    })),
    { id: 'obj-book-sentence', kind: 'sentence' },
    { id: 'obj-pen-sentence', kind: 'sentence' },
  ]),
];

lessons[0]!.exercises = [
  { type: 'meaning-choice', itemId: 'greet-ohayou' },
  { type: 'type-romaji', itemId: 'greet-arigatou' },
];
lessons[1]!.exercises = [{ type: 'reverse-choice', itemId: 'intro-watashi' }];
lessons[2]!.exercises = [
  {
    type: 'sentence-builder',
    sentenceId: 'obj-book-sentence',
    acceptedOrders: [['これ', 'は', '本', 'です', '。']],
  },
];

export function makeValidCourse(): CourseFile {
  return {
    needsHumanReview: true,
    schemaVersion: 1,
    course: {
      id: 'yuxi-course',
      version: 1,
      units: [
        {
          id: FIXTURE_UNIT_ID,
          order: 1,
          titleUr: UNIT_TITLE_UR,
          titleEn: UNIT_TITLE_EN,
          icon: UNIT_ICON,
        },
      ],
    },
  };
}

export function makeValidUnit(): UnitFile {
  return {
    needsHumanReview: true,
    schemaVersion: 1,
    unit: {
      id: FIXTURE_UNIT_ID,
      order: 1,
      titleUr: UNIT_TITLE_UR,
      titleEn: UNIT_TITLE_EN,
      descriptionUr: 'پہلا یونٹ: سلام، تعارف اور بنیادی الفاظ۔',
      descriptionEn: 'Unit one: greetings, introductions and basic words.',
      icon: UNIT_ICON,
      lessons: FIXTURE_LESSON_IDS.map((id) => ({ id })),
      unlock: {},
    },
    lessons,
    vocabulary,
    sentences,
  };
}

export function makeValidBundle(): ContentBundle {
  return { course: makeValidCourse(), units: [makeValidUnit()] };
}

export function cloneBundle(bundle: ContentBundle = makeValidBundle()): ContentBundle {
  return structuredClone(bundle);
}
