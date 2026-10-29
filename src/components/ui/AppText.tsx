import { Text, type TextProps, type TextStyle, useWindowDimensions } from 'react-native';

import { useDirection } from '@/i18n';
import type { Language } from '@/i18n/types';
import { latinFontForVariant, japaneseFontForWeight, urduFontForWeight } from '@/theme/fonts';
import { useAppTheme } from '@/theme/ThemeProvider';
import { type ColorTokens } from '@/theme/tokens';
import { type TextVariant, resolveTextMetrics, typography } from '@/theme/typography';

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
  const metrics = resolveTextMetrics(token, {
    textScale: theme.textScale,
    fontScale,
    language: effectiveLang,
    urduFontsLoaded: effectiveLang === 'ur' && theme.fontsLoaded,
  });

  let fontFamily: string | undefined;
  let fontWeight: TextStyle['fontWeight'] = token.fontWeight;

  if (effectiveLang === 'ja' && theme.fontsLoaded) {
    fontFamily = japaneseFontForWeight(token.fontWeight);
    fontWeight = '400';
  } else if (effectiveLang === 'ur' && theme.fontsLoaded) {
    fontFamily = urduFontForWeight(token.fontWeight);
    fontWeight = '400';
  } else if (effectiveLang === 'en' && theme.fontsLoaded) {
    const latinFamily = latinFontForVariant(variant);
    if (latinFamily) {
      fontFamily = latinFamily;
      fontWeight = '400';
    }
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
      // AppText applies both scales itself so line height and font size cannot
      // drift apart when the OS text size changes.
      accessibilityLanguage={
        effectiveLang === 'ja' ? 'ja-JP' : effectiveLang === 'ur' ? 'ur-PK' : 'en-US'
      }
      allowFontScaling={false}
      style={[
        {
          color: theme.colors[color],
          fontFamily,
          fontSize: metrics.fontSize,
          fontWeight,
          includeFontPadding: effectiveLang === 'ur',
          letterSpacing: token.letterSpacing,
          lineHeight: metrics.lineHeight,
          paddingTop: metrics.paddingTop > 0 ? metrics.paddingTop : undefined,
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
