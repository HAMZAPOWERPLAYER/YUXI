import { Text, type TextProps, type TextStyle, useWindowDimensions } from 'react-native';

import { useDirection } from '@/i18n';
import type { Language } from '@/i18n/types';
import { useAppTheme } from '@/theme/ThemeProvider';
import { japaneseFontForWeight, urduFontForWeight } from '@/theme/fonts';
import { type ColorTokens } from '@/theme/tokens';
import {
  URDU_LINE_HEIGHT_RATIO,
  URDU_TOP_PADDING_RATIO,
  type TextVariant,
  typography,
} from '@/theme/typography';

export type AppTextLang = 'auto' | Language | 'ja';
export type AppTextAlign = 'start' | 'center' | 'end';

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  lang?: AppTextLang;
  color?: keyof ColorTokens;
  align?: AppTextAlign;
};

function resolveLanguage(
  lang: AppTextLang,
  variant: TextVariant,
  current: Language,
): Language | 'ja' {
  if (lang !== 'auto') return lang;
  if (variant === 'kana' || variant === 'kanaLarge' || variant === 'kanaHero') return 'ja';
  if (variant === 'brand') return 'en';
  return current;
}

export function AppText({
  variant = 'body',
  lang = 'auto',
  color = 'text',
  align = 'start',
  style,
  children,
  ...rest
}: AppTextProps) {
  const theme = useAppTheme();
  const { language } = useDirection();
  const { fontScale } = useWindowDimensions();

  const token = typography[variant];
  const effectiveLang = resolveLanguage(lang, variant, language);
  const effectiveDirection = effectiveLang === 'ur' ? 'rtl' : 'ltr';
  const scaledFontSize = token.fontSize * theme.textScale;
  const renderedFontSize = scaledFontSize * fontScale;

  let fontFamily: string | undefined;
  let fontWeight: TextStyle['fontWeight'] = token.fontWeight;
  let lineHeight = token.lineHeight * theme.textScale * fontScale;
  let paddingTop = 0;

  if (effectiveLang === 'ja' && theme.fontsLoaded) {
    fontFamily = japaneseFontForWeight(token.fontWeight);
    fontWeight = '400';
  } else if (effectiveLang === 'ur' && theme.fontsLoaded) {
    fontFamily = urduFontForWeight(token.fontWeight);
    fontWeight = '400';
    lineHeight = Math.max(
      token.lineHeight * theme.textScale,
      renderedFontSize * URDU_LINE_HEIGHT_RATIO,
    );
    paddingTop = Math.round(renderedFontSize * URDU_TOP_PADDING_RATIO);
  } else if (effectiveLang === 'ur') {
    lineHeight = Math.max(token.lineHeight * theme.textScale, renderedFontSize * 1.7);
  }

  const textAlign =
    align === 'center'
      ? 'center'
      : align === 'end'
        ? effectiveDirection === 'rtl'
          ? 'left'
          : 'right'
        : effectiveDirection === 'rtl'
          ? 'right'
          : 'left';

  return (
    <Text
      {...rest}
      style={[
        {
          color: theme.colors[color],
          fontFamily,
          fontSize: scaledFontSize,
          fontWeight,
          includeFontPadding: effectiveLang === 'ur',
          letterSpacing: token.letterSpacing,
          lineHeight,
          paddingTop: paddingTop > 0 ? paddingTop : undefined,
          textAlign,
          writingDirection: effectiveDirection,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
