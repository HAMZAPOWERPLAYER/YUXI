import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Dialog } from '@/components/ui/Dialog';
import { OptionButton, optionButtonAppearance } from '@/components/ui/OptionButton';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Sheet } from '@/components/ui/Sheet';
import { SpeechBubble } from '@/components/ui/SpeechBubble';
import { Toast } from '@/components/ui/Toast';
import { clampProgress } from '@/components/ui/progress';
import { I18nProvider } from '@/i18n';
import { AppThemeProvider } from '@/theme/ThemeProvider';

jest.mock('@expo/vector-icons/Ionicons', () => () => null);
// Keep Animated values synchronous in tests: no timers, no act warnings.
jest.mock('@/hooks/useReduceMotion', () => ({ useReduceMotion: () => true }));

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

function renderThemed(node: React.ReactElement, language: 'en' | 'ur' = 'en') {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <I18nProvider initialLanguage={language}>
        <AppThemeProvider>{node}</AppThemeProvider>
      </I18nProvider>
    </SafeAreaProvider>,
  );
}

describe('clampProgress and ProgressRing', () => {
  it('clamps out-of-range and non-finite progress', () => {
    expect(clampProgress(-0.4)).toBe(0);
    expect(clampProgress(0.42)).toBe(0.42);
    expect(clampProgress(1.9)).toBe(1);
    expect(clampProgress(Number.NaN)).toBe(0);
    expect(clampProgress(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('exposes the rounded, clamped value as an accessible progressbar', async () => {
    const screen = await renderThemed(
      <ProgressRing accessibilityLabel="Daily goal" progress={1.4} testID="ring" />,
    );
    const ring = screen.getByTestId('ring');

    expect(ring.props.accessibilityRole).toBe('progressbar');
    expect(ring.props.accessibilityLabel).toBe('Daily goal');
    expect(ring.props.accessibilityValue).toEqual({ max: 100, min: 0, now: 100 });
  });

  it('never reports a negative or NaN percentage', async () => {
    const screen = await renderThemed(<ProgressRing progress={-1} testID="ring" />);
    expect(screen.getByTestId('ring').props.accessibilityValue.now).toBe(0);
  });
});

describe('SpeechBubble', () => {
  it('mirrors a start tail to the right edge in Urdu', async () => {
    const screen = await renderThemed(
      <SpeechBubble message="آج کا ہدف مکمل" tail="start" testID="bubble" />,
      'ur',
    );
    const tail = StyleSheet.flatten(
      screen.getByTestId('bubble-tail', { includeHiddenElements: true }).props.style,
    );

    expect(tail.right).toBe(-5);
    expect(tail.left).toBeUndefined();
    expect(screen.getByText('آج کا ہدف مکمل')).toBeTruthy();
  });

  it('keeps a start tail on the left in English and flips an end tail in Urdu', async () => {
    const english = await renderThemed(
      <SpeechBubble message="Keep going" tail="start" testID="bubble" />,
    );
    const englishTail = StyleSheet.flatten(
      english.getByTestId('bubble-tail', { includeHiddenElements: true }).props.style,
    );
    expect(englishTail.left).toBe(-5);
    expect(englishTail.right).toBeUndefined();

    const urdu = await renderThemed(
      <SpeechBubble message="جاری رکھیں" tail="end" testID="bubble" />,
      'ur',
    );
    const urduTail = StyleSheet.flatten(
      urdu.getByTestId('bubble-tail', { includeHiddenElements: true }).props.style,
    );
    expect(urduTail.left).toBe(-5);
    expect(urduTail.right).toBeUndefined();
  });

  it('omits the tail when asked', async () => {
    const screen = await renderThemed(
      <SpeechBubble message="No tail" tail="none" testID="bubble" />,
    );
    expect(screen.queryByTestId('bubble-tail')).toBeNull();
  });
});

describe('OptionButton', () => {
  it('maps every state to distinct, non-colour-only signals', () => {
    expect(optionButtonAppearance('idle').icon).toBeUndefined();
    expect(optionButtonAppearance('selected')).toMatchObject({
      icon: 'checkmark-circle',
      selected: true,
    });
    expect(optionButtonAppearance('correct')).toMatchObject({
      icon: 'checkmark-circle',
      selected: true,
    });
    expect(optionButtonAppearance('wrong')).toMatchObject({
      icon: 'close-circle',
      selected: false,
    });
    expect(optionButtonAppearance('disabled')).toMatchObject({
      disabled: true,
      text: 'textMuted',
    });
  });

  it('reports correct answers as selected and announces the provided label', async () => {
    const screen = await renderThemed(
      <OptionButton
        accessibilityLabel="Correct answer: あ"
        label="あ"
        onPress={jest.fn()}
        state="correct"
        testID="option"
      />,
    );
    const option = screen.getByTestId('option');

    expect(option.props.accessibilityLabel).toBe('Correct answer: あ');
    expect(option.props.accessibilityState).toEqual({ disabled: false, selected: true });
  });

  it('blocks presses when disabled', async () => {
    const onPress = jest.fn();
    const screen = await renderThemed(
      <OptionButton label="Later" onPress={onPress} state="disabled" testID="option" />,
    );
    const option = screen.getByTestId('option');

    expect(option.props.accessibilityState).toEqual({ disabled: true, selected: false });
    await fireEvent.press(option);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Toast', () => {
  it('renders a polite alert only while visible', async () => {
    const hidden = await renderThemed(<Toast message="Saved" testID="toast" visible={false} />);
    expect(hidden.queryByTestId('toast')).toBeNull();

    const shown = await renderThemed(<Toast message="Saved" testID="toast" visible />);
    const toast = shown.getByTestId('toast');
    expect(toast.props.accessibilityRole).toBe('alert');
    expect(toast.props.accessibilityLiveRegion).toBe('polite');
    expect(shown.getByText('Saved')).toBeTruthy();
  });

  it('can sit in the normal flow for previews', async () => {
    const screen = await renderThemed(<Toast inline message="Saved" testID="toast" visible />);
    const wrapper = StyleSheet.flatten(screen.getByTestId('toast-wrap').props.style);
    expect(wrapper.position).toBeUndefined();
  });
});

describe('Sheet', () => {
  it('renders as a modal with a labelled close action', async () => {
    const onClose = jest.fn();
    const screen = await renderThemed(
      <Sheet closeLabel="Close" onClose={onClose} testID="sheet" title="Sheet title" visible>
        <></>
      </Sheet>,
    );

    expect(screen.getByTestId('sheet').props.accessibilityViewIsModal).toBe(true);
    await fireEvent.press(screen.getByTestId('sheet-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
    await screen.unmount();
  });

  it('lets the backdrop dismiss a dismissible sheet', async () => {
    const onClose = jest.fn();
    const screen = await renderThemed(
      <Sheet closeLabel="Close" onClose={onClose} testID="sheet" title="Sheet title" visible>
        <></>
      </Sheet>,
    );

    await fireEvent.press(screen.getByTestId('sheet-backdrop', { includeHiddenElements: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Dialog', () => {
  it('runs cancel and confirm actions and marks the modal boundary', async () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    const screen = await renderThemed(
      <Dialog
        body="This cannot be undone."
        cancelLabel="Cancel"
        confirmLabel="Delete"
        destructive
        onCancel={onCancel}
        onConfirm={onConfirm}
        testID="dialog"
        title="Delete this data?"
        visible
      />,
    );

    expect(screen.getByTestId('dialog').props.accessibilityViewIsModal).toBe(true);
    await fireEvent.press(screen.getByTestId('dialog-cancel'));
    await fireEvent.press(screen.getByTestId('dialog-confirm'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await screen.unmount();
  });

  it('blocks both actions while loading', async () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    const screen = await renderThemed(
      <Dialog
        cancelLabel="Cancel"
        confirmLabel="Save"
        loading
        onCancel={onCancel}
        onConfirm={onConfirm}
        testID="dialog"
        title="Saving"
        visible
      />,
    );

    await fireEvent.press(screen.getByTestId('dialog-cancel', { includeHiddenElements: true }));
    await fireEvent.press(screen.getByTestId('dialog-confirm', { includeHiddenElements: true }));
    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
