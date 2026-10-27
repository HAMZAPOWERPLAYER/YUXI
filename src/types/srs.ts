/**
 * Shared learning-item types. Kana, vocabulary and sentences all use the same
 * scheduling and review-log shapes so one engine can serve every part of the
 * course.
 */

export const LEARNING_ITEM_TYPES = ['kana', 'vocabulary', 'sentence'] as const;
export type LearningItemType = (typeof LEARNING_ITEM_TYPES)[number];

/** Item types that can be bookmarked from vocabulary search or a lesson. */
export const BOOKMARK_ITEM_TYPES = ['vocabulary', 'sentence'] as const;
export type BookmarkItemType = (typeof BOOKMARK_ITEM_TYPES)[number];

export const KANA_REVIEW_MODES = ['kana-to-romaji', 'romaji-to-kana', 'listening'] as const;
export type KanaReviewMode = (typeof KANA_REVIEW_MODES)[number];

export const REVIEW_MODES = [
  ...KANA_REVIEW_MODES,
  'meaning-choice',
  'reverse-choice',
  'type-romaji',
  'sentence-builder',
  'particle-cloze',
] as const;
export type ReviewMode = (typeof REVIEW_MODES)[number];

/** One scheduled learning item. `itemId` is globally unique content or kana id. */
export type SrsItem = {
  itemId: string;
  itemType: LearningItemType;
  seen: number;
  correct: number;
  wrong: number;
  streak: number;
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: number;
  lastSeenAt: number;
  firstSeenAt: number;
  lapses: number;
};

export type ReviewLogEntry = {
  id?: number;
  itemId: string;
  itemType: LearningItemType;
  mode: ReviewMode;
  correct: boolean;
  quality: number;
  responseMs: number;
  at: number;
};

/** A lesson result that survives restarts and travels in backups. */
export type LessonProgress = {
  lessonId: string;
  unitId: string;
  completed: boolean;
  startedAt: number;
  completedAt: number;
  lastStudiedAt: number;
  questions: number;
  correct: number;
};

/** A user-saved vocabulary or sentence. */
export type Bookmark = {
  itemId: string;
  itemType: BookmarkItemType;
  unitId: string;
  createdAt: number;
};
