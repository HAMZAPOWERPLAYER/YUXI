import { validateSentenceItem, validateVocabItem } from './itemValidation';
import type {
  ContentBundle,
  ContentItem,
  ContentStats,
  Lesson,
  SentenceItem,
  UnitFile,
  UnitRef,
  ValidationIssue,
  ValidationResult,
  ValidationSeverity,
  VocabItem,
} from './types';

type AddIssue = (severity: ValidationSeverity, code: string, path: string, message: string) => void;

function unitPath(file: UnitFile, index: number): string {
  return `units[${index}](${file.unit.id})`;
}

function checkCourseRefs(course: ContentBundle['course'], add: AddIssue): Map<string, UnitRef> {
  const refs = new Map<string, UnitRef>();
  const orders = new Map<number, string>();

  course.course.units.forEach((ref, index) => {
    const path = `course.units[${index}]`;
    if (refs.has(ref.id)) {
      add('error', 'duplicate-unit-ref', path, `Duplicate course reference "${ref.id}"`);
    } else {
      refs.set(ref.id, ref);
    }

    const existing = orders.get(ref.order);
    if (existing) {
      add(
        'error',
        'duplicate-unit-order',
        path,
        `Unit order ${ref.order} is already used by "${existing}"`,
      );
    } else {
      orders.set(ref.order, ref.id);
    }
  });

  return refs;
}

function checkUnitMetadata(
  file: UnitFile,
  ref: UnitRef | undefined,
  path: string,
  add: AddIssue,
): void {
  if (!ref) {
    add('error', 'unit-not-in-course', path, 'Unit file is not listed in course.json');
    return;
  }

  const fields = ['order', 'titleUr', 'titleEn', 'icon'] as const;
  for (const field of fields) {
    if (file.unit[field] !== ref[field]) {
      add(
        'error',
        'course-metadata-mismatch',
        `${path}/unit/${field}`,
        `Unit file and course.json disagree on "${field}"`,
      );
    }
  }
}

function checkUnitStructure(file: UnitFile, path: string, add: AddIssue): Map<string, Lesson> {
  const lessons = new Map<string, Lesson>();
  const orders = new Map<number, string>();

  if (file.lessons.length < 3 || file.lessons.length > 5) {
    add(
      'error',
      'unit-lesson-count',
      `${path}/lessons`,
      `A unit must have 3–5 lessons; found ${file.lessons.length}`,
    );
  }

  file.lessons.forEach((lesson, index) => {
    const lessonPath = `${path}/lessons[${index}](${lesson.id})`;
    if (lessons.has(lesson.id)) {
      add('error', 'duplicate-lesson-id', lessonPath, `Duplicate lesson id "${lesson.id}"`);
    } else {
      lessons.set(lesson.id, lesson);
    }

    if (lesson.unitId !== file.unit.id) {
      add(
        'error',
        'lesson-unit-mismatch',
        `${lessonPath}/unitId`,
        'Lesson unitId does not match its unit',
      );
    }
    if (lesson.order < 1) {
      add('error', 'invalid-lesson-order', `${lessonPath}/order`, 'Lesson order must start at 1');
    }
    const existing = orders.get(lesson.order);
    if (existing) {
      add(
        'error',
        'duplicate-lesson-order',
        `${lessonPath}/order`,
        `Lesson order ${lesson.order} is already used by "${existing}"`,
      );
    } else {
      orders.set(lesson.order, lesson.id);
    }
    if (lesson.items.length < 6 || lesson.items.length > 10) {
      add(
        'error',
        'lesson-item-count',
        `${lessonPath}/items`,
        `A lesson must have 6–10 items; found ${lesson.items.length}`,
      );
    }
  });

  const refIds = new Set<string>();
  file.unit.lessons.forEach((ref, index) => {
    if (refIds.has(ref.id)) {
      add(
        'error',
        'duplicate-lesson-ref',
        `${path}/unit/lessons[${index}]`,
        `Duplicate lesson reference "${ref.id}"`,
      );
    }
    refIds.add(ref.id);
    if (!lessons.has(ref.id)) {
      add(
        'error',
        'missing-lesson',
        `${path}/unit/lessons[${index}]`,
        `Lesson "${ref.id}" is referenced but missing from the file`,
      );
    }
  });

  for (const lesson of file.lessons) {
    if (!refIds.has(lesson.id)) {
      add(
        'error',
        'lesson-not-in-unit',
        `${path}/lessons(${lesson.id})`,
        `Lesson "${lesson.id}" is not listed in unit.lessons`,
      );
    }
  }

  return lessons;
}

