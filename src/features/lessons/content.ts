import { contentRegistry } from '@/features/content';
import type { UnitFile } from '@/features/content';
import { logEvent } from '@/utils/logger';

export type CourseContent = {
  units: UnitFile[];
  error: string | null;
};

/**
 * Loads and parses every registered unit. Content is validated at build time,
 * but a broken file must show an error screen instead of crashing the app.
 */
export function loadCourseContent(): CourseContent {
  try {
    return { units: contentRegistry.loadAllUnits(), error: null };
  } catch (error) {
    logEvent('error', 'Could not load course content', error);
    return {
      units: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
