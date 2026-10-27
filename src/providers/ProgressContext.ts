import { createContext } from 'react';

import type { LevelInfo, StreakSummary } from '@/features/progress';
import type { DailyStats, KanaProgress, ReviewLogEntry } from '@/types/kana';
import type { LessonProgress } from '@/types/srs';

export type ProgressStatus = 'loading' | 'ready' | 'error';

export type ProgressContextValue = {
  status: ProgressStatus;
  error: string | null;
  progress: readonly KanaProgress[];
  progressById: ReadonlyMap<string, KanaProgress>;
  lessonProgress: readonly LessonProgress[];
  lessonProgressById: ReadonlyMap<string, LessonProgress>;
  stats: readonly DailyStats[];
  meta: Readonly<Record<string, string | null>>;
  recentLog: readonly ReviewLogEntry[];
  todayStats: DailyStats;
  today: string;
  totalXp: number;
  level: LevelInfo;
  streak: StreakSummary;
  dueCount: number;
  studiedCount: number;
  accuracy7: number;
  accuracy30: number;
  recentKanaIds: readonly string[];
  refresh: () => Promise<void>;
};

export const ProgressContext = createContext<ProgressContextValue | null>(null);
