import {
  FORBIDDEN_TERM_GROUPS,
  HALAL_REQUEST_TAG,
  findForbiddenHits,
  isForbiddenTermAllowed,
} from '@/features/content/forbiddenTerms';

describe('forbidden term rules', () => {
  it('matches latin terms as whole words and Japanese/Urdu terms as substrings', () => {
    const hits = findForbiddenHits('Pork and beer, お酒, شراب');
    expect(hits.map((hit) => hit.groupId)).toEqual(expect.arrayContaining(['pork', 'alcohol']));
    expect(findForbiddenHits('porkchop')).toEqual([]);
    expect(findForbiddenHits('music')).toEqual([
      expect.objectContaining({ groupId: 'music', term: 'music' }),
    ]);
  });

  it('does not report the same term twice', () => {
    const hits = findForbiddenHits('pork pork 豚肉 豚肉');
    expect(hits).toHaveLength(2);
    expect(hits.map((hit) => hit.term)).toEqual(['pork', '豚肉']);
  });

  it('allows only pork and alcohol groups for tagged requests', () => {
    expect(isForbiddenTermAllowed('pork', [HALAL_REQUEST_TAG])).toBe(true);
    expect(isForbiddenTermAllowed('alcohol', ['dietary-request'])).toBe(true);
    expect(isForbiddenTermAllowed('music', [HALAL_REQUEST_TAG])).toBe(false);
    expect(isForbiddenTermAllowed('unknown-group', [HALAL_REQUEST_TAG])).toBe(false);
    expect(isForbiddenTermAllowed('pork', [])).toBe(false);
  });

  it('keeps every forbidden group labelled and non-empty', () => {
    for (const group of FORBIDDEN_TERM_GROUPS) {
      expect(group.label.length).toBeGreaterThan(0);
      expect(group.terms.length).toBeGreaterThan(0);
      expect(new Set(group.terms).size).toBe(group.terms.length);
    }
  });
});
