import type { UnitFile } from '@/features/content';
import { contentRegistry } from '@/features/content';
import { buildCourseOverview, findLessonById, findUnitById } from '@/features/lessons/course';
import { loadCourseContent } from '@/features/lessons/content';
import { localizedDescription, localizedTitle } from '@/features/lessons/labels';
import type { LessonProgress } from '@/types/srs';

import { makeValidUnit } from '../fixtures/content';

const BASE = makeValidUnit();

function progressFor(
  lessonId: string,
  unitId: string,
  options: { completed?: boolean; correct?: number; questions?: number } = {},
): LessonProgress {
  const completed = options.completed ?? false;
  return {
    lessonId,
    unitId,
    completed,
    startedAt: 1000,
    completedAt: completed ? 2000 : 0,
    lastStudiedAt: 2000,
    questions: options.questions ?? 4,
    correct: options.correct ?? 4,
  };
}

function unitCopy(id: string, order: number, requiresUnitId?: string): UnitFile {
  const clone = structuredClone(BASE);
  const lessonIds = clone.lessons.map((lesson) => `${id}-${lesson.id}`);
  return {
    ...clone,
    unit: {
      ...clone.unit,
      id,
      order,
      titleUr: `${clone.unit.titleUr} ${order}`,
      titleEn: `${clone.unit.titleEn} ${order}`,
      lessons: clone.unit.lessons.map((ref, index) => ({
        id: lessonIds[index] ?? ref.id,
      })),
      unlock: requiresUnitId ? { requiresUnitId } : {},
    },
    lessons: clone.lessons.map((lesson, index) => ({
      ...lesson,
      id: lessonIds[index] ?? lesson.id,
      unitId: id,
    })),
    vocabulary: [],
    sentences: [],
  };
}

describe('course overview', () => {
  it('opens the first lesson and locks the rest until each predecessor is complete', () => {
    const [unit] = buildCourseOverview([BASE], []);
    expect(unit).toBeDefined();
    if (!unit) return;

    expect(unit.status).toBe('available');
    expect(unit.unlocked).toBe(true);
    expect(unit.completedLessons).toBe(0);
    expect(unit.progressRatio).toBe(0);
    expect(unit.lessons.map((entry) => entry.status)).toEqual(['available', 'locked', 'locked']);
  });

  it('unlocks the next lesson after its predecessor is completed', () => {
    const first = BASE.lessons[0]!;
    const overview = buildCourseOverview(
      [BASE],
      [progressFor(first.id, BASE.unit.id, { completed: true, correct: 3, questions: 4 })],
    );
    const lessons = overview[0]?.lessons ?? [];

    expect(lessons.map((entry) => entry.status)).toEqual(['completed', 'available', 'locked']);
    expect(lessons[0]?.accuracy).toBe(0.75);
    expect(overview[0]?.completedLessons).toBe(1);
    expect(overview[0]?.progressRatio).toBeCloseTo(1 / 3);
  });

  it('marks a unit complete only when every lesson is complete', () => {
    const rows = BASE.lessons.map((lesson) =>
      progressFor(lesson.id, BASE.unit.id, { completed: true }),
    );
    const [unit] = buildCourseOverview([BASE], rows);

    expect(unit?.status).toBe('completed');
    expect(unit?.completedLessons).toBe(3);
    expect(unit?.progressRatio).toBe(1);
  });

  it('keeps later units locked until the required unit is fully complete', () => {
    const first = unitCopy('unit-one', 1);
    const second = unitCopy('unit-two', 2, 'unit-one');

    const incomplete = buildCourseOverview([first, second], []);
    expect(incomplete[1]?.status).toBe('locked');
    expect(incomplete[1]?.unlocked).toBe(false);
    expect(incomplete[1]?.lessons.every((entry) => entry.status === 'locked')).toBe(true);

    const firstRows = first.lessons.map((lesson) =>
      progressFor(lesson.id, first.unit.id, { completed: true }),
    );
    const complete = buildCourseOverview([first, second], firstRows);
    expect(complete[1]?.unlocked).toBe(true);
    expect(complete[1]?.status).toBe('available');
    expect(complete[1]?.lessons[0]?.status).toBe('available');
  });

  it('applies the minimum accuracy of a required unit', () => {
    const first = unitCopy('unit-one', 1);
    const second = unitCopy('unit-two', 2, 'unit-one');
    second.unit.unlock = { requiresUnitId: 'unit-one', minAccuracy: 0.8 };

    const lowRows = first.lessons.map((lesson, index) =>
      progressFor(lesson.id, first.unit.id, {
        completed: true,
        correct: index === 0 ? 0 : 3,
        questions: 4,
      }),
    );
    expect(buildCourseOverview([first, second], lowRows)[1]?.unlocked).toBe(false);

    const highRows = first.lessons.map((lesson) =>
      progressFor(lesson.id, first.unit.id, { completed: true, correct: 4, questions: 4 }),
    );
    expect(buildCourseOverview([first, second], highRows)[1]?.unlocked).toBe(true);
  });

  it('orders units by their course order', () => {
    const later = unitCopy('unit-later', 2);
    const earlier = unitCopy('unit-earlier', 1);
    const overview = buildCourseOverview([later, earlier], []);

    expect(overview.map((entry) => entry.file.unit.id)).toEqual(['unit-earlier', 'unit-later']);
  });
});

describe('lesson lookups', () => {
  it('finds lessons and units by id', () => {
    const lesson = BASE.lessons[1]!;
    const match = findLessonById([BASE], lesson.id);

    expect(match?.lesson.id).toBe(lesson.id);
    expect(match?.file.unit.id).toBe(BASE.unit.id);
    expect(findLessonById([BASE], 'missing-lesson')).toBeNull();
    expect(findUnitById([BASE], BASE.unit.id)).toBe(BASE);
    expect(findUnitById([BASE], 'missing-unit')).toBeNull();
  });
});

describe('lesson content and labels', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads registered content and reports parse failures without throwing', () => {
    const loaded = loadCourseContent();
    expect(loaded.error).toBeNull();
    expect(Array.isArray(loaded.units)).toBe(true);

    jest.spyOn(contentRegistry, 'loadAllUnits').mockImplementation(() => {
      throw new Error('Unit file is invalid');
    });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const broken = loadCourseContent();
    expect(broken.units).toEqual([]);
    expect(broken.error).toBe('Unit file is invalid');
  });

  it('picks the requested language for unit and lesson labels', () => {
    const entry = {
      titleUr: 'عنوان',
      titleEn: 'Title',
      descriptionUr: 'تفصیل',
      descriptionEn: 'Description',
    };

    expect(localizedTitle(entry, 'ur')).toBe('عنوان');
    expect(localizedTitle(entry, 'en')).toBe('Title');
    expect(localizedDescription(entry, 'ur')).toBe('تفصیل');
    expect(localizedDescription(entry, 'en')).toBe('Description');
  });
});
