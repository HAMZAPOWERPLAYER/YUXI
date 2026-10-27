import {
  hasDoubleSpace,
  hasEdgeWhitespace,
  hasJapaneseText,
  hasLatinText,
  hasUrduText,
  isHepburnRomaji,
  isKanaReading,
  isNonEmpty,
  isSentenceReading,
} from '@/features/content/textRules';

describe('content text rules', () => {
  it('accepts kana-only readings and rejects punctuation, kanji and middle dots', () => {
    expect(isKanaReading('わたし')).toBe(true);
    expect(isKanaReading('パキスタン')).toBe(true);
    expect(isKanaReading('わたし。')).toBe(false);
    expect(isKanaReading('私')).toBe(false);
    expect(isKanaReading('わたし・です')).toBe(false);
  });

  it('accepts sentence readings with Japanese punctuation and spaces only', () => {
    expect(isSentenceReading('わたしはがくせいです。')).toBe(true);
    expect(isSentenceReading('はい、そうです！？')).toBe(true);
    expect(isSentenceReading('わたしは がくせいです')).toBe(true);
    expect(isSentenceReading('私は学生です。')).toBe(false);
    expect(isSentenceReading('わたし・です')).toBe(false);
  });

  it('accepts Hepburn romaji and rejects common non-Hepburn spellings', () => {
    expect(isHepburnRomaji('ohayou gozaimasu')).toBe(true);
    expect(isHepburnRomaji('shinbun')).toBe(true);
    expect(isHepburnRomaji('kyou wa ame datta')).toBe(true);
    expect(isHepburnRomaji('tōkyō')).toBe(true);
    expect(isHepburnRomaji('si')).toBe(false);
    expect(isHepburnRomaji('ti')).toBe(false);
    expect(isHepburnRomaji('tu')).toBe(false);
    expect(isHepburnRomaji('hu')).toBe(false);
    expect(isHepburnRomaji('sya')).toBe(false);
    expect(isHepburnRomaji('Watashi')).toBe(false);
    expect(isHepburnRomaji('watashi!')).toBe(false);
    expect(isHepburnRomaji('')).toBe(false);
  });

  it('detects padding and repeated spaces', () => {
    expect(hasEdgeWhitespace(' hello')).toBe(true);
    expect(hasEdgeWhitespace('hello ')).toBe(true);
    expect(hasEdgeWhitespace('hello')).toBe(false);
    expect(hasDoubleSpace('hello  world')).toBe(true);
    expect(hasDoubleSpace('hello world')).toBe(false);
  });

  it('detects script presence and non-empty text', () => {
    expect(hasUrduText('صبح بخیر')).toBe(true);
    expect(hasUrduText('good morning')).toBe(false);
    expect(hasLatinText('Good morning')).toBe(true);
    expect(hasLatinText('صبح بخیر')).toBe(false);
    expect(hasJapaneseText('おはよう')).toBe(true);
    expect(hasJapaneseText('学生')).toBe(true);
    expect(hasJapaneseText('hello')).toBe(false);
    expect(isNonEmpty('x')).toBe(true);
    expect(isNonEmpty('   ')).toBe(false);
  });
});
