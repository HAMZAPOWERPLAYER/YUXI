import {
  CONTENT_SCHEMA_VERSION,
  courseFileSchema,
  exerciseTemplateSchema,
  parseCourseFile,
  parseUnitFile,
  sentenceItemSchema,
  unitFileSchema,
  vocabItemSchema,
} from '@/features/content/schema';
import { makeValidCourse, makeValidUnit } from '../fixtures/content';

function rawUnit(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(makeValidUnit())) as Record<string, unknown>;
}

describe('content schemas', () => {
  it('parses the valid fixture bundle', () => {
    expect(courseFileSchema.safeParse(makeValidCourse()).success).toBe(true);
    expect(unitFileSchema.safeParse(makeValidUnit()).success).toBe(true);
    expect(parseCourseFile(makeValidCourse()).schemaVersion).toBe(CONTENT_SCHEMA_VERSION);
    expect(parseUnitFile(makeValidUnit()).unit.id).toBe('unit-greetings');
  });

  it('requires needsHumanReview at file level', () => {
    const unit = rawUnit();
    delete unit.needsHumanReview;
    expect(unitFileSchema.safeParse(unit).success).toBe(false);

    const course = JSON.parse(JSON.stringify(makeValidCourse())) as Record<string, unknown>;
    delete course.needsHumanReview;
    expect(courseFileSchema.safeParse(course).success).toBe(false);
  });

  it('requires needsHumanReview on every item', () => {
    const unit = rawUnit() as { vocabulary: Record<string, unknown>[] };
    const item = unit.vocabulary[0]!;
    delete item.needsHumanReview;
    expect(unitFileSchema.safeParse(unit).success).toBe(false);
  });

  it('rejects an unknown schema version', () => {
    const unit = rawUnit();
    unit.schemaVersion = 2;
    expect(unitFileSchema.safeParse(unit).success).toBe(false);
  });

  it('rejects invalid readings, romaji and missing meanings at the item level', () => {
    const base = JSON.parse(JSON.stringify(makeValidUnit().vocabulary[0])) as Record<
      string,
      unknown
    >;

    expect(vocabItemSchema.safeParse({ ...base, reading: 'ohayou' }).success).toBe(false);
    expect(vocabItemSchema.safeParse({ ...base, romaji: 'Ohayou' }).success).toBe(false);
    expect(vocabItemSchema.safeParse({ ...base, meaningUr: '' }).success).toBe(false);
    expect(vocabItemSchema.safeParse({ ...base, meaningEn: '123' }).success).toBe(false);
    expect(vocabItemSchema.safeParse({ ...base, audioText: '' }).success).toBe(false);
    expect(vocabItemSchema.safeParse({ ...base, kind: 'sentence' }).success).toBe(false);
  });

  it('rejects sentences whose token text is empty or whose translation is missing', () => {
    const base = JSON.parse(JSON.stringify(makeValidUnit().sentences[0])) as Record<
      string,
      unknown
    >;

    expect(sentenceItemSchema.safeParse({ ...base, translationUr: '' }).success).toBe(false);
    expect(sentenceItemSchema.safeParse({ ...base, translationEn: '' }).success).toBe(false);
    expect(sentenceItemSchema.safeParse({ ...base, difficulty: 4 }).success).toBe(false);
    const tokens = structuredClone(base.tokens) as Record<string, unknown>[];
    tokens[0]!.surface = '';
    expect(sentenceItemSchema.safeParse({ ...base, tokens }).success).toBe(false);
  });

  it('validates furigana segment readings and exercise shapes', () => {
    const base = JSON.parse(JSON.stringify(makeValidUnit().vocabulary[0])) as Record<
      string,
      unknown
    >;
    expect(
      vocabItemSchema.safeParse({
        ...base,
        ja: '私',
        segments: [{ text: '私', reading: 'わたし' }],
      }).success,
    ).toBe(true);
    expect(
      vocabItemSchema.safeParse({
        ...base,
        ja: '私',
        segments: [{ text: '私', reading: 'watashi' }],
      }).success,
    ).toBe(false);

    expect(exerciseTemplateSchema.safeParse({ type: 'meaning-choice', itemId: 'a' }).success).toBe(
      true,
    );
    expect(
      exerciseTemplateSchema.safeParse({ type: 'sentence-builder', sentenceId: 's' }).success,
    ).toBe(true);
    expect(exerciseTemplateSchema.safeParse({ type: 'unknown-exercise' }).success).toBe(false);
    expect(
      exerciseTemplateSchema.safeParse({ type: 'match-pairs', itemIds: ['only-one'] }).success,
    ).toBe(false);
  });

  it('rejects unknown fields so typos do not pass silently', () => {
    const unit = rawUnit();
    unit.unexpected = true;
    expect(unitFileSchema.safeParse(unit).success).toBe(false);
  });
});
