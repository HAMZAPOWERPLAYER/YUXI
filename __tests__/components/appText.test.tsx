import { render } from '@testing-library/react-native';
import { Dimensions, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { I18nProvider } from '@/i18n';
import type { Language } from '@/i18n/types';
import { AppThemeProvider } from '@/theme/ThemeProvider';

function renderText(language: Language, textScale = 1) {
  return render(
    <I18nProvider initialLanguage={language}>
      <AppThemeProvider textScale={textScale}>
        <AppText lang={language} testID="text" variant="body">
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
});
