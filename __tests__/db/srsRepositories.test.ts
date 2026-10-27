import {
  addBookmark,
  clearBookmarks,
  clearKanaProgress,
  clearLessonProgress,
  clearSrsItems,
  countDueSrsItems,
  countSrsItems,
  getAllBookmarks,
  getAllLessonProgress,
  getAllSrsItems,
  getBookmarksForUnit,
  getDueSrsItems,
  getKanaProgress,
  getLessonProgress,
  getSrsItem,
  getSrsItemsByType,
  isBookmarked,
  removeBookmark,
  saveLessonProgress,
  saveSrsItem,
  toggleBookmark,
} from '@/db/repositories';
import { runMigrations } from '@/db/migrations/runner';
import type { Bookmark, LessonProgress, SrsItem } from '@/types/srs';

import { createTestDatabase, type TestDatabase } from '../helpers/testDatabase';

function makeSrsItem(
  itemId: string,
  itemType: SrsItem['itemType'] = 'kana',
  overrides: Partial<SrsItem> = {},
): SrsItem {
  return {
    itemId,
    itemType,
    seen: 2,
    correct: 1,
    wrong: 1,
    streak: 0,
    ease: 2.4,
    intervalDays: 3,
    repetitions: 1,
    dueAt: 1_000,
    lastSeenAt: 900,
    firstSeenAt: 800,
    lapses: 1,
    ...overrides,
  };
}

function makeLesson(lessonId: string, overrides: Partial<LessonProgress> = {}): LessonProgress {
  return {
    lessonId,
    unitId: 'unit-greetings',
    completed: false,
    startedAt: 1_000,
    completedAt: 0,
    lastStudiedAt: 1_500,
    questions: 7,
    correct: 5,
    ...overrides,
  };
}

function makeBookmark(itemId: string, overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    itemId,
    itemType: 'vocabulary',
    unitId: 'unit-greetings',
    createdAt: 1_000,
    ...overrides,
  };
}

describe('generalized SRS repository', () => {
  let db: TestDatabase;

  beforeEach(async () => {
    db = await createTestDatabase();
    await runMigrations(db);
  });

  afterEach(() => {
    db.close();
  });

  it('round-trips items and keeps types separate', async () => {
    await saveSrsItem(db, makeSrsItem('hira-a', 'kana'));
    await saveSrsItem(db, makeSrsItem('greet-ohayou', 'vocabulary', { seen: 1 }));
    await saveSrsItem(db, makeSrsItem('greet-sentence', 'sentence', { seen: 4 }));

    await expect(getSrsItem(db, 'hira-a', 'kana')).resolves.toEqual(makeSrsItem('hira-a', 'kana'));
    await expect(getSrsItem(db, 'hira-a', 'vocabulary')).resolves.toBeNull();
    await expect(countSrsItems(db)).resolves.toBe(3);
    await expect(countSrsItems(db, 'vocabulary')).resolves.toBe(1);
    await expect(getSrsItemsByType(db, 'sentence')).resolves.toEqual([
      makeSrsItem('greet-sentence', 'sentence', { seen: 4 }),
    ]);

    const all = await getAllSrsItems(db);
    expect(all.map((item) => `${item.itemType}:${item.itemId}`)).toEqual([
      'kana:hira-a',
      'sentence:greet-sentence',
      'vocabulary:greet-ohayou',
    ]);
  });

  it('preserves firstSeenAt on update and mirrors kana rows into the v1 table', async () => {
    await saveSrsItem(db, makeSrsItem('hira-a', 'kana'));
    await saveSrsItem(db, makeSrsItem('hira-a', 'kana', { seen: 5, firstSeenAt: 0 }));

    await expect(getKanaProgress(db, 'hira-a')).resolves.toMatchObject({
      seen: 5,
      firstSeenAt: 800,
    });

    const legacy = await db.getFirstAsync<{ seen: number; first_seen_at: number }>(
      'SELECT seen, first_seen_at FROM kana_progress WHERE kana_id = ?',
      'hira-a',
    );
    expect(legacy).toEqual({ seen: 5, first_seen_at: 800 });
  });

  it('returns due items in due order and filters by type', async () => {
    await saveSrsItem(db, makeSrsItem('kana-late', 'kana', { dueAt: 900 }));
    await saveSrsItem(db, makeSrsItem('kana-early', 'kana', { dueAt: 100 }));
    await saveSrsItem(db, makeSrsItem('vocab-due', 'vocabulary', { dueAt: 50 }));
    await saveSrsItem(db, makeSrsItem('vocab-future', 'vocabulary', { dueAt: 9_000 }));

    expect((await getDueSrsItems(db, 1_000, 10)).map((item) => item.itemId)).toEqual([
      'vocab-due',
      'kana-early',
      'kana-late',
    ]);
    expect((await getDueSrsItems(db, 1_000, 10, 'kana')).map((item) => item.itemId)).toEqual([
      'kana-early',
      'kana-late',
    ]);
    await expect(getDueSrsItems(db, 1_000, 0)).resolves.toEqual([]);
    await expect(countDueSrsItems(db, 1_000)).resolves.toBe(3);
    await expect(countDueSrsItems(db, 1_000, 'vocabulary')).resolves.toBe(1);
  });

  it('clears one type, then everything, including the legacy mirror', async () => {
    await saveSrsItem(db, makeSrsItem('hira-a', 'kana'));
    await saveSrsItem(db, makeSrsItem('greet-ohayou', 'vocabulary'));

    await clearKanaProgress(db);
    await expect(countSrsItems(db, 'kana')).resolves.toBe(0);
    await expect(countSrsItems(db, 'vocabulary')).resolves.toBe(1);
    const legacyCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM kana_progress',
    );
    expect(legacyCount?.count).toBe(0);

    await clearSrsItems(db, 'vocabulary');
    await expect(countSrsItems(db)).resolves.toBe(0);
  });
});

