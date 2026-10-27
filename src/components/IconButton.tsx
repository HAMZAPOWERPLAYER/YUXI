import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';

import { Icon, type IconName } from './Icon';

export type IconButtonProps = {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  size?: number;
  color?: keyof ColorTokens;
  filled?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  size = 22,
  color = 'text',
  filled = true,
  disabled = false,
  style,
  testID,
}: IconButtonProps) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: filled
            ? pressed
              ? theme.colors.surface
              : theme.colors.surface2
            : pressed
              ? theme.colors.surface2
              : theme.colors.transparent,
          borderColor: filled ? theme.colors.border : theme.colors.transparent,
          borderRadius: theme.radii.pill,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      <Icon name={icon} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
    width: 48,
  },
});
