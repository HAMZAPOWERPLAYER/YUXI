import { hiraganaBasic, hiraganaBasicData } from './hiraganaBasic';
import { hiraganaDakuten, hiraganaDakutenData } from './hiraganaDakuten';
import { hiraganaYoon, hiraganaYoonData } from './hiraganaYoon';
import { katakanaBasic, katakanaBasicData } from './katakanaBasic';
import { katakanaDakuten, katakanaDakutenData } from './katakanaDakuten';
import { katakanaYoon, katakanaYoonData } from './katakanaYoon';
import type { Kana, KanaGroup, KanaScript } from '@/types/kana';

export type { KanaDataSet, KanaSeed } from './buildKana';

export {
  hiraganaBasic,
  hiraganaBasicData,
  hiraganaDakuten,
  hiraganaDakutenData,
  hiraganaYoon,
  hiraganaYoonData,
  katakanaBasic,
  katakanaBasicData,
  katakanaDakuten,
  katakanaDakutenData,
  katakanaYoon,
  katakanaYoonData,
};

export const kanaDataSets = [
  hiraganaBasicData,
  hiraganaDakutenData,
  hiraganaYoonData,
  katakanaBasicData,
  katakanaDakutenData,
  katakanaYoonData,
] as const;

/** Aggregate flag: every kana/Urdu-hint table must be reviewed by a native speaker. */
export const needsHumanReview = true as const;

export const KANA_GROUPS: readonly KanaGroup[] = ['basic', 'dakuten', 'yoon'];
export const KANA_SCRIPTS: readonly KanaScript[] = ['hiragana', 'katakana'];

export const allKana: readonly Kana[] = [
  ...hiraganaBasic,
  ...hiraganaDakuten,
  ...hiraganaYoon,
  ...katakanaBasic,
  ...katakanaDakuten,
  ...katakanaYoon,
];

export type KanaJsonExport = {
  app: 'yuxi';
  needsHumanReview: true;
  count: number;
  kana: readonly Kana[];
};

/**
 * Plain-data export for content review and round-trip tests. The app never
 * needs a bundled JSON copy, so this is generated from the single source of
 * truth instead of duplicating 208 records on disk.
 */
export function buildKanaJsonExport(): KanaJsonExport {
  return {
    app: 'yuxi',
    needsHumanReview: true,
    count: allKana.length,
    kana: allKana,
  };
}

export function serializeKanaJsonExport(): string {
  return JSON.stringify(buildKanaJsonExport(), null, 2);
}
