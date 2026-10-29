import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { NotoNastaliqUrdu_400Regular } from '@expo-google-fonts/noto-nastaliq-urdu/400Regular';
import { NotoNastaliqUrdu_700Bold } from '@expo-google-fonts/noto-nastaliq-urdu/700Bold';
import type { TextStyle } from 'react-native';
import { NotoSansJP_400Regular } from '@expo-google-fonts/noto-sans-jp/400Regular';
import { NotoSansJP_500Medium } from '@expo-google-fonts/noto-sans-jp/500Medium';
import { NotoSansJP_700Bold } from '@expo-google-fonts/noto-sans-jp/700Bold';
import { useFonts } from 'expo-font';

import type { TextVariant } from './typography';

/**
 * Fonts are bundled locally. No remote font requests are made.
 * Registering explicit family names lets AppText choose the right face
 * without relying on platform font-weight matching.
 */
export const appFontMap = {
  'Nunito-SemiBold': Nunito_600SemiBold,
  'Nunito-ExtraBold': Nunito_800ExtraBold,
  'NotoSansJP-Regular': NotoSansJP_400Regular,
  'NotoSansJP-Medium': NotoSansJP_500Medium,
  'NotoSansJP-Bold': NotoSansJP_700Bold,
  'NotoNastaliqUrdu-Regular': NotoNastaliqUrdu_400Regular,
  'NotoNastaliqUrdu-Bold': NotoNastaliqUrdu_700Bold,
} as const;

export type AppFontName = keyof typeof appFontMap;

export function useAppFonts(): { fontsReady: boolean; fontError: Error | null } {
  const [loaded, error] = useFonts(appFontMap);
  return { fontsReady: loaded || error !== null, fontError: error };
}

export const fontFamilies = {
  latinSemiBold: 'Nunito-SemiBold',
  latinExtraBold: 'Nunito-ExtraBold',
  japaneseRegular: 'NotoSansJP-Regular',
  japaneseMedium: 'NotoSansJP-Medium',
  japaneseBold: 'NotoSansJP-Bold',
  urduRegular: 'NotoNastaliqUrdu-Regular',
  urduBold: 'NotoNastaliqUrdu-Bold',
} as const;

export function japaneseFontForWeight(weight: TextStyle['fontWeight']): AppFontName {
  const value = String(weight ?? '400');
  if (value === '700' || value === '800' || value === '900' || value === 'bold') {
    return 'NotoSansJP-Bold';
  }
  if (value === '500' || value === '600') {
    return 'NotoSansJP-Medium';
  }
  return 'NotoSansJP-Regular';
}

export function urduFontForWeight(weight: TextStyle['fontWeight']): AppFontName {
  const value = String(weight ?? '400');
  return value === '700' || value === '800' || value === '900' || value === 'bold'
    ? 'NotoNastaliqUrdu-Bold'
    : 'NotoNastaliqUrdu-Regular';
}

const EXTRA_BOLD_VARIANTS: ReadonlySet<TextVariant> = new Set([
  'display',
  'title',
  'brand',
  'kanaHero',
]);

const SEMI_BOLD_VARIANTS: ReadonlySet<TextVariant> = new Set([
  'heading',
  'subtitle',
  'label',
  'button',
]);

/**
 * Latin headings and labels use Nunito; body copy deliberately stays on the
 * platform font for comfortable long-form reading.
 */
export function latinFontForVariant(variant: TextVariant): AppFontName | null {
  if (EXTRA_BOLD_VARIANTS.has(variant)) return 'Nunito-ExtraBold';
  if (SEMI_BOLD_VARIANTS.has(variant)) return 'Nunito-SemiBold';
  return null;
}
