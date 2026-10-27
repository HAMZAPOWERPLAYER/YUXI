import type { FuriganaSegment } from '@/features/content';

/**
 * Returns display-safe segments. Authored content is validated against the
 * Japanese text, but the component still falls back to plain text if a caller
 * passes stale or incomplete segments.
 */
export function normalizeFuriganaSegments(
  text: string,
  segments: readonly FuriganaSegment[] | undefined,
): FuriganaSegment[] {
  if (!segments || segments.length === 0) {
    return [{ text }];
  }
  const joined = segments.map((segment) => segment.text).join('');
  if (joined !== text) {
    return [{ text }];
  }
  return segments.map((segment) => ({ ...segment }));
}

export function hasFurigana(segments: readonly FuriganaSegment[] | undefined): boolean {
  return Boolean(segments?.some((segment) => Boolean(segment.reading)));
}

/** Concatenates segments into the accessible plain-text label. */
export function furiganaPlainText(segments: readonly FuriganaSegment[]): string {
  return segments.map((segment) => segment.text).join('');
}
