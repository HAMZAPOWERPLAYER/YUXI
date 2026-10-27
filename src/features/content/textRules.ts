/** Character and transliteration rules shared by the validator and content tests. */

export const KANA_PATTERN = /^[\u3040-\u30FF\u30FC]+$/u;
export const SENTENCE_READING_PATTERN = /^[\u3040-\u30FF\u30FC\u3001\u3002！？ ]+$/u;
export const ROMAJI_PATTERN = /^[a-zāīūēō '\-]+$/u;
export const URDU_PATTERN = /[\u0600-\u06FF]/;
export const LATIN_PATTERN = /[A-Za-z]/;
export const JAPANESE_PATTERN = /[\u3040-\u30FF\u4E00-\u9FFF]/;

/**
 * Hepburn spellings that should be rewritten. These are checked as whole words
 * so a longer word such as "tsunami" is not rejected.
 */
const NON_HEPBURN_WORDS = /\b(si|ti|tu|hu|zi|sya|syu|syo|tya|tyu|tyo|zya|zyu|zyo)\b/;

export function hasEdgeWhitespace(value: string): boolean {
  return value !== value.trim();
}

export function hasDoubleSpace(value: string): boolean {
  return /\s{2,}/.test(value);
}

export function isKanaReading(value: string): boolean {
  return KANA_PATTERN.test(value) && !value.includes('\u30FB');
}

export function isSentenceReading(value: string): boolean {
  return SENTENCE_READING_PATTERN.test(value) && !value.includes('\u30FB');
}

export function isHepburnRomaji(value: string): boolean {
  if (!ROMAJI_PATTERN.test(value)) return false;
  if (hasEdgeWhitespace(value) || hasDoubleSpace(value)) return false;
  return !NON_HEPBURN_WORDS.test(value.toLowerCase());
}

export function hasUrduText(value: string): boolean {
  return URDU_PATTERN.test(value);
}

export function hasLatinText(value: string): boolean {
  return LATIN_PATTERN.test(value);
}

export function hasJapaneseText(value: string): boolean {
  return JAPANESE_PATTERN.test(value);
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}
