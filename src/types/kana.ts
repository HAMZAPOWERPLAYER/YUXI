export type {
  Bookmark,
  BookmarkItemType,
  KanaReviewMode,
  LearningItemType,
  LessonProgress,
  ReviewLogEntry,
  ReviewMode,
  SrsItem,
} from './srs';

export type KanaScript = 'hiragana' | 'katakana';
export type KanaGroup = 'basic' | 'dakuten' | 'yoon';

export type Kana = {
  id: string;
  script: KanaScript;
  kana: string;
  romaji: string;
  row: string;
  group: KanaGroup;
  urduHint: string;
  confusableWith?: string[];
  ttsText: string;
};

export type KanaProgress = {
  kanaId: string;
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

export type DailyStats = {
  day: string;
  xp: number;
  secondsActive: number;
  questions: number;
  correct: number;
  goalMet: boolean;
};

export type SettingsValue = string | number | boolean;
