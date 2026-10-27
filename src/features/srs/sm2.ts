import type { KanaProgress } from '@/types/kana';
import type { LearningItemType, SrsItem } from '@/types/srs';

/**
 * SM-2 inspired scheduler shared by kana, vocabulary and sentences.
 *
 * The interval is measured in days and stored as a fraction for lapses so a
 * missed card returns after ten minutes.
 */
export const MIN_EASE = 1.3;
export const MAX_INTERVAL_DAYS = 180;
export const INITIAL_EASE = 2.5;
export const LAPSE_INTERVAL_MINUTES = 10;
export const FAST_ANSWER_MS = 2_500;
export const SLOW_ANSWER_MS = 8_000;
export const VERY_SLOW_ANSWER_MS = 12_000;

export const MS_PER_MINUTE = 60_000;
export const MS_PER_DAY = 86_400_000;

const LAPSE_INTERVAL_DAYS = LAPSE_INTERVAL_MINUTES / (24 * 60);

/** SM-2 ease adjustment by quality for a successful review. */
const EASE_DELTA: Record<number, number> = {
  3: -0.14,
  4: 0,
  5: 0.1,
};

export type Sm2State = Pick<SrsItem, 'ease' | 'intervalDays' | 'repetitions' | 'dueAt'>;

export type AnswerTiming = {
  correct: boolean;
  responseMs: number;
};

export type ReviewAnswer = AnswerTiming & {
  nowMs: number;
};

export type ReviewIdentity = {
  itemId: string;
  itemType: LearningItemType;
};

export type SrsReviewResult = {
  item: SrsItem;
  quality: number;
};

/** Legacy kana result kept for the Part 1 screens and tests. */
export type ReviewResult = {
  progress: KanaProgress;
  quality: number;
};

/**
 * Maps an answer to the SM-2 quality scale:
 * - wrong and very slow → 0, other wrong answers → 1
 * - correct and fast → 5, normal → 4, slow → 3
 */
export function qualityFromAnswer({ correct, responseMs }: AnswerTiming): number {
  const safeMs = Number.isFinite(responseMs) ? Math.max(0, responseMs) : SLOW_ANSWER_MS + 1;
  if (!correct) {
    return safeMs > VERY_SLOW_ANSWER_MS ? 0 : 1;
  }
  if (safeMs < FAST_ANSWER_MS) return 5;
  if (safeMs > SLOW_ANSWER_MS) return 3;
  return 4;
}

export function clampEase(ease: number): number {
  if (!Number.isFinite(ease)) return INITIAL_EASE;
  const clamped = Math.max(MIN_EASE, Math.min(5, ease));
  return Math.round(clamped * 100) / 100;
}

export function clampQuality(quality: number): number {
  if (!Number.isFinite(quality)) return 3;
  return Math.max(0, Math.min(5, Math.round(quality)));
}

/** Caps an interval so a single review cannot schedule years ahead. */
export function clampIntervalDays(intervalDays: number): number {
  if (!Number.isFinite(intervalDays) || intervalDays <= 0) return LAPSE_INTERVAL_DAYS;
  return Math.min(MAX_INTERVAL_DAYS, Math.round(intervalDays * 10_000) / 10_000);
}

export function initialSm2State(nowMs: number): Sm2State {
  return {
    ease: INITIAL_EASE,
    intervalDays: 0,
    repetitions: 0,
    dueAt: nowMs,
  };
}

/** Interval for the next successful review: 1 day, 3 days, then ease-scaled. */
export function nextIntervalDays(
  repetitions: number,
  previousIntervalDays: number,
  ease: number,
): number {
  if (repetitions <= 1) return 1;
  if (repetitions === 2) return 3;
  const previous = previousIntervalDays > 0 ? previousIntervalDays : 1;
  return clampIntervalDays(Math.max(1, Math.round(previous * ease)));
}

/**
 * Applies one review to an SM-2 state. Wrong answers reset repetitions, lower
 * ease by 0.2 (floor 1.3) and schedule a 10-minute lapse.
 */
export function applySm2(state: Sm2State, quality: number, nowMs: number): Sm2State {
  const q = clampQuality(quality);
  const safeNow = Number.isFinite(nowMs) ? nowMs : 0;
  const previousEase = clampEase(state.ease);

  if (q < 3) {
    return {
      ease: Math.max(MIN_EASE, Math.round((previousEase - 0.2) * 100) / 100),
      intervalDays: LAPSE_INTERVAL_DAYS,
      repetitions: 0,
      dueAt: safeNow + LAPSE_INTERVAL_MINUTES * MS_PER_MINUTE,
    };
  }

  const repetitions = Math.max(0, Math.trunc(state.repetitions)) + 1;
  const ease = clampEase(previousEase + (EASE_DELTA[q] ?? 0));
  const intervalDays = nextIntervalDays(repetitions, state.intervalDays, ease);

  return {
    ease,
    intervalDays,
    repetitions,
    dueAt: safeNow + Math.round(intervalDays * MS_PER_DAY),
  };
}

