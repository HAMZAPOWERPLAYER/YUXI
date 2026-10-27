import { findForbiddenHits, HALAL_REQUEST_TAG, isForbiddenTermAllowed } from './forbiddenTerms';
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
} from './textRules';
import type {
  FuriganaSegment,
  SentenceItem,
  SentenceToken,
  ValidationIssue,
  VocabItem,
} from './types';

function error(code: string, path: string, message: string): ValidationIssue {
  return { severity: 'error', code, path, message };
}

function warning(code: string, path: string, message: string): ValidationIssue {
  return { severity: 'warning', code, path, message };
}

function checkTrimmed(value: string, path: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (hasEdgeWhitespace(value)) {
    issues.push(error('edge-whitespace', path, 'Remove leading or trailing whitespace'));
  }
  if (hasDoubleSpace(value)) {
    issues.push(error('double-space', path, 'Use single spaces'));
  }
  return issues;
}

function checkSegments(
  segments: readonly FuriganaSegment[] | undefined,
  ja: string,
  path: string,
): ValidationIssue[] {
  if (!segments) return [];

  const issues: ValidationIssue[] = [];
  if (segments.map((segment) => segment.text).join('') !== ja) {
    issues.push(
      error('segment-mismatch', path, 'Furigana segments must concatenate to the Japanese text'),
    );
  }

  segments.forEach((segment, index) => {
    if (!isNonEmpty(segment.text)) {
      issues.push(error('empty-segment', `${path}/${index}/text`, 'Segment text is empty'));
    }
    if (segment.reading !== undefined && !isKanaReading(segment.reading)) {
      issues.push(
        error(
          'invalid-segment-reading',
          `${path}/${index}/reading`,
          'Segment reading must be kana',
        ),
      );
    }
  });

  return issues;
}

function checkTokens(
  tokens: readonly SentenceToken[],
  ja: string,
  path: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (tokens.map((token) => token.surface).join('') !== ja) {
    issues.push(error('token-mismatch', path, 'Tokens must concatenate exactly to the sentence'));
  }

  tokens.forEach((token, index) => {
    if (!isNonEmpty(token.surface)) {
      issues.push(error('empty-token', `${path}/${index}/surface`, 'Token surface is empty'));
    }
    if (token.reading !== undefined && !isKanaReading(token.reading)) {
      issues.push(
        error('invalid-token-reading', `${path}/${index}/reading`, 'Token reading must be kana'),
      );
    }
  });

  return issues;
}

function checkCommonText(
  values: readonly (readonly [string, string])[],
  tags: readonly string[],
  path: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const [field, value] of values) {
    issues.push(...checkTrimmed(value, `${path}/${field}`));

    for (const hit of findForbiddenHits(value)) {
      if (isForbiddenTermAllowed(hit.groupId, tags)) {
        issues.push(
          warning(
            'forbidden-term-allowed',
            `${path}/${field}`,
            `"${hit.term}" is allowed because the item is a halal/dietary request`,
          ),
        );
      } else {
        issues.push(
          error(
            'forbidden-term',
            `${path}/${field}`,
            `Forbidden ${hit.label} term "${hit.term}" in content`,
          ),
        );
      }
    }
  }

  return issues;
}

function checkRomaji(value: string, path: string): ValidationIssue[] {
  return isHepburnRomaji(value)
    ? []
    : [error('invalid-romaji', path, 'Use lowercase Hepburn romaji (shi, chi, tsu, fu, ji)')];
}

function checkMeanings(
  urdu: string,
  english: string,
  path: string,
  urduField: 'meaningUr' | 'translationUr',
  englishField: 'meaningEn' | 'translationEn',
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isNonEmpty(urdu) || !hasUrduText(urdu)) {
    issues.push(
      error('missing-urdu-meaning', `${path}/${urduField}`, 'Add a natural Urdu meaning'),
    );
  }
  if (!isNonEmpty(english) || !hasLatinText(english)) {
    issues.push(
      error('missing-english-meaning', `${path}/${englishField}`, 'Add an English meaning'),
    );
  }
  return issues;
}

