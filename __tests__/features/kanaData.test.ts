import {
  KANA_GROUPS,
  KANA_SCRIPTS,
  allKana,
  buildKanaJsonExport,
  getAllKana,
  getByGroup,
  getById,
  getByScript,
  getConfusables,
  getKanaByRomaji,
  getKanaCount,
  getRow,
  kanaDataSets,
  needsHumanReview,
  serializeKanaJsonExport,
} from '@/features/kana';
import type { KanaScript } from '@/types/kana';

const expectedGroupCounts = { basic: 46, dakuten: 25, yoon: 33 } as const;

function idSuffix(id: string): string {
  const separator = id.indexOf('-');
  return separator === -1 ? id : id.slice(separator + 1);
}

describe('kana data integrity', () => {
  it('contains exactly 104 kana per script', () => {
    expect(getKanaCount('hiragana')).toBe(104);
    expect(getKanaCount('katakana')).toBe(104);
    expect(allKana).toHaveLength(208);
    for (const script of KANA_SCRIPTS) {
      for (const group of KANA_GROUPS) {
        expect({ script, group, count: getByGroup(script, group).length }).toEqual({
          script,
          group,
          count: expectedGroupCounts[group],
        });
      }
    }
  });

  it('has unique ids across both scripts', () => {
    const ids = allKana.map((kana) => kana.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const kana of allKana) {
      expect(kana.id).toBe(`${kana.script}-${idSuffix(kana.id)}`);
    }
  });

  it('has non-empty romaji, Urdu hints and TTS text for every entry', () => {
    for (const kana of allKana) {
      expect({ id: kana.id, field: 'kana', ok: kana.kana.trim().length > 0 }).toEqual({
        id: kana.id,
        field: 'kana',
        ok: true,
      });
      expect({ id: kana.id, field: 'romaji', ok: kana.romaji.trim().length > 0 }).toEqual({
        id: kana.id,
        field: 'romaji',
        ok: true,
      });
      expect({ id: kana.id, field: 'urduHint', ok: kana.urduHint.trim().length > 0 }).toEqual({
        id: kana.id,
        field: 'urduHint',
        ok: true,
      });
      expect({ id: kana.id, field: 'ttsText', ok: kana.ttsText.trim().length > 0 }).toEqual({
        id: kana.id,
        field: 'ttsText',
        ok: true,
      });
      expect(kana.ttsText).toBe(kana.kana);
      expect(kana.row.length).toBeGreaterThan(0);
    }
  });

  it('has unique romaji inside each script', () => {
    for (const script of KANA_SCRIPTS) {
      const values = getByScript(script).map((kana) => kana.romaji);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it('maps hiragana and katakana one-to-one by romaji and id', () => {
    const hiragana = getByScript('hiragana');
    const katakana = getByScript('katakana');
    const hiraganaRomaji = new Set(hiragana.map((kana) => kana.romaji));
    const katakanaRomaji = new Set(katakana.map((kana) => kana.romaji));
    expect([...katakanaRomaji].sort()).toEqual([...hiraganaRomaji].sort());

    const katakanaById = new Map(katakana.map((kana) => [kana.romaji, kana]));
    for (const kana of hiragana) {
      const pair = katakanaById.get(kana.romaji);
      expect(pair).toBeDefined();
      expect(idSuffix(pair?.id ?? '')).toBe(idSuffix(kana.id));
    }
  });

  it('does not include obsolete kana in the main charts', () => {
    const obsolete = ['ゐ', 'ゑ', 'ヰ', 'ヱ'];
    for (const kana of allKana) {
      expect(obsolete).not.toContain(kana.kana);
    }
  });

  it('uses small ゃ, ゅ, ょ for every yōon combination', () => {
    for (const script of KANA_SCRIPTS) {
      const small = script === 'hiragana' ? ['ゃ', 'ゅ', 'ょ'] : ['ャ', 'ュ', 'ョ'];
      for (const kana of getByGroup(script, 'yoon')) {
        expect(kana.kana).toHaveLength(2);
        expect(small).toContain(kana.kana.slice(1));
      }
    }
  });

  it('flags every data file for human review', () => {
    expect(needsHumanReview).toBe(true);
    expect(kanaDataSets).toHaveLength(6);
    for (const dataSet of kanaDataSets) {
      expect(dataSet.needsHumanReview).toBe(true);
      expect(dataSet.entries).toEqual(getByGroup(dataSet.script, dataSet.group));
    }
  });

  it('round-trips through the JSON content-review export', () => {
    const exported = buildKanaJsonExport();
    expect(exported.app).toBe('yuxi');
    expect(exported.needsHumanReview).toBe(true);
    expect(exported.count).toBe(208);
    const parsed = JSON.parse(serializeKanaJsonExport()) as {
      count: number;
      kana: typeof allKana;
    };
    expect(parsed.count).toBe(208);
    expect(parsed.kana).toHaveLength(208);
    expect(parsed.kana[0]?.id).toBe('hiragana-a');
  });

  it('references only existing confusable ids and never itself', () => {
    for (const kana of allKana) {
      for (const id of kana.confusableWith ?? []) {
        expect(getById(id)).toBeDefined();
        expect(id).not.toBe(kana.id);
      }
    }
  });

  it('keeps every curated confusable pair mutual', () => {
    const pairs: Record<KanaScript, readonly (readonly [string, string])[]> = {
      hiragana: [
        ['nu', 'me'],
        ['ne', 're'],
        ['ne', 'wa'],
        ['re', 'wa'],
        ['ha', 'ho'],
        ['ru', 'ro'],
        ['sa', 'chi'],
        ['ki', 'sa'],
        ['i', 'ri'],
        ['ko', 'ni'],
        ['a', 'o'],
      ],
      katakana: [
        ['shi', 'tsu'],
        ['so', 'n'],
        ['ku', 'ke'],
        ['u', 'fu'],
        ['u', 'wa'],
        ['fu', 'wa'],
        ['su', 'nu'],
        ['ma', 'mu'],
        ['no', 'me'],
        ['ko', 'yu'],
      ],
    };

    for (const script of KANA_SCRIPTS) {
      for (const [a, b] of pairs[script]) {
        const first = getById(`${script}-${a}`);
        const second = getById(`${script}-${b}`);
        expect(first?.confusableWith).toContain(`${script}-${b}`);
        expect(second?.confusableWith).toContain(`${script}-${a}`);
      }
    }
  });
});

describe('kana selectors', () => {
  it('returns script, group, row and romaji slices', () => {
    expect(getByScript('hiragana')).toHaveLength(104);
    expect(getByScript('katakana')).toHaveLength(104);
    expect(getAllKana()).toBe(allKana);

    const vowels = getRow('hiragana', 'vowels');
    expect(vowels.map((kana) => kana.kana)).toEqual(['あ', 'い', 'う', 'え', 'お']);

    expect(getKanaByRomaji('katakana', 'tsu')?.kana).toBe('ツ');
    expect(getKanaByRomaji('katakana', 'missing')).toBeUndefined();
    expect(getById('hiragana-a')?.kana).toBe('あ');
    expect(getById('missing')).toBeUndefined();
  });

  it('resolves confusables to kana objects and drops itself', () => {
    const nu = getById('hiragana-nu');
    expect(nu).toBeDefined();
    const confusables = getConfusables('hiragana-nu');
    expect(confusables.map((kana) => kana.kana)).toEqual(['め']);

    const group = getConfusables('katakana-wa');
    expect(group.map((kana) => kana.id).sort()).toEqual(['katakana-fu', 'katakana-u']);

    if (nu) {
      const stale = { ...nu, confusableWith: ['hiragana-missing', nu.id] };
      expect(getConfusables(stale)).toEqual([]);
    }
  });
});
