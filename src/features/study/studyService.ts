import {
  addDailyActivity,
  getDailyStats,
  getKanaProgress,
  insertReviewLog,
  saveKanaProgress,
  setMeta,
} from '@/db/repositories';
import type { DatabaseConnection } from '@/db/types';
import {
  resolveGoalMet,
  safeSeconds,
  xpForAnswer,
  xpForCompletedSession,
} from '@/features/progress';
import type { DailyGoalMinutes } from '@/features/settings/settingsModel';
import { applyReview } from '@/features/srs';
import type { KanaProgress, ReviewMode } from '@/types/kana';
import { isValidDayKey, toLocalDayKey } from '@/utils/date';
import { logEvent } from '@/utils/logger';

export const SESSION_META_PREFIX = 'session_completed:';
export const MAX_ACTIVE_SECONDS_PER_TICK = 120;

export type RecordAnswerInput = {
  kanaId: string;
  mode: ReviewMode;
  correct: boolean;
  responseMs: number;
  /** Timestamp of the answer; the local day is derived from it. */
  at: number;
  dailyGoalMinutes: DailyGoalMinutes;
  /** Seconds spent before answering, added to today's active time. */
  activeSeconds?: number;
  /** Optional guard so a retried write cannot double-award XP. */
  currentProgress?: KanaProgress | null;
};

export type RecordAnswerResult = {
  progress: KanaProgress;
  quality: number;
  xpEarned: number;
  day: string;
  goalMet: boolean;
  secondsActive: number;
};

function clampActiveSeconds(value: number | undefined): number {
  return Math.min(MAX_ACTIVE_SECONDS_PER_TICK, safeSeconds(value ?? 0));
}

/**
 * Persists one graded answer atomically: kana SRS state, review log and daily
 * totals move together. A failure rolls the whole answer back so stats and
 * progress can never disagree.
 */
export async function recordAnswer(
  db: DatabaseConnection,
  input: RecordAnswerInput,
): Promise<RecordAnswerResult> {
  const day = toLocalDayKey(input.at);
  const responseMs = Number.isFinite(input.responseMs)
    ? Math.max(0, Math.round(input.responseMs))
    : 0;
  const activeSeconds = clampActiveSeconds(input.activeSeconds);
  let result: RecordAnswerResult | null = null;

  await db.withTransactionAsync(async () => {
    const previous =
      input.currentProgress !== undefined
        ? input.currentProgress
        : await getKanaProgress(db, input.kanaId);
    const review = applyReview(previous, input.kanaId, {
      correct: input.correct,
      responseMs,
      nowMs: input.at,
    });

    await saveKanaProgress(db, review.progress);
    await insertReviewLog(db, {
      kanaId: input.kanaId,
      mode: input.mode,
      correct: input.correct,
      quality: review.quality,
      responseMs,
      at: input.at,
    });

    const existing = await getDailyStats(db, day);
    const secondsActive = safeSeconds(existing?.secondsActive ?? 0) + activeSeconds;
    const goalMet = resolveGoalMet(
      existing?.goalMet ?? false,
      secondsActive,
      input.dailyGoalMinutes,
    );
    const xpEarned = xpForAnswer(input.correct);

    await addDailyActivity(db, day, {
      xp: xpEarned,
      secondsActive: activeSeconds,
      questions: 1,
      correct: input.correct ? 1 : 0,
      goalMet,
    });

    result = {
      progress: review.progress,
      quality: review.quality,
      xpEarned,
      day,
      goalMet,
      secondsActive,
    };
  });

  if (!result) throw new Error('Answer was not saved');
  return result;
}

export type CompleteSessionInput = {
  at: number;
  questionCount: number;
  dailyGoalMinutes: DailyGoalMinutes;
};

export type CompleteSessionResult = {
  day: string;
  bonusXp: number;
};

/**
 * Marks the day as having a completed session and awards the session bonus.
 * The meta key also feeds the streak, so completing a session counts even if
 * the time goal was not reached.
 */
export async function completeSession(
  db: DatabaseConnection,
  input: CompleteSessionInput,
): Promise<CompleteSessionResult> {
  const day = toLocalDayKey(input.at);
  const bonusXp = xpForCompletedSession(input.questionCount);

  await db.withTransactionAsync(async () => {
    await setMeta(db, `${SESSION_META_PREFIX}${day}`, '1');
    if (bonusXp <= 0) return;

    const existing = await getDailyStats(db, day);
    const goalMet = resolveGoalMet(
      existing?.goalMet ?? false,
      existing?.secondsActive ?? 0,
      input.dailyGoalMinutes,
    );
    await addDailyActivity(db, day, {
      xp: bonusXp,
      secondsActive: 0,
      questions: 0,
      correct: 0,
      goalMet,
    });
  });

  return { day, bonusXp };
}

export type RecordSecondsInput = {
  at: number;
  seconds: number;
  dailyGoalMinutes: DailyGoalMinutes;
};

export type RecordSecondsResult = {
  day: string;
  secondsAdded: number;
  goalMet: boolean;
};

/** Adds active study time without an answer (for example when quitting). */
export async function recordStudySeconds(
  db: DatabaseConnection,
  input: RecordSecondsInput,
): Promise<RecordSecondsResult> {
  const day = toLocalDayKey(input.at);
  const secondsAdded = clampActiveSeconds(input.seconds);
  if (secondsAdded === 0) {
    const existing = await getDailyStats(db, day);
    return { day, secondsAdded: 0, goalMet: existing?.goalMet ?? false };
  }

  let goalMet = false;
  await db.withTransactionAsync(async () => {
    const existing = await getDailyStats(db, day);
    goalMet = resolveGoalMet(
      existing?.goalMet ?? false,
      safeSeconds(existing?.secondsActive ?? 0) + secondsAdded,
      input.dailyGoalMinutes,
    );
    await addDailyActivity(db, day, {
      xp: 0,
      secondsActive: secondsAdded,
      questions: 0,
      correct: 0,
      goalMet,
    });
  });

  return { day, secondsAdded, goalMet };
}

/**
 * Extracts completed-session day keys from the meta table. Corrupt keys are
 * ignored so a hand-edited backup cannot poison the streak calculation.
 */
export function readCompletedSessionDays(meta: Record<string, string | null>): string[] {
  const days: string[] = [];
  for (const [key, value] of Object.entries(meta)) {
    if (!key.startsWith(SESSION_META_PREFIX) || value === '0' || value === null) continue;
    const day = key.slice(SESSION_META_PREFIX.length);
    if (isValidDayKey(day)) days.push(day);
  }
  return days.sort();
}

/** Logs and swallows a persistence failure for non-blocking UI flows. */
export function logStudyError(context: string, error: unknown): void {
  logEvent('error', `Study write failed: ${context}`, error);
}
