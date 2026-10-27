import { z } from 'zod';

/**
 * Runtime schemas for authored content. The TypeScript types are inferred from
 * these schemas so the app, validator and editor contract cannot drift.
 *
 * These schemas enforce shape and basic character rules. Cross-file rules such
 * as reference integrity, lesson sizes and forbidden terms live in
 * `validation.ts` and are run by `npm run validate:content`.
 */

export const CONTENT_SCHEMA_VERSION = 1;

export const PART_OF_SPEECH = [
  'noun',
  'verb',
  'i-adjective',
  'na-adjective',
  'adverb',
  'particle',
  'expression',
  'counter',
  'pronoun',
  'conjunction',
  'interjection',
  'numeral',
  'other',
] as const;

export const EXERCISE_TYPES = [
  'meaning-choice',
  'reverse-choice',
  'listening-choice',
  'match-pairs',
  'sentence-builder',
  'particle-cloze',
  'type-romaji',
] as const;

const idSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'Use lowercase letters, digits and hyphens only');
const tagSchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'Use lowercase letters, digits and hyphens only');

const urduTextSchema = z
  .string()
  .min(1)
  .max(500)
  .regex(/[\u0600-\u06FF]/, 'Must contain Urdu script');
const englishTextSchema = z
  .string()
  .min(1)
  .max(800)
  .regex(/[A-Za-z]/, 'Must contain Latin text');
const japaneseTextSchema = z
  .string()
  .min(1)
  .max(300)
  .regex(/[\u3040-\u30FF\u4E00-\u9FFF]/, 'Must contain Japanese text');
const kanaSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[\u3040-\u30FF\u30FC]+$/u, 'Reading must contain kana only');
const sentenceReadingSchema = z
  .string()
  .min(1)
  .max(600)
  .regex(/^[\u3040-\u30FF\u3001\u3002！？ ]+$/u, 'Reading must contain kana only');
const romajiSchema = z
  .string()
  .min(1)
  .max(300)
  .regex(/^[a-zāīūēō '\-]+$/u, 'Use lowercase Hepburn romaji only');

export const furiganaSegmentSchema = z
  .object({
    text: z.string().min(1).max(300),
    reading: z
      .string()
      .min(1)
      .max(300)
      .regex(/^[\u3040-\u30FF\u30FC]+$/u)
      .optional(),
  })
  .strict();

export const sentenceTokenSchema = z
  .object({
    surface: z.string().min(1).max(80),
    reading: z
      .string()
      .min(1)
      .max(160)
      .regex(/^[\u3040-\u30FF\u30FC]+$/u)
      .optional(),
    gloss: z.string().min(1).max(160).optional(),
  })
  .strict();

export const exerciseTemplateSchema = z
  .object({
    type: z.enum(EXERCISE_TYPES),
    itemId: idSchema.optional(),
    itemIds: z.array(idSchema).min(2).max(12).optional(),
    sentenceId: idSchema.optional(),
    particleOptions: z.array(z.string().min(1).max(8)).min(2).max(6).optional(),
    acceptedOrders: z
      .array(z.array(z.string().min(1).max(80)).min(1).max(20))
      .max(10)
      .optional(),
  })
  .strict();

export const lessonRefSchema = z.object({ id: idSchema }).strict();

export const unitRefSchema = z
  .object({
    id: idSchema,
    order: z.number().int().min(1).max(99),
    titleUr: urduTextSchema,
    titleEn: englishTextSchema,
    icon: z.string().min(1).max(60),
  })
  .strict();

export const lessonSchema = z
  .object({
    id: idSchema,
    unitId: idSchema,
    order: z.number().int().min(1).max(99),
    titleUr: urduTextSchema,
    titleEn: englishTextSchema,
    items: z.array(
      z
        .object({
          id: idSchema,
          kind: z.enum(['word', 'phrase', 'sentence']),
        })
        .strict(),
    ),
    exercises: z.array(exerciseTemplateSchema).max(30).optional(),
  })
  .strict();

export const unitSchema = z
  .object({
    id: idSchema,
    order: z.number().int().min(1).max(99),
    titleUr: urduTextSchema,
    titleEn: englishTextSchema,
    descriptionUr: urduTextSchema,
    descriptionEn: englishTextSchema,
    icon: z.string().min(1).max(60),
    lessons: z.array(lessonRefSchema),
    unlock: z
      .object({
        requiresUnitId: idSchema.optional(),
        minAccuracy: z.number().min(0).max(1).optional(),
      })
      .strict(),
  })
  .strict();

const itemBase = {
  id: idSchema,
  ja: japaneseTextSchema,
  reading: kanaSchema,
  romaji: romajiSchema,
  meaningUr: urduTextSchema,
  meaningEn: englishTextSchema,
  tags: z.array(tagSchema).max(20),
  unitId: idSchema,
  lessonId: idSchema,
  needsHumanReview: z.literal(true),
  segments: z.array(furiganaSegmentSchema).max(60).optional(),
};

export const vocabItemSchema = z
  .object({
    ...itemBase,
    kind: z.enum(['word', 'phrase']),
    kanji: z
      .string()
      .min(1)
      .max(20)
      .regex(/^[\u4E00-\u9FFF]+$/u)
      .optional(),
    pos: z.enum(PART_OF_SPEECH),
    exampleIds: z.array(idSchema).max(20),
    audioText: z.string().min(1).max(300),
    level: z.literal('N5-ish'),
  })
  .strict();

export const sentenceItemSchema = z
  .object({
    id: idSchema,
    kind: z.literal('sentence'),
    ja: japaneseTextSchema,
    reading: sentenceReadingSchema,
    romaji: romajiSchema,
    translationUr: urduTextSchema,
    translationEn: englishTextSchema,
    tokens: z.array(sentenceTokenSchema).min(1).max(60),
    vocabIds: z.array(idSchema).max(30),
    grammarTags: z.array(tagSchema).max(20),
    tags: z.array(tagSchema).max(20),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    unitId: idSchema,
    lessonId: idSchema,
    needsHumanReview: z.literal(true),
    segments: z.array(furiganaSegmentSchema).max(60).optional(),
  })
  .strict();

export const contentItemSchema = z.union([vocabItemSchema, sentenceItemSchema]);

export const unitFileSchema = z
  .object({
    needsHumanReview: z.literal(true),
    schemaVersion: z.literal(CONTENT_SCHEMA_VERSION),
    unit: unitSchema,
    lessons: z.array(lessonSchema).max(12),
    vocabulary: z.array(vocabItemSchema).max(500),
    sentences: z.array(sentenceItemSchema).max(500),
  })
  .strict();

export const courseFileSchema = z
  .object({
    needsHumanReview: z.literal(true),
    schemaVersion: z.literal(CONTENT_SCHEMA_VERSION),
    course: z
      .object({
        id: idSchema,
        version: z.number().int().min(1).max(1_000),
        units: z.array(unitRefSchema).max(100),
      })
      .strict(),
  })
  .strict();

export function parseUnitFile(value: unknown): z.infer<typeof unitFileSchema> {
  return unitFileSchema.parse(value);
}

export function parseCourseFile(value: unknown): z.infer<typeof courseFileSchema> {
  return courseFileSchema.parse(value);
}
