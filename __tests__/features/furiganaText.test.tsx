import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { FuriganaText } from '@/features/exercises/components/FuriganaText';
import { I18nProvider } from '@/i18n';
import { AppThemeProvider } from '@/theme/ThemeProvider';

function renderJapanese(element: ReactElement) {
  return render(
    <I18nProvider initialLanguage="ur">
      <AppThemeProvider>{element}</AppThemeProvider>
    </I18nProvider>,
  );
}

describe('FuriganaText', () => {
  it('renders plain Japanese text without readings', async () => {
    const screen = await renderJapanese(<FuriganaText text="おはよう" />);

    expect(screen.getByText('おはよう')).toBeTruthy();
    expect(screen.queryByText('わたし')).toBeNull();
  });

  it('stacks readings above their segments and exposes one accessible label', async () => {
    const screen = await renderJapanese(
      <FuriganaText
        text="私は学生です"
        segments={[
          { text: '私', reading: 'わたし' },
          { text: 'は' },
          { text: '学生', reading: 'がくせい' },
          { text: 'です' },
        ]}
      />,
    );

    expect(screen.getByText('わたし')).toBeTruthy();
    expect(screen.getByText('がくせい')).toBeTruthy();
    expect(screen.getByText('私')).toBeTruthy();
    expect(screen.getByText('学生')).toBeTruthy();
    expect(screen.getByLabelText('私は学生です')).toBeTruthy();
  });

  it('falls back to the full text when segments do not match', async () => {
    const screen = await renderJapanese(
      <FuriganaText text="学生" segments={[{ text: '私', reading: 'わたし' }]} />,
    );

    expect(screen.getByText('学生')).toBeTruthy();
    expect(screen.queryByText('私')).toBeNull();
  });
});
