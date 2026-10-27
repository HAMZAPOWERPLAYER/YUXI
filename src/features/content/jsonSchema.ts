import { z } from 'zod';

import { courseFileSchema, unitFileSchema } from './schema';

/**
 * JSON Schema artifacts are generated from the Zod schemas so editors and future
 * authoring tools validate the same contract as the app. They are committed
 * under `docs/content-schema/` and checked for freshness by a test.
 */
export const CONTENT_SCHEMA_DIR = 'docs/content-schema';

export function buildContentJsonSchemas(): Record<string, unknown> {
  return {
    'course.schema.json': z.toJSONSchema(courseFileSchema, {
      target: 'draft-2020-12',
    }),
    'unit.schema.json': z.toJSONSchema(unitFileSchema, {
      target: 'draft-2020-12',
    }),
  };
}

export function serializeJsonSchema(schema: unknown): string {
  return `${JSON.stringify(schema, null, 2)}\n`;
}
