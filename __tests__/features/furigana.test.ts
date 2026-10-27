import { furiganaPlainText, hasFurigana, normalizeFuriganaSegments } from '@/features/exercises';

describe('normalizeFuriganaSegments', () => {
  it('returns plain text when no segments were authored', () => {
    expect(normalizeFuriganaSegments('おはよう', undefined)).toEqual([{ text: 'おはよう' }]);
    expect(normalizeFuriganaSegments('おはよう', [])).toEqual([{ text: 'おはよう' }]);
  });

  it('keeps valid segments and copies them', () => {
    const segments = [{ text: '私', reading: 'わたし' }, { text: 'は' }];
    const result = normalizeFuriganaSegments('私は', segments);

    expect(result).toEqual(segments);
    expect(result).not.toBe(segments);
    expect(result[0]).not.toBe(segments[0]);
  });

  it('falls back to one segment when text and segments drift', () => {
    expect(normalizeFuriganaSegments('学生', [{ text: '私', reading: 'わたし' }])).toEqual([
      { text: '学生' },
    ]);
    expect(normalizeFuriganaSegments('学生', [{ text: '学', reading: 'がく' }])).toEqual([
      { text: '学生' },
    ]);
  });
});

describe('furigana helpers', () => {
  it('detects whether any segment has a reading', () => {
    expect(hasFurigana(undefined)).toBe(false);
    expect(hasFurigana([{ text: 'は' }])).toBe(false);
    expect(hasFurigana([{ text: '私', reading: 'わたし' }])).toBe(true);
  });

  it('joins segment text for accessibility', () => {
    expect(furiganaPlainText([{ text: '私', reading: 'わたし' }, { text: 'は' }])).toBe('私は');
  });
});
