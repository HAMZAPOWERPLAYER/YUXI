import { render } from '@testing-library/react-native';
import { Dimensions, StyleSheet } from 'react-native';

import { AppText, type AppTextLang } from '@/components/AppText';
import { I18nProvider } from '@/i18n';
import type { Language } from '@/i18n/types';
import { AppThemeProvider } from '@/theme/ThemeProvider';
import type { TextVariant } from '@/theme/typography';

function renderText(
  language: Language,
  textScale = 1,
  options: { fontsLoaded?: boolean; variant?: TextVariant; lang?: AppTextLang } = {},
) {
  const { fontsLoaded = false, variant = 'body', lang = language } = options;
  return render(
    <I18nProvider initialLanguage={language}>
      <AppThemeProvider fontsLoaded={fontsLoaded} textScale={textScale}>
        <AppText lang={lang} testID="text" variant={variant}>
          Sample
        </AppText>
      </AppThemeProvider>
    </I18nProvider>,
  );
}

describe('AppText', () => {
  it('disables automatic scaling and applies the in-app scale once', async () => {
    const screen = await renderText('en', 1.25);
    const text = screen.getByTestId('text');
    const style = StyleSheet.flatten(text.props.style);

    expect(text.props.allowFontScaling).toBe(false);
    const { fontScale } = Dimensions.get('window');
    expect(style.fontSize).toBeCloseTo(16 * 1.25 * fontScale);
    expect(style.lineHeight).toBeCloseTo(24 * 1.25 * fontScale);
    expect(text.props.accessibilityLanguage).toBe('en-US');
  });

  it('marks Urdu as RTL and Japanese as LTR regardless of the UI language', async () => {
    const urdu = await renderText('ur', 1);
    const urduStyle = StyleSheet.flatten(urdu.getByTestId('text').props.style);
    expect(urduStyle.writingDirection).toBe('rtl');
    expect(urduStyle.textAlign).toBe('right');
    expect(urdu.getByTestId('text').props.accessibilityLanguage).toBe('ur-PK');

    const japanese = await render(
      <I18nProvider initialLanguage="ur">
        <AppThemeProvider>
          <AppText lang="ja" testID="ja">
            おはよう
          </AppText>
        </AppThemeProvider>
      </I18nProvider>,
    );
    const japaneseStyle = StyleSheet.flatten(japanese.getByTestId('ja').props.style);
    expect(japaneseStyle.writingDirection).toBe('ltr');
    expect(japaneseStyle.textAlign).toBe('left');
    expect(japanese.getByTestId('ja').props.accessibilityLanguage).toBe('ja-JP');
  });

  it('uses Nunito for Latin headings and the system font for Latin body copy', async () => {
    const display = await renderText('en', 1, {
      fontsLoaded: true,
      variant: 'display',
    });
    const displayStyle = StyleSheet.flatten(display.getByTestId('text').props.style);
    expect(displayStyle.fontFamily).toBe('Nunito-ExtraBold');
    expect(displayStyle.fontWeight).toBe('400');

    const heading = await renderText('en', 1, {
      fontsLoaded: true,
      variant: 'heading',
    });
    const headingStyle = StyleSheet.flatten(heading.getByTestId('text').props.style);
    expect(headingStyle.fontFamily).toBe('Nunito-SemiBold');

    const body = await renderText('en', 1, { fontsLoaded: true, variant: 'body' });
    const bodyStyle = StyleSheet.flatten(body.getByTestId('text').props.style);
    expect(bodyStyle.fontFamily).toBeUndefined();
    expect(bodyStyle.fontWeight).toBe('400');
  });

  it('keeps Japanese and Urdu on their bundled fonts', async () => {
    const japanese = await renderText('ur', 1, {
      fontsLoaded: true,
      lang: 'ja',
      variant: 'kanaHero',
    });
    const japaneseStyle = StyleSheet.flatten(japanese.getByTestId('text').props.style);
    expect(japaneseStyle.fontFamily).toBe('NotoSansJP-Medium');

    const urdu = await renderText('ur', 1, {
      fontsLoaded: true,
      variant: 'title',
    });
    const urduStyle = StyleSheet.flatten(urdu.getByTestId('text').props.style);
    expect(urduStyle.fontFamily).toBe('NotoNastaliqUrdu-Bold');
    expect(urduStyle.writingDirection).toBe('rtl');
  });

  it('caps display type at 200% while body text keeps full scaling', async () => {
    const { fontScale } = Dimensions.get('window');
    const display = await renderText('en', 2, { fontsLoaded: true, variant: 'display' });
    const displayStyle = StyleSheet.flatten(display.getByTestId('text').props.style);
    expect(displayStyle.fontSize).toBeCloseTo(32 * Math.min(2 * fontScale, 2));

    const body = await renderText('en', 1.6, { fontsLoaded: true, variant: 'body' });
    const bodyStyle = StyleSheet.flatten(body.getByTestId('text').props.style);
    expect(bodyStyle.fontSize).toBeCloseTo(16 * 1.6 * fontScale);
  });
});
