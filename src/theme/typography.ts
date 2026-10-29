import type { TextStyle } from 'react-native';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subtitle'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'button'
  | 'brand'
  | 'kana'
  | 'kanaLarge'
  | 'kanaHero';

export type TypographyToken = {
  fontSize: number;
  lineHeight: number;
  fontWeight: NonNullable<TextStyle['fontWeight']>;
  letterSpacing?: number;
  /**
   * Caps the combined in-app + OS scale for this variant. Body text is allowed
   * to reach the full accessibility scale; display and kana sizes are capped so
   * they cannot push controls off-screen at 200% OS text size.
   */
  maxScale?: number;
};

export const typography: Record<TextVariant, TypographyToken> = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '800', letterSpacing: -0.5, maxScale: 2 },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '800', letterSpacing: -0.2, maxScale: 2.1 },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: '600', maxScale: 2.4 },
  subtitle: { fontSize: 18, lineHeight: 26, fontWeight: '600', maxScale: 2.4 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400', maxScale: 3.2 },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600', maxScale: 3.2 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600', maxScale: 2.6 },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500', maxScale: 2.8 },
  button: { fontSize: 16, lineHeight: 22, fontWeight: '600', maxScale: 2.4 },
  brand: { fontSize: 20, lineHeight: 28, fontWeight: '800', letterSpacing: 0.4, maxScale: 2 },
  kana: { fontSize: 28, lineHeight: 36, fontWeight: '500', maxScale: 1.8 },
  kanaLarge: { fontSize: 56, lineHeight: 68, fontWeight: '500', maxScale: 1.6 },
  kanaHero: { fontSize: 96, lineHeight: 112, fontWeight: '500', maxScale: 1.4 },
};

/** Nastaliq has tall ascenders and deep descenders; 1.9x avoids clipping. */
export const URDU_LINE_HEIGHT_RATIO = 1.9;
export const URDU_TOP_PADDING_RATIO = 0.12;

export type ResolvedTextMetrics = {
  fontSize: number;
  lineHeight: number;
  paddingTop: number;
};

/**
 * Applies the in-app text scale and the OS font scale exactly once. AppText
 * disables React Native's automatic font scaling and uses these values, which
 * keeps line height and font size in the same coordinate space.
 */
export function resolveTextMetrics(
  token: TypographyToken,
  options: {
    textScale: number;
    fontScale: number;
    language: 'en' | 'ur' | 'ja';
    urduFontsLoaded: boolean;
  },
): ResolvedTextMetrics {
  const requestedScale = options.textScale * options.fontScale;
  const scale = Math.min(requestedScale, token.maxScale ?? requestedScale);
  const fontSize = token.fontSize * scale;
  let lineHeight = token.lineHeight * scale;
  let paddingTop = 0;

  if (options.language === 'ur') {
    const ratio = options.urduFontsLoaded ? URDU_LINE_HEIGHT_RATIO : 1.7;
    lineHeight = Math.max(lineHeight, fontSize * ratio);
    if (options.urduFontsLoaded) {
      paddingTop = Math.round(fontSize * URDU_TOP_PADDING_RATIO);
    }
  }

  return { fontSize, lineHeight, paddingTop };
}
