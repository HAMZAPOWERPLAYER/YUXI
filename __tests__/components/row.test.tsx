import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Row } from '@/components/Row';
import { I18nProvider } from '@/i18n';

describe('Row direction', () => {
  it('mirrors logical rows in Urdu', async () => {
    const screen = await render(
      <I18nProvider initialLanguage="ur">
        <Row testID="auto" />
      </I18nProvider>,
    );

    const style = StyleSheet.flatten(screen.getByTestId('auto').props.style);
    expect(style.flexDirection).toBe('row-reverse');
    expect(style.direction).toBeUndefined();
  });

  it('keeps Japanese sequences left-to-right even in Urdu', async () => {
    const screen = await render(
      <I18nProvider initialLanguage="ur">
        <Row dir="ltr" testID="ltr" />
      </I18nProvider>,
    );

    const style = StyleSheet.flatten(screen.getByTestId('ltr').props.style);
    expect(style.flexDirection).toBe('row');
    expect(style.direction).toBe('ltr');
  });

  it('does not mirror logical rows in English', async () => {
    const screen = await render(
      <I18nProvider initialLanguage="en">
        <Row testID="auto" />
      </I18nProvider>,
    );

    const style = StyleSheet.flatten(screen.getByTestId('auto').props.style);
    expect(style.flexDirection).toBe('row');
  });
});
