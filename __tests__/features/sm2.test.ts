import {
  FAST_ANSWER_MS,
  INITIAL_EASE,
  LAPSE_INTERVAL_MINUTES,
  MAX_INTERVAL_DAYS,
  MIN_EASE,
  MS_PER_DAY,
  accuracyOf,
  applyReview,
  applySm2,
  applySrsReview,
  clampEase,
  clampIntervalDays,
  clampQuality,
  forecastReviews,
  initialSm2State,
  isDue,
  kanaProgressToSrsItem,
  newProgress,
  newSrsItem,
  nextIntervalDays,
  qualityFromAnswer,
  srsItemToKanaProgress,
} from '@/features/srs';
import type { KanaProgress } from '@/types/kana';

const NOW = 1_700_000_000_000;

function progress(overrides: Partial<KanaProgress> = {}): KanaProgress {
  return {
    kanaId: 'hiragana-a',
    seen: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    ease: INITIAL_EASE,
    intervalDays: 0,
    repetitions: 0,
    dueAt: NOW,
    lastSeenAt: 0,
    firstSeenAt: 0,
    lapses: 0,
    ...overrides,
  };
}

describe('qualityFromAnswer', () => {
  it.each([
    [true, 0, 5],
    [true, FAST_ANSWER_MS - 1, 5],
    [true, FAST_ANSWER_MS, 4],
    [true, 5_000, 4],
    [true, 8_000, 4],
    [true, 8_001, 3],
    [true, 60_000, 3],
    [false, 0, 1],
    [false, 12_000, 1],
    [false, 12_001, 0],
    [false, 60_000, 0],
  ])('correct=%s responseMs=%s → quality %s', (correct, responseMs, expected) => {
    expect(qualityFromAnswer({ correct, responseMs })).toBe(expected);
  });

  it('treats invalid/negative timings as slow rather than crashing', () => {
    expect(qualityFromAnswer({ correct: true, responseMs: Number.NaN })).toBe(3);
    expect(qualityFromAnswer({ correct: false, responseMs: Number.NaN })).toBe(1);
    expect(qualityFromAnswer({ correct: true, responseMs: -100 })).toBe(5);
  });
});

describe('clamps', () => {
  it('keeps ease inside 1.3–5 and rounds to 2 decimals', () => {
    expect(clampEase(0.4)).toBe(MIN_EASE);
    expect(clampEase(99)).toBe(5);
    expect(clampEase(2.3456)).toBe(2.35);
    expect(clampEase(Number.NaN)).toBe(INITIAL_EASE);
  });

  it('clamps quality to whole 0–5 values', () => {
    expect(clampQuality(-2)).toBe(0);
    expect(clampQuality(2.5)).toBe(3);
    expect(clampQuality(7)).toBe(5);
    expect(clampQuality(Number.NaN)).toBe(3);
  });

  it('clamps intervals to the 180-day maximum', () => {
    expect(clampIntervalDays(0)).toBeCloseTo(LAPSE_INTERVAL_MINUTES / (24 * 60), 6);
    expect(clampIntervalDays(-4)).toBeCloseTo(LAPSE_INTERVAL_MINUTES / (24 * 60), 6);
    expect(clampIntervalDays(500)).toBe(MAX_INTERVAL_DAYS);
    expect(clampIntervalDays(1.23456)).toBe(1.2346);
  });
});

describe('nextIntervalDays', () => {
  it.each([
    [1, 0, 2.5, 1],
    [2, 1, 2.5, 3],
    [3, 3, 2.5, 8],
    [4, 8, 2.5, 20],
    [5, 100, 2.5, 180],
  ])('reps=%s previous=%s ease=%s → %s days', (reps, previous, ease, expected) => {
    expect(nextIntervalDays(reps, previous, ease)).toBe(expected);
  });

  it('falls back to one day when the previous interval is zero', () => {
    expect(nextIntervalDays(3, 0, 2.5)).toBe(3);
  });
});