describe('lesson progress repository', () => {
  let db: TestDatabase;

  beforeEach(async () => {
    db = await createTestDatabase();
    await runMigrations(db);
  });

  afterEach(() => {
    db.close();
  });

  it('round-trips lesson results and preserves the first start time', async () => {
    await saveLessonProgress(db, makeLesson('greetings-1'));
    await saveLessonProgress(
      db,
      makeLesson('greetings-1', {
        completed: true,
        completedAt: 2_000,
        startedAt: 0,
        questions: 8,
        correct: 8,
      }),
    );

    await expect(getLessonProgress(db, 'greetings-1')).resolves.toEqual(
      makeLesson('greetings-1', {
        completed: true,
        completedAt: 2_000,
        questions: 8,
        correct: 8,
      }),
    );

    await saveLessonProgress(db, makeLesson('objects-3', { lastStudiedAt: 3_000 }));
    expect((await getAllLessonProgress(db)).map((row) => row.lessonId)).toEqual([
      'greetings-1',
      'objects-3',
    ]);
    await expect(getLessonProgress(db, 'missing')).resolves.toBeNull();

    await clearLessonProgress(db);
    await expect(getAllLessonProgress(db)).resolves.toEqual([]);
  });
});

describe('bookmark repository', () => {
  let db: TestDatabase;

  beforeEach(async () => {
    db = await createTestDatabase();
    await runMigrations(db);
  });

  afterEach(() => {
    db.close();
  });

  it('adds, lists, filters and removes bookmarks', async () => {
    await addBookmark(db, makeBookmark('greet-ohayou', { createdAt: 1_000 }));
    await addBookmark(
      db,
      makeBookmark('obj-book', {
        itemType: 'sentence',
        unitId: 'unit-objects',
        createdAt: 2_000,
      }),
    );

    await expect(isBookmarked(db, 'greet-ohayou', 'vocabulary')).resolves.toBe(true);
    await expect(isBookmarked(db, 'greet-ohayou', 'sentence')).resolves.toBe(false);
    expect((await getAllBookmarks(db)).map((row) => row.itemId)).toEqual([
      'obj-book',
      'greet-ohayou',
    ]);
    expect((await getBookmarksForUnit(db, 'unit-objects')).map((row) => row.itemId)).toEqual([
      'obj-book',
    ]);

    await removeBookmark(db, 'greet-ohayou', 'vocabulary');
    await expect(isBookmarked(db, 'greet-ohayou', 'vocabulary')).resolves.toBe(false);
  });

  it('keeps the original created time on duplicate adds and supports toggling', async () => {
    await addBookmark(db, makeBookmark('greet-ohayou', { createdAt: 1_000 }));
    await addBookmark(db, makeBookmark('greet-ohayou', { createdAt: 5_000 }));
    expect((await getAllBookmarks(db))[0]?.createdAt).toBe(1_000);

    await expect(toggleBookmark(db, makeBookmark('greet-ohayou'))).resolves.toBe(false);
    await expect(isBookmarked(db, 'greet-ohayou', 'vocabulary')).resolves.toBe(false);
    await expect(toggleBookmark(db, makeBookmark('greet-ohayou'))).resolves.toBe(true);
    await expect(isBookmarked(db, 'greet-ohayou', 'vocabulary')).resolves.toBe(true);

    await clearBookmarks(db);
    await expect(getAllBookmarks(db)).resolves.toEqual([]);
  });
});
