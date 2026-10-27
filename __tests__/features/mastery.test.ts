import {
  MASTERY_LEVELS,
  buildMasteryBreakdown,
  buildRowMastery,
  emptyMasteryBreakdown,
  getById,
  getByScript,
  masteryFor,
  summarizeMastery,
} from '@/features/kana';
import type { KanaProgress } from '@/types/kana';

function progress(overrides: Partial<KanaProgress> = {}): KanaProgress {
  return {
    kanaId: 'hiragana-a',
    seen: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    ease: 2.5,
    intervalDays: 0,
    repetitions: 0,
    dueAt: 0,
    lastSeenAt: 0,
    firstSeenAt: 0,
    lapses: 0,
    ...overrides,
  };
}

describe('masteryFor', () => {
  it('marks missing or unseen progress as unseen', () => {
    expect(masteryFor(null)).toBe('unseen');
    expect(masteryFor(undefined)).toBe('unseen');
    expect(masteryFor(progress({ seen: 0 }))).toBe('unseen');
  });

  it('marks low-accuracy or unstable cards as learning', () => {
    expect(masteryFor(progress({ seen: 1, correct: 1, repetitions: 1 }))).toBe('learning');
    expect(masteryFor(progress({ seen: 5, correct: 2, repetitions: 4, ease: 2.5 }))).toBe(
      'learning',
    );
  });

  it('marks two-repetition cards with 70% accuracy as familiar', () => {
    expect(masteryFor(progress({ seen: 4, correct: 3, repetitions: 2, ease: 2.3 }))).toBe(
      'familiar',
    );
  });

  it('requires four repetitions, ease and accuracy for mastered', () => {
    const strong = progress({ seen: 10, correct: 9, repetitions: 4, ease: 2.5 });
    expect(masteryFor(strong)).toBe('mastered');
    expect(masteryFor({ ...strong, ease: 2.2 })).toBe('familiar');
    expect(masteryFor({ ...strong, correct: 5 })).toBe('learning');
  });

  it('exposes the four levels in chart order', () => {
    expect(MASTERY_LEVELS).toEqual(['unseen', 'learning', 'familiar', 'mastered']);
  });
});

describe('mastery summaries', () => {
  it('starts with an empty breakdown', () => {
    expect(emptyMasteryBreakdown()).toEqual({
      total: 0,
      counts: { unseen: 0, learning: 0, familiar: 0, mastered: 0 },
      studied: 0,
      strong: 0,
      studiedRatio: 0,
      strongRatio: 0,
    });
  });

  it('counts levels and computes ratios', () => {
    const summary = summarizeMastery(['unseen', 'learning', 'familiar', 'mastered']);
    expect(summary).toEqual({
      total: 4,
      counts: { unseen: 1, learning: 1, familiar: 1, mastered: 1 },
      studied: 3,
      strong: 2,
      studiedRatio: 0.75,
      strongRatio: 0.5,
    });
    expect(summarizeMastery([])).toEqual(emptyMasteryBreakdown());
  });

  it('aggregates progress for a subset of the pool', () => {
    const pool = getByScript('hiragana').slice(0, 4);
    const breakdown = buildMasteryBreakdown(pool, [
      progress({ kanaId: pool[0]?.id ?? '', seen: 2, correct: 2, repetitions: 2 }),
      progress({ kanaId: 'katakana-a', seen: 9, correct: 9, repetitions: 6, ease: 2.6 }),
    ]);
    expect(breakdown.total).toBe(4);
    expect(breakdown.counts).toEqual({ unseen: 3, learning: 0, familiar: 1, mastered: 0 });
    expect(breakdown.studied).toBe(1);
  });

  it('groups rows in first-seen order with per-row counts', () => {
    const pool = getByScript('hiragana');
    const rows = buildRowMastery(pool, [
      progress({ kanaId: 'hiragana-a', seen: 5, correct: 5, repetitions: 4, ease: 2.5 }),
    ]);

    expect(rows[0]?.row).toBe('vowels');
    expect(rows[0]?.kana.map((kana) => kana.kana)).toEqual(['あ', 'い', 'う', 'え', 'お']);
    expect(rows[0]?.breakdown.counts.mastered).toBe(1);
    expect(rows[0]?.breakdown.counts.unseen).toBe(4);
    expect(rows).toHaveLength(27);

    const total = rows.reduce((sum, row) => sum + row.breakdown.total, 0);
    expect(total).toBe(104);
  });

  it('resolves known kana and ignores unknown ids', () => {
    expect(getById('hiragana-a')?.romaji).toBe('a');
    expect(getById('missing')).toBeUndefined();
  });
});
