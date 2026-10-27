/**
 * Configurable content-safety terms. The validator scans item text (Japanese,
 * romaji, Urdu and English) and reports a match as an error unless the item is
 * an explicitly tagged halal/dietary request.
 *
 * This list is intentionally conservative; it is a guard rail, not a complete
 * policy engine. Reviewers should add terms as the content grows.
 */

export const HALAL_REQUEST_TAG = 'halal-request';

export type ForbiddenTermGroup = {
  id: string;
  label: string;
  terms: readonly string[];
  /** Item tags that make this term acceptable (practical request content). */
  allowTags?: readonly string[];
};

export const FORBIDDEN_TERM_GROUPS: readonly ForbiddenTermGroup[] = [
  {
    id: 'pork',
    label: 'pork',
    terms: ['pork', '豚肉', '豚', 'ポーク', 'خنزیر', 'پورک'],
    allowTags: [HALAL_REQUEST_TAG, 'dietary-request'],
  },
  {
    id: 'alcohol',
    label: 'alcohol',
    terms: [
      'alcohol',
      'beer',
      'wine',
      'sake',
      '酒',
      'お酒',
      'アルコール',
      'ビール',
      'ワイン',
      'شراب',
      'بیئر',
    ],
    allowTags: [HALAL_REQUEST_TAG, 'dietary-request'],
  },
  {
    id: 'dating',
    label: 'dating or romance',
    terms: ['dating', 'romance', 'romantic', 'デート', '恋愛', 'ڈیٹنگ'],
  },
  {
    id: 'gambling',
    label: 'gambling',
    terms: ['gambling', 'gamble', 'casino', 'betting', 'ギャンブル', 'カジノ', 'جوا کھیلنا'],
  },
  {
    id: 'music',
    label: 'music',
    terms: ['music', 'musical', 'karaoke', '音楽', '歌', 'カラオケ', 'موسیقی'],
  },
];

export type ForbiddenHit = {
  groupId: string;
  label: string;
  term: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isLatinTerm(term: string): boolean {
  return /^[A-Za-z0-9 '-]+$/.test(term);
}

/** Returns each forbidden term found in the text, without nested duplicates. */
export function findForbiddenHits(text: string): ForbiddenHit[] {
  const hits: ForbiddenHit[] = [];
  const seen = new Set<string>();

  for (const group of FORBIDDEN_TERM_GROUPS) {
    const matched = group.terms.filter((term) => {
      if (isLatinTerm(term)) {
        return new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(text);
      }
      return text.includes(term);
    });

    // "豚肉" also contains "豚". Report only the longest matched term so a
    // single word does not produce two warnings.
    const longest = matched.filter(
      (term) => !matched.some((other) => other !== term && other.includes(term)),
    );

    for (const term of longest) {
      const key = `${group.id}:${term}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push({ groupId: group.id, label: group.label, term });
    }
  }

  return hits;
}

export function isForbiddenTermAllowed(groupId: string, tags: readonly string[]): boolean {
  const group = FORBIDDEN_TERM_GROUPS.find((entry) => entry.id === groupId);
  return group?.allowTags?.some((tag) => tags.includes(tag)) ?? false;
}
