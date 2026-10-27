import { accuracyOf } from '@/features/srs/sm2';
import type { MasteryLevel } from '@/theme/tokens';
import type { Kana, KanaProgress } from '@/types/kana';

export type MasteryInput = Pick<KanaProgress, 'seen' | 'correct' | 'repetitions' | 'ease'>;

export const MASTERY_LEVELS: readonly MasteryLevel[] = [
  'unseen',
  'learning',
  'familiar',
  'mastered',
];

/**
 * Derives a chart colour tier from SRS state:
 * - unseen: never answered
 * - learning: seen but not yet stable
 * - familiar: at least two successful repetitions and 70% accuracy
 * - mastered: four repetitions, strong ease and 85% accuracy
 */
export function masteryFor(progress: MasteryInput | null | undefined): MasteryLevel {
  if (!progress || progress.seen <= 0) return 'unseen';
  const accuracy = accuracyOf(progress);
  if (progress.repetitions >= 4 && progress.ease >= 2.3 && accuracy >= 0.85) {
    return 'mastered';
  }
  if (progress.repetitions >= 2 && accuracy >= 0.7) return 'familiar';
  return 'learning';
}

export type MasteryBreakdown = {
  total: number;
  counts: Record<MasteryLevel, number>;
  /** Seen at least once, i.e. total − unseen. */
  studied: number;
  /** Familiar or mastered. */
  strong: number;
  /** 0–1 share of the pool that has been studied. */
  studiedRatio: number;
  /** 0–1 share of the pool that is familiar or mastered. */
  strongRatio: number;
};

export function emptyMasteryBreakdown(): MasteryBreakdown {
  return {
    total: 0,
    counts: { unseen: 0, learning: 0, familiar: 0, mastered: 0 },
    studied: 0,
    strong: 0,
    studiedRatio: 0,
    strongRatio: 0,
  };
}

/** Aggregates levels into counts and ratios so every chart uses one formula. */
export function summarizeMastery(levels: readonly MasteryLevel[]): MasteryBreakdown {
  const breakdown = emptyMasteryBreakdown();
  breakdown.total = levels.length;
  for (const level of levels) {
    breakdown.counts[level] += 1;
  }
  breakdown.studied = breakdown.total - breakdown.counts.unseen;
  breakdown.strong = breakdown.counts.familiar + breakdown.counts.mastered;
  breakdown.studiedRatio = breakdown.total === 0 ? 0 : breakdown.studied / breakdown.total;
  breakdown.strongRatio = breakdown.total === 0 ? 0 : breakdown.strong / breakdown.total;
  return breakdown;
}

export function buildMasteryBreakdown(
  pool: readonly Kana[],
  progressList: readonly KanaProgress[],
): MasteryBreakdown {
  const progressById = new Map(progressList.map((progress) => [progress.kanaId, progress]));
  return summarizeMastery(pool.map((kana) => masteryFor(progressById.get(kana.id))));
}

export type RowMastery = {
  row: string;
  breakdown: MasteryBreakdown;
  kana: readonly Kana[];
};

/** Groups a script (or any slice) by row for the chart grids. */
export function buildRowMastery(
  pool: readonly Kana[],
  progressList: readonly KanaProgress[],
): RowMastery[] {
  const rows: string[] = [];
  const byRow = new Map<string, Kana[]>();
  for (const kana of pool) {
    if (!byRow.has(kana.row)) {
      byRow.set(kana.row, []);
      rows.push(kana.row);
    }
    byRow.get(kana.row)?.push(kana);
  }

  const progressById = new Map(progressList.map((progress) => [progress.kanaId, progress]));
  return rows.map((row) => {
    const kana = byRow.get(row) ?? [];
    return {
      row,
      kana,
      breakdown: summarizeMastery(kana.map((item) => masteryFor(progressById.get(item.id)))),
    };
  });
}
