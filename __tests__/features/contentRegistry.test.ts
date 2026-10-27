import { createContentRegistry, contentRegistry } from '@/features/content/contentRegistry';

import { makeValidCourse, makeValidUnit } from '../fixtures/content';

describe('content registry', () => {
  it('loads the committed course index', () => {
    const course = contentRegistry.loadCourse();
    expect(course.schemaVersion).toBe(1);
    expect(course.course.id).toBe('yuxi-course');
    expect(Array.isArray(course.course.units)).toBe(true);
  });

  it('loads every explicitly registered unit', () => {
    expect(contentRegistry.unitIds()).toEqual([...contentRegistry.unitIds()].sort());
    for (const unitId of contentRegistry.unitIds()) {
      const unit = contentRegistry.loadUnit(unitId);
      expect(unit.unit.id).toBe(unitId);
    }
  });

  it('caches parsed files and clears them on demand', () => {
    const courseLoader = jest.fn(() => makeValidCourse());
    const unitLoader = jest.fn(() => makeValidUnit());
    const registry = createContentRegistry({
      course: courseLoader,
      units: { 'unit-greetings': unitLoader },
    });

    expect(registry.loadCourse()).toEqual(registry.loadCourse());
    expect(courseLoader).toHaveBeenCalledTimes(1);

    expect(registry.loadUnit('unit-greetings')).toEqual(registry.loadUnit('unit-greetings'));
    expect(unitLoader).toHaveBeenCalledTimes(1);

    registry.clearCache();
    registry.loadCourse();
    registry.loadUnit('unit-greetings');
    expect(courseLoader).toHaveBeenCalledTimes(2);
    expect(unitLoader).toHaveBeenCalledTimes(2);
  });

  it('orders all units by unit.order, not loader key', () => {
    const second = makeValidUnit();
    second.unit.id = 'unit-second';
    second.unit.order = 2;

    const registry = createContentRegistry({
      course: () => makeValidCourse(),
      units: {
        'unit-second': () => second,
        'unit-greetings': () => makeValidUnit(),
      },
    });

    expect(registry.loadAllUnits().map((unit) => unit.unit.id)).toEqual([
      'unit-greetings',
      'unit-second',
    ]);
    expect(registry.unitIds()).toEqual(['unit-greetings', 'unit-second']);
  });

  it('throws a helpful error for an unknown unit', () => {
    const registry = createContentRegistry({
      course: () => makeValidCourse(),
      units: {},
    });
    expect(() => registry.loadUnit('unit-missing')).toThrow('Unknown content unit "unit-missing"');
  });

  it('throws a schema error for an invalid file', () => {
    const registry = createContentRegistry({
      course: () => makeValidCourse(),
      units: { 'unit-greetings': () => ({}) },
    });
    expect(() => registry.loadUnit('unit-greetings')).toThrow(
      /unit file "unit-greetings" failed schema validation/,
    );
  });

  it('throws when the registered id and file id disagree', () => {
    const renamed = makeValidUnit();
    renamed.unit.id = 'unit-other';
    const registry = createContentRegistry({
      course: () => makeValidCourse(),
      units: { 'unit-greetings': () => renamed },
    });
    expect(() => registry.loadUnit('unit-greetings')).toThrow(
      'Unit file registered as "unit-greetings" declares unit.id "unit-other"',
    );
  });

  it('throws a schema error for an invalid course file', () => {
    const registry = createContentRegistry({
      course: () => ({ needsHumanReview: false }),
      units: {},
    });
    expect(() => registry.loadCourse()).toThrow(/course\.json failed schema validation/);
  });
});