function checkUnlock(
  file: UnitFile,
  refs: Map<string, UnitRef>,
  path: string,
  add: AddIssue,
): void {
  const required = file.unit.unlock.requiresUnitId;
  if (!required) return;

  if (required === file.unit.id) {
    add('error', 'self-unlock', `${path}/unit/unlock`, 'A unit cannot unlock itself');
    return;
  }

  const requiredRef = refs.get(required);
  if (!requiredRef) {
    add(
      'error',
      'unknown-unlock-unit',
      `${path}/unit/unlock/requiresUnitId`,
      `Unknown required unit "${required}"`,
    );
  } else if (requiredRef.order >= file.unit.order) {
    add(
      'error',
      'unlock-order',
      `${path}/unit/unlock/requiresUnitId`,
      'A unit can only require an earlier unit',
    );
  }
}

function checkExercises(
  lesson: Lesson,
  unitItemIds: ReadonlySet<string>,
  items: Map<string, ContentItem>,
  path: string,
  add: AddIssue,
): void {
  (lesson.exercises ?? []).forEach((exercise, index) => {
    const exercisePath = `${path}/exercises[${index}]`;
    const refs = [
      ...(exercise.itemId ? [exercise.itemId] : []),
      ...(exercise.itemIds ?? []),
      ...(exercise.sentenceId ? [exercise.sentenceId] : []),
    ];
    for (const ref of refs) {
      if (!items.has(ref)) {
        add(
          'error',
          'broken-exercise-ref',
          exercisePath,
          `Exercise references unknown item "${ref}"`,
        );
      } else if (!unitItemIds.has(ref)) {
        add(
          'error',
          'cross-unit-exercise-ref',
          exercisePath,
          `Exercise references item "${ref}" from another unit`,
        );
      }
    }
  });
}

function checkReferences(
  file: UnitFile,
  path: string,
  add: AddIssue,
  items: Map<string, ContentItem>,
  lessons: Map<string, Lesson>,
): void {
  const vocabulary = new Map<string, VocabItem>();
  const sentences = new Map<string, SentenceItem>();
  const refs = new Map<string, { lessonId: string; kind: string }>();

  for (const item of file.vocabulary) {
    if (vocabulary.has(item.id)) {
      add(
        'error',
        'duplicate-vocab-id',
        `${path}/vocabulary`,
        `Duplicate vocabulary id "${item.id}"`,
      );
    }
    if (items.has(item.id)) {
      add(
        'error',
        'duplicate-content-id',
        `${path}/vocabulary(${item.id})`,
        `Item id "${item.id}" is used elsewhere`,
      );
    }
    vocabulary.set(item.id, item);
    items.set(item.id, item);
  }
  for (const item of file.sentences) {
    if (sentences.has(item.id)) {
      add(
        'error',
        'duplicate-sentence-id',
        `${path}/sentences`,
        `Duplicate sentence id "${item.id}"`,
      );
    }
    if (items.has(item.id)) {
      add(
        'error',
        'duplicate-content-id',
        `${path}/sentences(${item.id})`,
        `Item id "${item.id}" is used elsewhere`,
      );
    }
    sentences.set(item.id, item);
    items.set(item.id, item);
  }

  for (const lesson of lessons.values()) {
    lesson.items.forEach((ref, index) => {
      if (refs.has(ref.id)) {
        add(
          'error',
          'duplicate-item-ref',
          `${path}/lessons(${lesson.id})/items[${index}]`,
          `Item "${ref.id}" is referenced more than once`,
        );
      } else {
        refs.set(ref.id, { lessonId: lesson.id, kind: ref.kind });
      }
    });
  }

  for (const [id, ref] of refs) {
    const item = items.get(id);
    if (!item) {
      add('error', 'missing-item', `${path}/lessons(${ref.lessonId})`, `Item "${id}" is missing`);
      continue;
    }
    if (item.unitId !== file.unit.id) {
      add(
        'error',
        'item-unit-mismatch',
        `${path}/items(${id})`,
        'Item unitId does not match its unit',
      );
    }
    if (item.lessonId !== ref.lessonId) {
      add(
        'error',
        'item-lesson-mismatch',
        `${path}/items(${id})`,
        'Item lessonId does not match the lesson',
      );
    }
    const expectedKind = item.kind === 'sentence' ? 'sentence' : item.kind;
    if (ref.kind !== expectedKind) {
      add(
        'error',
        'item-kind-mismatch',
        `${path}/items(${id})`,
        'Lesson item kind does not match the item',
      );
    }
  }

  for (const item of [...file.vocabulary, ...file.sentences]) {
    if (!refs.has(item.id)) {
      add(
        'error',
        'item-not-in-lesson',
        `${path}/items(${item.id})`,
        'Item is not listed in any lesson',
      );
    }
  }

  for (const item of file.vocabulary) {
    for (const exampleId of item.exampleIds) {
      const example = sentences.get(exampleId);
      if (!example) {
        add(
          'error',
          'broken-example-id',
          `${path}/vocabulary(${item.id})`,
          `Unknown example "${exampleId}"`,
        );
      } else if (example.unitId !== file.unit.id) {
        add(
          'error',
          'cross-unit-example',
          `${path}/vocabulary(${item.id})`,
          'Example is in another unit',
        );
      }
    }
  }

  for (const sentence of file.sentences) {
    for (const vocabId of sentence.vocabIds) {
      const vocab = vocabulary.get(vocabId);
      if (!vocab) {
        add(
          'error',
          'broken-vocab-id',
          `${path}/sentences(${sentence.id})`,
          `Unknown vocabulary "${vocabId}"`,
        );
      } else if (vocab.unitId !== file.unit.id) {
        add(
          'error',
          'cross-unit-vocab',
          `${path}/sentences(${sentence.id})`,
          'Vocabulary is in another unit',
        );
      }
    }
  }
}

