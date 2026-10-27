import type { Kana, KanaGroup, KanaScript } from '@/types/kana';

import { allKana } from './data';

const byId = new Map<string, Kana>(allKana.map((kana) => [kana.id, kana]));

const byScript: Record<KanaScript, Kana[]> = {
  hiragana: allKana.filter((kana) => kana.script === 'hiragana'),
  katakana: allKana.filter((kana) => kana.script === 'katakana'),
};

const byScriptGroup: Record<KanaScript, Record<KanaGroup, Kana[]>> = {
  hiragana: {
    basic: byScript.hiragana.filter((kana) => kana.group === 'basic'),
    dakuten: byScript.hiragana.filter((kana) => kana.group === 'dakuten'),
    yoon: byScript.hiragana.filter((kana) => kana.group === 'yoon'),
  },
  katakana: {
    basic: byScript.katakana.filter((kana) => kana.group === 'basic'),
    dakuten: byScript.katakana.filter((kana) => kana.group === 'dakuten'),
    yoon: byScript.katakana.filter((kana) => kana.group === 'yoon'),
  },
};

export function getByScript(script: KanaScript): readonly Kana[] {
  return byScript[script];
}

export function getByGroup(script: KanaScript, group: KanaGroup): readonly Kana[] {
  return byScriptGroup[script][group];
}

export function getById(id: string): Kana | undefined {
  return byId.get(id);
}

export function getKanaByRomaji(script: KanaScript, romaji: string): Kana | undefined {
  return byScript[script].find((kana) => kana.romaji === romaji);
}

export function getRow(script: KanaScript, row: string): readonly Kana[] {
  return byScript[script].filter((kana) => kana.row === row);
}

/**
 * Returns the curated look-alike kana for a character. Always excludes the
 * character itself and silently drops unknown ids so stale data cannot crash a
 * quiz.
 */
export function getConfusables(kanaOrId: Kana | string): readonly Kana[] {
  const kana = typeof kanaOrId === 'string' ? getById(kanaOrId) : kanaOrId;
  if (!kana?.confusableWith?.length) return [];
  const seen = new Set<string>();
  const result: Kana[] = [];
  for (const id of kana.confusableWith) {
    if (id === kana.id || seen.has(id)) continue;
    const candidate = byId.get(id);
    if (candidate) {
      seen.add(id);
      result.push(candidate);
    }
  }
  return result;
}

export function getAllKana(): readonly Kana[] {
  return allKana;
}

export function getKanaCount(script: KanaScript): number {
  return byScript[script].length;
}
