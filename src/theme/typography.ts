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
};

export const typography: Record<TextVariant, TypographyToken> = {
  display: { fontSize: 36, lineHeight: 44, fontWeight: '700', letterSpacing: -0.6 },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700', letterSpacing: -0.3 },
  heading: { fontSize: 22, lineHeight: 30, fontWeight: '600' },
  subtitle: { fontSize: 18, lineHeight: 26, fontWeight: '500' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
  button: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  brand: { fontSize: 20, lineHeight: 28, fontWeight: '700', letterSpacing: 0.4 },
  kana: { fontSize: 30, lineHeight: 38, fontWeight: '500' },
  kanaLarge: { fontSize: 64, lineHeight: 76, fontWeight: '500' },
  kanaHero: { fontSize: 104, lineHeight: 120, fontWeight: '500' },
};

/** Nastaliq has tall ascenders and deep descenders; 1.9x avoids clipping. */
export const URDU_LINE_HEIGHT_RATIO = 1.9;
export const URDU_TOP_PADDING_RATIO = 0.12;
