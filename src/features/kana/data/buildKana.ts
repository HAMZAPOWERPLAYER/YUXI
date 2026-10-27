import type { Kana, KanaGroup, KanaScript } from '@/types/kana';

export type KanaDataSet = {
  needsHumanReview: true;
  script: KanaScript;
  group: KanaGroup;
  entries: Kana[];
};

export type KanaSeed = readonly [
  id: string,
  kana: string,
  romaji: string,
  row: string,
  urduHint: string,
  confusableWith?: readonly string[],
];

/**
 * Builds canonical kana records from compact, review-friendly tuples.
 * Confusable ids are written without the script prefix and expanded here so
 * cross-script references cannot drift.
 */
export function buildKana(
  script: KanaScript,
  group: KanaGroup,
  seeds: readonly KanaSeed[],
): Kana[] {
  return seeds.map(([id, kana, romaji, row, urduHint, confusableWith]) => ({
    id: `${script}-${id}`,
    script,
    kana,
    romaji,
    row,
    group,
    urduHint,
    confusableWith: confusableWith?.map((item) => `${script}-${item}`),
    ttsText: kana,
  }));
}
