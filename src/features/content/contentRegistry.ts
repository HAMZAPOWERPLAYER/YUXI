import type { z } from 'zod';

import courseJson from './data/course.json';
import { courseFileSchema, unitFileSchema } from './schema';
import type { CourseFile, UnitFile } from './types';

/**
 * Content source used by the registry. Unit loaders must be explicit because
 * Metro cannot resolve a computed `require()` path at bundle time. Keeping the
 * map explicit also makes the set of shippable units reviewable in one file.
 */
export type ContentSource = {
  course: () => unknown;
  units: Record<string, () => unknown>;
};

export type ContentRegistry = {
  /** Parsed course index. Cached after the first successful load. */
  loadCourse(): CourseFile;
  /** Parsed unit file for `unitId`. Unknown ids and invalid files throw. */
  loadUnit(unitId: string): UnitFile;
  /** Every registered unit, ordered by `unit.order`. */
  loadAllUnits(): UnitFile[];
  /** Registered unit ids in source order (sorted for stable output). */
  unitIds(): string[];
  /** Drop parsed copies so the next read re-parses the source. */
  clearCache(): void;
};

function describeIssues(error: {
  issues: readonly { path: readonly PropertyKey[]; message: string }[];
}): string {
  return error.issues
    .map((issue) => `${issue.path.map(String).join('.') || '<root>'}: ${issue.message}`)
    .join('; ');
}

function parseFile<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(`${label} failed schema validation: ${describeIssues(result.error)}`);
  }
  return result.data;
}

/**
 * Creates a registry over a content source. Exported separately from the app
 * singleton so tests can use in-memory fixtures without touching real data.
 */
export function createContentRegistry(source: ContentSource): ContentRegistry {
  const sourceUnitIds = Object.keys(source.units).sort();
  let courseCache: CourseFile | undefined;
  const unitCache = new Map<string, UnitFile>();

  const unitIds = (): string[] => [...sourceUnitIds];

  const loadCourse = (): CourseFile => {
    if (courseCache) return courseCache;
    courseCache = parseFile(courseFileSchema, source.course(), 'course.json');
    return courseCache;
  };

  const loadUnit = (unitId: string): UnitFile => {
    const cached = unitCache.get(unitId);
    if (cached) return cached;

    const load = source.units[unitId];
    if (!load) {
      throw new Error(`Unknown content unit "${unitId}". Add it to contentRegistry.ts.`);
    }

    const parsed = parseFile(unitFileSchema, load(), `unit file "${unitId}"`);
    if (parsed.unit.id !== unitId) {
      throw new Error(`Unit file registered as "${unitId}" declares unit.id "${parsed.unit.id}".`);
    }

    unitCache.set(unitId, parsed);
    return parsed;
  };

  const loadAllUnits = (): UnitFile[] =>
    unitIds()
      .map(loadUnit)
      .sort((a, b) => a.unit.order - b.unit.order);

  const clearCache = (): void => {
    courseCache = undefined;
    unitCache.clear();
  };

  return { loadCourse, loadUnit, loadAllUnits, unitIds, clearCache };
}

/**
 * App registry. Add one entry per unit file when authoring a unit, for example:
 *
 *   'unit-01-greetings': () => require('./data/units/unit-01-greetings.json'),
 *
 * The literal `require` is required for Metro to bundle the JSON file.
 */
export const contentRegistry = createContentRegistry({
  course: () => courseJson,
  units: {
    'unit-01-greetings': () => require('./data/units/unit-01-greetings.json'),
    'unit-02-introductions': () => require('./data/units/unit-02-introductions.json'),
    'unit-03-family-home': () => require('./data/units/unit-03-family-home.json'),
    'unit-04-objects': () => require('./data/units/unit-04-objects.json'),
    'unit-05-numbers': () => require('./data/units/unit-05-numbers.json'),
  },
});