function checkVocabText(item: VocabItem, path: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isNonEmpty(item.ja) || !hasJapaneseText(item.ja)) {
    issues.push(error('missing-japanese', `${path}/ja`, 'Add Japanese text'));
  }
  if (!isKanaReading(item.reading)) {
    issues.push(error('invalid-reading', `${path}/reading`, 'Reading must contain kana only'));
  }
  issues.push(...checkRomaji(item.romaji, `${path}/romaji`));
  issues.push(...checkMeanings(item.meaningUr, item.meaningEn, path, 'meaningUr', 'meaningEn'));
  if (!isNonEmpty(item.audioText)) {
    issues.push(error('missing-audio-text', `${path}/audioText`, 'Add text for text-to-speech'));
  }
  if (item.kanji && !item.segments) {
    issues.push(
      warning(
        'missing-furigana-segments',
        `${path}/segments`,
        'Add furigana segments when the item contains kanji',
      ),
    );
  }
  issues.push(...checkSegments(item.segments, item.ja, `${path}/segments`));
  issues.push(
    ...checkCommonText(
      [
        ['ja', item.ja],
        ['reading', item.reading],
        ['romaji', item.romaji],
        ['meaningUr', item.meaningUr],
        ['meaningEn', item.meaningEn],
        ['audioText', item.audioText],
        ...(item.segments ?? []).flatMap((segment, index) => [
          [`segments/${index}/text`, segment.text] as const,
          ...(segment.reading ? ([[`segments/${index}/reading`, segment.reading]] as const) : []),
        ]),
      ],
      item.tags,
      path,
    ),
  );
  return issues;
}

function checkSentenceText(item: SentenceItem, path: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isNonEmpty(item.ja) || !hasJapaneseText(item.ja)) {
    issues.push(error('missing-japanese', `${path}/ja`, 'Add Japanese text'));
  }
  if (!isSentenceReading(item.reading)) {
    issues.push(error('invalid-reading', `${path}/reading`, 'Reading must contain kana only'));
  }
  issues.push(...checkRomaji(item.romaji, `${path}/romaji`));
  issues.push(
    ...checkMeanings(
      item.translationUr,
      item.translationEn,
      path,
      'translationUr',
      'translationEn',
    ),
  );
  issues.push(...checkTokens(item.tokens, item.ja, `${path}/tokens`));
  issues.push(...checkSegments(item.segments, item.ja, `${path}/segments`));
  issues.push(
    ...checkCommonText(
      [
        ['ja', item.ja],
        ['reading', item.reading],
        ['romaji', item.romaji],
        ['translationUr', item.translationUr],
        ['translationEn', item.translationEn],
        ...item.tokens.flatMap((token, index) => [
          [`tokens/${index}/surface`, token.surface] as const,
          ...(token.gloss ? ([[`tokens/${index}/gloss`, token.gloss]] as const) : []),
        ]),
        ...(item.segments ?? []).flatMap((segment, index) => [
          [`segments/${index}/text`, segment.text] as const,
          ...(segment.reading ? ([[`segments/${index}/reading`, segment.reading]] as const) : []),
        ]),
      ],
      item.tags,
      path,
    ),
  );
  return issues;
}

/** Field-level checks for one vocabulary item. Reference checks live in validation.ts. */
export function validateVocabItem(item: VocabItem, path: string): ValidationIssue[] {
  return checkVocabText(item, path);
}

/** Field-level checks for one sentence item. Reference checks live in validation.ts. */
export function validateSentenceItem(item: SentenceItem, path: string): ValidationIssue[] {
  return checkSentenceText(item, path);
}

export const CONTENT_REVIEW_HINT = `Tag practical halal or dietary requests with "${HALAL_REQUEST_TAG}".`;