describe('applySm2', () => {
  it('schedules 1 day, 3 days, then ease-scaled intervals', () => {
    const first = applySm2(initialSm2State(NOW), 4, NOW);
    expect(first).toEqual({
      ease: 2.5,
      intervalDays: 1,
      repetitions: 1,
      dueAt: NOW + MS_PER_DAY,
    });

    const second = applySm2(first, 4, NOW + MS_PER_DAY);
    expect(second.repetitions).toBe(2);
    expect(second.intervalDays).toBe(3);
    expect(second.dueAt).toBe(NOW + MS_PER_DAY + 3 * MS_PER_DAY);

    const third = applySm2(second, 4, NOW + 4 * MS_PER_DAY);
    expect(third.repetitions).toBe(3);
    expect(third.intervalDays).toBe(8);
  });

  it('raises ease for quality 5 and lowers it for quality 3', () => {
    const five = applySm2(initialSm2State(NOW), 5, NOW);
    expect(five.ease).toBe(2.6);
    const three = applySm2(initialSm2State(NOW), 3, NOW);
    expect(three.ease).toBe(2.36);
  });

  it('treats a wrong answer as a lapse: 10-minute interval, reps reset, ease −0.2', () => {
    const before = { ease: 2.5, intervalDays: 20, repetitions: 5, dueAt: NOW };
    const after = applySm2(before, 1, NOW);
    expect(after.ease).toBe(2.3);
    expect(after.intervalDays).toBeCloseTo(LAPSE_INTERVAL_MINUTES / (24 * 60), 6);
    expect(after.repetitions).toBe(0);
    expect(after.dueAt).toBe(NOW + LAPSE_INTERVAL_MINUTES * 60_000);
  });

  it('never drops ease below 1.3 across repeated lapses', () => {
    let state = initialSm2State(NOW);
    for (let index = 0; index < 15; index += 1) {
      state = applySm2(state, 0, NOW);
    }
    expect(state.ease).toBe(MIN_EASE);
  });

  it('caps a long interval at 180 days', () => {
    const after = applySm2({ ease: 2.5, intervalDays: 100, repetitions: 8, dueAt: NOW }, 4, NOW);
    expect(after.intervalDays).toBe(MAX_INTERVAL_DAYS);
    expect(after.dueAt).toBe(NOW + MAX_INTERVAL_DAYS * MS_PER_DAY);
  });

  it('is deterministic and does not mutate the previous state', () => {
    const before = initialSm2State(NOW);
    const snapshot = { ...before };
    applySm2(before, 4, NOW);
    expect(before).toEqual(snapshot);
  });
});

describe('applyReview', () => {
  it('creates a first progress row with correct counters and timestamps', () => {
    const result = applyReview(null, 'hiragana-a', {
      correct: true,
      responseMs: 3_000,
      nowMs: NOW,
    });

    expect(result.quality).toBe(4);
    expect(result.progress).toEqual({
      kanaId: 'hiragana-a',
      seen: 1,
      correct: 1,
      wrong: 0,
      streak: 1,
      ease: 2.5,
      intervalDays: 1,
      repetitions: 1,
      dueAt: NOW + MS_PER_DAY,
      lastSeenAt: NOW,
      firstSeenAt: NOW,
      lapses: 0,
    });
  });

  it('resets the streak and increments lapses on a wrong answer', () => {
    const previous = progress({
      seen: 4,
      correct: 3,
      wrong: 1,
      streak: 3,
      repetitions: 2,
      intervalDays: 3,
      firstSeenAt: NOW - 10 * MS_PER_DAY,
    });
    const result = applyReview(previous, 'hiragana-a', {
      correct: false,
      responseMs: 2_000,
      nowMs: NOW,
    });

    expect(result.progress.seen).toBe(5);
    expect(result.progress.correct).toBe(3);
    expect(result.progress.wrong).toBe(2);
    expect(result.progress.streak).toBe(0);
    expect(result.progress.repetitions).toBe(0);
    expect(result.progress.lapses).toBe(1);
    expect(result.progress.dueAt).toBe(NOW + LAPSE_INTERVAL_MINUTES * 60_000);
    expect(result.progress.firstSeenAt).toBe(NOW - 10 * MS_PER_DAY);
  });

  it('preserves firstSeenAt and accumulates counts over many reviews', () => {
    let current: KanaProgress | null = null;

    for (let index = 0; index < 3; index += 1) {
      const result = applyReview(current, 'hiragana-a', {
        correct: true,
        responseMs: 1_000,
        nowMs: NOW + index * MS_PER_DAY,
      });
      current = result.progress;
    }

    expect(current?.seen).toBe(3);
    expect(current?.correct).toBe(3);
    expect(current?.firstSeenAt).toBe(NOW);
    expect(current?.streak).toBe(3);
  });

  it('awards quality 5 for a fast answer', () => {
    const result = applyReview(null, 'hiragana-a', {
      correct: true,
      responseMs: 900,
      nowMs: NOW,
    });
    expect(result.quality).toBe(5);
    expect(result.progress.ease).toBe(2.6);
  });
});

