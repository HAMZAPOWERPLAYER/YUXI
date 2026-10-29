import { useState } from 'react';
import { Animated, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { type ColorTokens, motion } from '@/theme/tokens';

import { Icon, type IconName, type IconSize } from './Icon';

export type IconButtonProps = {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  size?: IconSize;
  color?: keyof ColorTokens;
  filled?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  size = 'lg',
  color = 'text',
  filled = true,
  disabled = false,
  accessibilityHint,
  style,
  testID,
}: IconButtonProps) {
  const theme = useAppTheme();
  const [scale] = useState(() => new Animated.Value(1));

  const animateScale = (toValue: number) => {
    if (theme.reduceMotion || disabled) return;
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        hitSlop={4}
        onPress={onPress}
        onPressIn={() => animateScale(motion.pressScale)}
        onPressOut={() => animateScale(1)}
        testID={testID}
        style={({ pressed }) => [
          styles.base,
          {
            backgroundColor: filled
              ? pressed
                ? theme.colors.surface3
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
        <Icon color={color} name={icon} size={size} />
      </Pressable>
    </Animated.View>
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
