import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { ListRow } from '@/components/ui/ListRow';
import { I18nProvider } from '@/i18n';
import { AppThemeProvider } from '@/theme/ThemeProvider';

// The icon font is loaded natively on a device. In Jest the asset registry is
// not populated, so render nothing for the icon glyph.
jest.mock('@expo/vector-icons/Ionicons', () => () => null);

function renderThemed(node: React.ReactElement) {
  return render(
    <I18nProvider initialLanguage="en">
      <AppThemeProvider>{node}</AppThemeProvider>
    </I18nProvider>,
  );
}

describe('Button', () => {
  it('exposes its label, role and a 48dp minimum target', async () => {
    const screen = await renderThemed(<Button label="Continue" onPress={jest.fn()} testID="cta" />);
    const button = screen.getByTestId('cta');
    const style = StyleSheet.flatten(button.props.style);

    expect(button.props.accessibilityLabel).toBe('Continue');
    expect(button.props.accessibilityRole).toBe('button');
    expect(style.minHeight).toBeGreaterThanOrEqual(48);
  });

  it('reports disabled and busy states and blocks presses', async () => {
    const onPress = jest.fn();
    const screen = await renderThemed(
      <Button label="Saving" loading onPress={onPress} testID="cta" />,
    );
    const button = screen.getByTestId('cta');

    expect(button.props.accessibilityState).toEqual({ busy: true, disabled: true });
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Chip', () => {
  it('conveys selection through accessibility state, not colour alone', async () => {
    const screen = await renderThemed(
      <Chip label="Hiragana" onPress={jest.fn()} selected testID="chip" />,
    );
    const chip = screen.getByTestId('chip');

    expect(chip.props.accessibilityState).toEqual({ disabled: false, selected: true });
    expect(screen.getByText('Hiragana')).toBeTruthy();
  });
});

describe('IconButton', () => {
  it('always provides a 48dp target and an accessible label', async () => {
    const screen = await renderThemed(
      <IconButton
        accessibilityLabel="Settings"
        icon="settings"
        onPress={jest.fn()}
        testID="icon"
      />,
    );
    const button = screen.getByTestId('icon');
    const style = StyleSheet.flatten(button.props.style);

    expect(button.props.accessibilityLabel).toBe('Settings');
    expect(style.height).toBeGreaterThanOrEqual(48);
    expect(style.minWidth).toBeGreaterThanOrEqual(48);
  });
});

describe('ListRow', () => {
  it('uses the title as its accessible button label and invokes the action', async () => {
    const onPress = jest.fn();
    const screen = await renderThemed(
      <ListRow description="12 items" icon="book" onPress={onPress} testID="row" title="Words" />,
    );
    const row = screen.getByTestId('row');

    expect(row.props.accessibilityLabel).toBe('Words');
    expect(row.props.accessibilityRole).toBe('button');
    fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Badge', () => {
  it('renders an informational badge with text, not colour alone', async () => {
    const screen = await renderThemed(<Badge icon="time" label="12 due" variant="info" />);

    expect(screen.getByText('12 due')).toBeTruthy();
  });
});
