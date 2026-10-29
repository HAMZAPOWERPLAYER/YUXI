import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { Row } from './Row';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  icon?: IconName;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Filter/selection chip. Selection is conveyed by a check icon and
 * accessibilityState, not by the crimson tint alone.
 */
export function Chip({
  label,
  selected = false,
  onPress,
  disabled = false,
  icon,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: ChipProps) {
  const theme = useAppTheme();

  const body = (
    <Row gap={theme.spacing.xxs} justify="center" style={styles.content}>
      {icon ? (
        <Icon
          color={selected ? 'primaryText' : 'textMuted'}
          name={icon}
          size={theme.sizes.iconSm}
        />
      ) : null}
      <AppText color={disabled ? 'textMuted' : selected ? 'primaryText' : 'text'} variant="label">
        {label}
      </AppText>
      {selected ? <Icon color="primaryText" name="checkmark" size={theme.sizes.iconSm} /> : null}
    </Row>
  );

  const chrome: StyleProp<ViewStyle> = [
    styles.base,
    {
      backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface2,
      borderColor: selected ? theme.colors.primary : theme.colors.border,
      borderRadius: theme.radii.pill,
      opacity: disabled ? 0.5 : 1,
    },
    style,
  ];

  if (!onPress) {
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="text"
        accessibilityState={{ disabled, selected }}
        style={chrome}
        testID={testID}
      >
        {body}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [chrome, pressed && !disabled ? styles.pressed : null]}
      testID={testID}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  content: {
    minHeight: 24,
  },
  pressed: {
    opacity: 0.82,
  },
});
