import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  CONTENT_SCHEMA_DIR,
  buildContentJsonSchemas,
  serializeJsonSchema,
} from '@/features/content/jsonSchema';

type JsonSchema = {
  $schema?: string;
  required?: string[];
  properties?: Record<string, unknown>;
};

function readCommitted(fileName: string): JsonSchema {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), CONTENT_SCHEMA_DIR, fileName), 'utf8'),
  ) as JsonSchema;
}

/**
 * Exact freshness is checked by `npm run content:schema:check` (run inside
 * `npm run check`). Jest transforms Unicode regexes through Babel, which
 * normalizes character classes, so regenerating byte-for-byte inside Jest would
 * compare different but equivalent regex strings.
 */
describe('content JSON schemas', () => {
  it('generates a course and a unit schema with the draft 2020-12 dialect', () => {
    expect(Object.keys(buildContentJsonSchemas())).toEqual([
      'course.schema.json',
      'unit.schema.json',
    ]);
    for (const fileName of ['course.schema.json', 'unit.schema.json']) {
      expect(readCommitted(fileName).$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    }
  });

  it('describes the review flag and version on both files', () => {
    for (const fileName of ['course.schema.json', 'unit.schema.json']) {
      const schema = readCommitted(fileName);
      expect(schema.properties).toHaveProperty('needsHumanReview');
      expect(schema.properties).toHaveProperty('schemaVersion');
      expect(schema.required).toEqual(
        expect.arrayContaining(['needsHumanReview', 'schemaVersion']),
      );
    }
  });

  it('describes units, lessons, vocabulary and sentences', () => {
    const unitSchema = JSON.stringify(readCommitted('unit.schema.json'));
    for (const field of ['unit', 'lessons', 'vocabulary', 'sentences', 'segments', 'exampleIds']) {
      expect(unitSchema).toContain(`"${field}"`);
    }
    expect(unitSchema).toContain('"const":true');
  });

  it('serializes with a trailing newline', () => {
    const schema = buildContentJsonSchemas()['course.schema.json'];
    expect(serializeJsonSchema(schema).endsWith('\n')).toBe(true);
  });
});