/**
 * Full progress update for any learning item. `previous` is null the first
 * time an item is reviewed. Counters are denormalized so charts and
 * weak-item selection stay a single read.
 */
export function applySrsReview(
  previous: SrsItem | null,
  identity: ReviewIdentity,
  answer: ReviewAnswer,
): SrsReviewResult {
  if (
    previous &&
    (previous.itemId !== identity.itemId || previous.itemType !== identity.itemType)
  ) {
    throw new Error(
      `SRS item mismatch: expected ${identity.itemType}:${identity.itemId}, received ${previous.itemType}:${previous.itemId}`,
    );
  }

  const quality = qualityFromAnswer(answer);
  const base = previous ?? newSrsItem(identity.itemId, identity.itemType, answer.nowMs);
  const scheduled = applySm2(
    {
      ease: base.ease,
      intervalDays: base.intervalDays,
      repetitions: base.repetitions,
      dueAt: base.dueAt,
    },
    quality,
    answer.nowMs,
  );

  return {
    quality,
    item: {
      itemId: base.itemId,
      itemType: base.itemType,
      seen: base.seen + 1,
      correct: base.correct + (answer.correct ? 1 : 0),
      wrong: base.wrong + (answer.correct ? 0 : 1),
      streak: answer.correct ? base.streak + 1 : 0,
      ease: scheduled.ease,
      intervalDays: scheduled.intervalDays,
      repetitions: scheduled.repetitions,
      dueAt: scheduled.dueAt,
      lastSeenAt: answer.nowMs,
      firstSeenAt: base.firstSeenAt > 0 ? base.firstSeenAt : answer.nowMs,
      lapses: base.lapses + (quality < 3 ? 1 : 0),
    },
  };
}

/** A fresh, never-reviewed item (not normally persisted until seen). */
export function newSrsItem(itemId: string, itemType: LearningItemType, nowMs: number): SrsItem {
  return {
    itemId,
    itemType,
    seen: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    ...initialSm2State(nowMs),
    lastSeenAt: 0,
    firstSeenAt: 0,
    lapses: 0,
  };
}

/**
 * Kana compatibility wrapper. The kana screens keep their legacy shape while
 * the scheduler and database store one generalized item.
 */
export function applyReview(
  previous: KanaProgress | null,
  kanaId: string,
  answer: ReviewAnswer,
): ReviewResult {
  const result = applySrsReview(
    previous ? kanaProgressToSrsItem(previous) : null,
    { itemId: kanaId, itemType: 'kana' },
    answer,
  );
  return { progress: srsItemToKanaProgress(result.item), quality: result.quality };
}

export function newProgress(kanaId: string, nowMs: number): KanaProgress {
  return srsItemToKanaProgress(newSrsItem(kanaId, 'kana', nowMs));
}

export function kanaProgressToSrsItem(progress: KanaProgress): SrsItem {
  return {
    itemId: progress.kanaId,
    itemType: 'kana',
    seen: progress.seen,
    correct: progress.correct,
    wrong: progress.wrong,
    streak: progress.streak,
    ease: progress.ease,
    intervalDays: progress.intervalDays,
    repetitions: progress.repetitions,
    dueAt: progress.dueAt,
    lastSeenAt: progress.lastSeenAt,
    firstSeenAt: progress.firstSeenAt,
    lapses: progress.lapses,
  };
}

export function srsItemToKanaProgress(item: SrsItem): KanaProgress {
  return {
    kanaId: item.itemId,
    seen: item.seen,
    correct: item.correct,
    wrong: item.wrong,
    streak: item.streak,
    ease: item.ease,
    intervalDays: item.intervalDays,
    repetitions: item.repetitions,
    dueAt: item.dueAt,
    lastSeenAt: item.lastSeenAt,
    firstSeenAt: item.firstSeenAt,
    lapses: item.lapses,
  };
}

export function isDue(progress: Pick<SrsItem, 'dueAt'>, nowMs: number): boolean {
  return progress.dueAt <= nowMs;
}

/** Accuracy in the 0–1 range; unseen cards count as zero. */
export function accuracyOf(progress: Pick<SrsItem, 'correct' | 'seen'>): number {
  if (progress.seen <= 0) return 0;
  return Math.min(1, Math.max(0, progress.correct / progress.seen));
}

/**
 * Counts reviews scheduled in the next `days` days, used by the stats forecast.
 * Index 0 is today (including overdue cards).
 */
export function forecastReviews(
  progressList: readonly Pick<SrsItem, 'dueAt'>[],
  nowMs: number,
  days: number,
): number[] {
  const safeDays = Math.max(0, Math.trunc(days));
  const buckets = Array.from({ length: safeDays }, () => 0);
  if (safeDays === 0) return buckets;

  for (const progress of progressList) {
    const offset = Math.floor((progress.dueAt - nowMs) / MS_PER_DAY);
    const index = Math.max(0, offset);
    if (index < safeDays) {
      buckets[index] = (buckets[index] ?? 0) + 1;
    }
  }
  return buckets;
}