describe('applySrsReview', () => {
  it('schedules a vocabulary item with the same rules as kana', () => {
    const first = applySrsReview(
      null,
      { itemId: 'greet-ohayou', itemType: 'vocabulary' },
      { correct: true, responseMs: 1_000, nowMs: NOW },
    );

    expect(first.item).toEqual({
      itemId: 'greet-ohayou',
      itemType: 'vocabulary',
      seen: 1,
      correct: 1,
      wrong: 0,
      streak: 1,
      ease: 2.6,
      intervalDays: 1,
      repetitions: 1,
      dueAt: NOW + MS_PER_DAY,
      lastSeenAt: NOW,
      firstSeenAt: NOW,
      lapses: 0,
    });

    const second = applySrsReview(
      first.item,
      { itemId: 'greet-ohayou', itemType: 'vocabulary' },
      { correct: true, responseMs: 1_000, nowMs: NOW + MS_PER_DAY },
    );
    expect(second.item.repetitions).toBe(2);
    expect(second.item.intervalDays).toBe(3);
  });

  it('rejects a previous row for a different item identity', () => {
    const previous = newSrsItem('kana-a', 'kana', NOW);
    expect(() =>
      applySrsReview(
        previous,
        { itemId: 'kana-a', itemType: 'vocabulary' },
        {
          correct: true,
          responseMs: 1_000,
          nowMs: NOW,
        },
      ),
    ).toThrow(/SRS item mismatch/);
  });

  it('round-trips the legacy kana shape without losing fields', () => {
    const legacy = progress({
      seen: 6,
      correct: 5,
      wrong: 1,
      streak: 2,
      ease: 2.2,
      intervalDays: 12,
      repetitions: 4,
      dueAt: NOW + 5_000,
      lastSeenAt: NOW - 1_000,
      firstSeenAt: NOW - 9_000,
      lapses: 2,
    });
    expect(srsItemToKanaProgress(kanaProgressToSrsItem(legacy))).toEqual(legacy);
  });
});

describe('helpers', () => {
  it('builds a fresh, never-seen progress row', () => {
    expect(newProgress('katakana-a', NOW)).toEqual({
      kanaId: 'katakana-a',
      seen: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      ease: 2.5,
      intervalDays: 0,
      repetitions: 0,
      dueAt: NOW,
      lastSeenAt: 0,
      firstSeenAt: 0,
      lapses: 0,
    });
  });

  it('checks due dates inclusively', () => {
    expect(isDue(progress({ dueAt: NOW }), NOW)).toBe(true);
    expect(isDue(progress({ dueAt: NOW - 1 }), NOW)).toBe(true);
    expect(isDue(progress({ dueAt: NOW + 1 }), NOW)).toBe(false);
  });

  it('computes accuracy safely', () => {
    expect(accuracyOf({ seen: 0, correct: 0 })).toBe(0);
    expect(accuracyOf({ seen: 4, correct: 1 })).toBe(0.25);
    expect(accuracyOf({ seen: 4, correct: 9 })).toBe(1);
    expect(accuracyOf({ seen: 4, correct: -1 })).toBe(0);
  });

  it('buckets upcoming reviews by whole day with overdue in bucket 0', () => {
    const rows = [
      progress({ kanaId: 'overdue', dueAt: NOW - 5 * MS_PER_DAY }),
      progress({ kanaId: 'today', dueAt: NOW + 1_000 }),
      progress({ kanaId: 'tomorrow', dueAt: NOW + 1.5 * MS_PER_DAY }),
      progress({ kanaId: 'in-three', dueAt: NOW + 2.9 * MS_PER_DAY }),
      progress({ kanaId: 'next-week', dueAt: NOW + 8 * MS_PER_DAY }),
    ];
    expect(forecastReviews(rows, NOW, 4)).toEqual([2, 1, 1, 0]);
    expect(forecastReviews(rows, NOW, 0)).toEqual([]);
  });
});