/** Validates the whole bundle after each file has passed the Zod schema. */
export function validateContent(bundle: ContentBundle): ValidationResult {
  const issues: ValidationIssue[] = [];
  const add: AddIssue = (severity, code, path, message) => {
    issues.push({ severity, code, path, message });
  };

  const stats: ContentStats = {
    units: 0,
    lessons: 0,
    vocabulary: 0,
    sentences: 0,
    items: 0,
    byUnit: [],
  };

  const refs = checkCourseRefs(bundle.course, add);
  const unitFiles = new Map<string, UnitFile>();
  const items = new Map<string, ContentItem>();
  const lessonOwners = new Map<string, string>();

  bundle.units.forEach((file, index) => {
    const path = unitPath(file, index);
    if (unitFiles.has(file.unit.id)) {
      add('error', 'duplicate-unit-id', path, `Duplicate unit id "${file.unit.id}"`);
    } else {
      unitFiles.set(file.unit.id, file);
    }
    checkUnitMetadata(file, refs.get(file.unit.id), path, add);
  });

  for (const ref of refs.values()) {
    if (!unitFiles.has(ref.id)) {
      add(
        'error',
        'missing-unit-file',
        `course.units(${ref.id})`,
        'Course references a missing unit file',
      );
    }
  }

  for (const [index, file] of bundle.units.entries()) {
    const path = unitPath(file, index);
    const lessons = checkUnitStructure(file, path, add);
    for (const lesson of file.lessons) {
      const owner = lessonOwners.get(lesson.id);
      if (owner && owner !== file.unit.id) {
        add(
          'error',
          'duplicate-global-lesson-id',
          `${path}/lessons(${lesson.id})`,
          `Lesson id "${lesson.id}" is already used by unit "${owner}"`,
        );
      } else {
        lessonOwners.set(lesson.id, file.unit.id);
      }
    }
    checkUnlock(file, refs, path, add);
    checkReferences(file, path, add, items, lessons);

    const itemCount = file.vocabulary.length + file.sentences.length;
    if (itemCount < 20) {
      add(
        'error',
        'unit-too-small',
        `${path}/items`,
        `A unit must contain at least 20 items; found ${itemCount}`,
      );
    }

    for (const lesson of file.lessons) {
      const unitItemIds = new Set([...file.vocabulary, ...file.sentences].map((item) => item.id));
      for (const ref of lesson.items) {
        const item = items.get(ref.id);
        if (!item) continue;
        if (item.kind === 'sentence') {
          issues.push(...validateSentenceItem(item, `${path}/sentences(${item.id})`));
        } else {
          issues.push(...validateVocabItem(item, `${path}/vocabulary(${item.id})`));
        }
      }
      checkExercises(lesson, unitItemIds, items, `${path}/lessons(${lesson.id})`, add);
    }

    stats.lessons += file.lessons.length;
    stats.vocabulary += file.vocabulary.length;
    stats.sentences += file.sentences.length;
    stats.items += itemCount;
    stats.byUnit.push({
      id: file.unit.id,
      lessons: file.lessons.length,
      vocabulary: file.vocabulary.length,
      sentences: file.sentences.length,
      items: itemCount,
    });
  }

  stats.units = unitFiles.size;

  const ok = !issues.some((issue) => issue.severity === 'error');
  return { ok, issues, stats };
}
