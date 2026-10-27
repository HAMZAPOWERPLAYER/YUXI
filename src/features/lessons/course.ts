import type { Lesson, UnitFile } from '@/features/content';
import type { LessonProgress } from '@/types/srs';

export type LessonStatus = 'completed' | 'available' | 'locked';
export type UnitStatus = 'completed' | 'available' | 'locked';

export type LessonOverview = {
  lesson: Lesson;
  status: LessonStatus;
  progress: LessonProgress | null;
  /** Correct answers divided by answers in the last run, or null if unseen. */
  accuracy: number | null;
};

export type UnitOverview = {
  file: UnitFile;
  status: UnitStatus;
  unlocked: boolean;
  lessons: LessonOverview[];
  completedLessons: number;
  totalLessons: number;
  /** 0–1 share of lessons marked complete. */
  progressRatio: number;
};

export type LessonMatch = {
  file: UnitFile;
  lesson: Lesson;
};

function byOrderThenId<T extends { order: number; id: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

function accuracyOf(rows: readonly LessonProgress[]): number | null {
  let questions = 0;
  let correct = 0;
  for (const row of rows) {
    const rowQuestions = Math.max(0, row.questions);
    questions += rowQuestions;
    correct += Math.min(Math.max(0, row.correct), rowQuestions);
  }
  return questions > 0 ? correct / questions : null;
}

/** Finds a lesson across units. Lesson ids are globally unique. */
export function findLessonById(units: readonly UnitFile[], lessonId: string): LessonMatch | null {
  for (const file of units) {
    const lesson = file.lessons.find((entry) => entry.id === lessonId);
    if (lesson) return { file, lesson };
  }
  return null;
}

export function findUnitById(units: readonly UnitFile[], unitId: string): UnitFile | null {
  return units.find((file) => file.unit.id === unitId) ?? null;
}

/**
 * Builds the course read model used by the lesson browser and the player.
 *
 * - A unit with no `requiresUnitId` is open.
 * - A required unit must be fully complete; `minAccuracy` additionally checks
 *   the answers saved for that unit.
 * - The first lesson is open; each later lesson opens when the previous one is
 *   complete. Completed lessons stay complete and reviewable.
 */
export function buildCourseOverview(
  units: readonly UnitFile[],
  progress: readonly LessonProgress[],
): UnitOverview[] {
  const progressById = new Map(progress.map((row) => [row.lessonId, row]));
  const unitsById = new Map(units.map((file) => [file.unit.id, file]));

  const completeByUnit = new Map<string, boolean>();
  for (const file of units) {
    completeByUnit.set(
      file.unit.id,
      file.lessons.length > 0 &&
        file.lessons.every((lesson) => progressById.get(lesson.id)?.completed === true),
    );
  }

  const isUnlocked = (file: UnitFile): boolean => {
    const requiredId = file.unit.unlock.requiresUnitId;
    if (!requiredId) return true;

    const required = unitsById.get(requiredId);
    if (!required || completeByUnit.get(requiredId) !== true) return false;

    const minAccuracy = file.unit.unlock.minAccuracy;
    if (minAccuracy === undefined) return true;

    const rows = required.lessons
      .map((lesson) => progressById.get(lesson.id))
      .filter((row): row is LessonProgress => row !== undefined);
    const accuracy = accuracyOf(rows) ?? 0;
    return accuracy >= minAccuracy;
  };

  return [...units]
    .sort((a, b) => a.unit.order - b.unit.order || a.unit.id.localeCompare(b.unit.id))
    .map((file) => {
      const unlocked = isUnlocked(file);
      let previousCompleted = true;

      const lessons = byOrderThenId(file.lessons).map((lesson): LessonOverview => {
        const row = progressById.get(lesson.id) ?? null;
        const completed = row?.completed === true;

        let status: LessonStatus;
        if (!unlocked) status = 'locked';
        else if (completed) status = 'completed';
        else if (previousCompleted) status = 'available';
        else status = 'locked';

        previousCompleted = completed;

        return {
          lesson,
          status,
          progress: row,
          accuracy: row ? accuracyOf([row]) : null,
        };
      });

      const completedLessons = lessons.filter((entry) => entry.status === 'completed').length;
      const totalLessons = lessons.length;

      return {
        file,
        unlocked,
        status: !unlocked
          ? 'locked'
          : totalLessons > 0 && completedLessons === totalLessons
            ? 'completed'
            : 'available',
        lessons,
        completedLessons,
        totalLessons,
        progressRatio: totalLessons > 0 ? completedLessons / totalLessons : 0,
      };
    });
}
