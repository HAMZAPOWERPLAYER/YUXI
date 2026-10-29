import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { type ColorTokens } from '@/theme/tokens';

import { AppText, type AppTextLang } from './AppText';
import { Icon, type IconName } from './Icon';

export type OptionButtonState = 'idle' | 'selected' | 'correct' | 'wrong' | 'disabled';

export type OptionButtonAppearance = {
  background: keyof ColorTokens;
  border: keyof ColorTokens;
  text: keyof ColorTokens;
  icon?: IconName;
  iconColor?: keyof ColorTokens;
  selected: boolean;
  disabled: boolean;
};

/**
 * State-to-style mapping exported for tests and migration checks. Correct and
 * wrong always carry an icon and accessibility state, so the result never
 * depends on the crimson/green tint alone.
 */
export function optionButtonAppearance(state: OptionButtonState): OptionButtonAppearance {
  switch (state) {
    case 'selected':
      return {
        background: 'primarySoft',
        border: 'primary',
        text: 'text',
        icon: 'checkmark-circle',
        iconColor: 'primaryText',
        selected: true,
        disabled: false,
      };
    case 'correct':
      return {
        background: 'successSoft',
        border: 'success',
        text: 'text',
        icon: 'checkmark-circle',
        iconColor: 'success',
        selected: true,
        disabled: false,
      };
    case 'wrong':
      return {
        background: 'dangerSoft',
        border: 'danger',
        text: 'text',
        icon: 'close-circle',
        iconColor: 'danger',
        selected: false,
        disabled: false,
      };
    case 'disabled':
      return {
        background: 'surface2',
        border: 'border',
        text: 'textMuted',
        selected: false,
        disabled: true,
      };
    case 'idle':
    default:
      return {
        background: 'surface',
        border: 'border',
        text: 'text',
        selected: false,
        disabled: false,
      };
  }
}

export type OptionButtonProps = {
  label: string;
  caption?: string;
  state?: OptionButtonState;
  onPress: () => void;
  lang?: AppTextLang;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Answer/choice tile for lessons, quizzes and practice. The visual state, icon
 * and accessibilityState are derived from one mapping so they cannot disagree.
 */
export function OptionButton({
  label,
  caption,
  state = 'idle',
  onPress,
  lang = 'auto',
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: OptionButtonProps) {
  const theme = useAppTheme();
  const appearance = optionButtonAppearance(state);
  const isDisabled = appearance.disabled;
  const japanese = lang === 'ja';

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, selected: appearance.selected }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: theme.colors[appearance.background],
          borderColor: theme.colors[appearance.border],
          borderRadius: theme.radii.md,
          opacity: isDisabled ? 0.55 : pressed ? 0.82 : 1,
        },
        style,
      ]}
      testID={testID}
    >
      <View style={styles.text}>
        <AppText
          align="center"
          color={appearance.text}
          lang={lang}
          variant={japanese ? 'kanaLarge' : 'bodyStrong'}
        >
          {label}
        </AppText>
        {caption ? (
          <AppText align="center" color="textMuted" lang={lang} variant="caption">
            {caption}
          </AppText>
        ) : null}
      </View>
      {appearance.icon ? (
        <View style={styles.icon}>
          <Icon color={appearance.iconColor} name={appearance.icon} size={theme.sizes.iconSm} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    end: 6,
    top: 6,
  },
  text: {
    alignItems: 'center',
    gap: 2,
    width: '100%',
  },
});
