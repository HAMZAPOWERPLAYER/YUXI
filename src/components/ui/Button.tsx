import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { gradients, motion } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { Row } from './Row';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  iconPosition?: 'start' | 'end';
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'start',
  fullWidth = true,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const theme = useAppTheme();
  const [scale] = useState(() => new Animated.Value(1));
  const isDisabled = disabled || loading;
  const resolvedVariant = variant === 'destructive' ? 'danger' : variant;
  const isGradient = resolvedVariant === 'primary' && !isDisabled;
  const minHeight =
    size === 'sm'
      ? theme.sizes.buttonHeightSmall
      : size === 'lg'
        ? theme.sizes.buttonHeightLarge
        : theme.sizes.buttonHeight;

  const palette = {
    primary: {
      background: theme.colors.primary,
      pressed: theme.colors.primaryPressed,
      border: theme.colors.primaryDeep,
      text: 'textOnPrimary' as const,
    },
    secondary: {
      background: theme.colors.surface2,
      pressed: theme.colors.surface3,
      border: theme.colors.borderStrong,
      text: 'text' as const,
    },
    ghost: {
      background: theme.colors.transparent,
      pressed: theme.colors.surface2,
      border: theme.colors.transparent,
      text: 'primaryText' as const,
    },
    danger: {
      background: theme.colors.dangerSoft,
      pressed: theme.colors.surface2,
      border: theme.colors.danger,
      text: 'danger' as const,
    },
  }[resolvedVariant];

  const animateScale = (toValue: number) => {
    if (theme.reduceMotion || isDisabled) return;
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  return (
    <Animated.View
      style={[fullWidth ? styles.fullWidth : styles.autoWidth, { transform: [{ scale }] }, style]}
    >
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
        accessibilityState={{ busy: loading, disabled: isDisabled }}
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={() => animateScale(motion.pressScale)}
        onPressOut={() => animateScale(1)}
        testID={testID}
        style={({ pressed }) => [
          styles.base,
          {
            alignSelf: fullWidth ? 'stretch' : 'flex-start',
            backgroundColor: isGradient
              ? theme.colors.primaryDeep
              : isDisabled
                ? theme.colors.surface2
                : pressed
                  ? palette.pressed
                  : palette.background,
            borderColor: isDisabled ? theme.colors.borderStrong : palette.border,
            borderRadius: theme.radii.md,
            minHeight,
            opacity: isDisabled ? 0.62 : 1,
          },
        ]}
      >
        {({ pressed }) => (
          <>
            {isGradient ? (
              <LinearGradient
                colors={pressed ? gradients.buttonPressed : gradients.button}
                end={{ x: 1, y: 0.6 }}
                pointerEvents="none"
                start={{ x: 0, y: 0.4 }}
                style={styles.fill}
              />
            ) : null}
            <Row
              gap={theme.spacing.xs}
              justify="center"
              style={fullWidth ? styles.content : undefined}
            >
              {icon && iconPosition === 'start' ? (
                <Icon
                  color={isDisabled ? 'textMuted' : palette.text}
                  name={icon}
                  size={theme.sizes.iconMd}
                />
              ) : null}
              <AppText
                align="center"
                color={isDisabled ? 'textMuted' : palette.text}
                variant="button"
              >
                {label}
              </AppText>
              {icon && iconPosition === 'end' ? (
                <Icon
                  color={isDisabled ? 'textMuted' : palette.text}
                  name={icon}
                  size={theme.sizes.iconMd}
                />
              ) : null}
              {loading ? (
                <ActivityIndicator color={theme.colors.textOnPrimary} size="small" />
              ) : null}
            </Row>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  autoWidth: {
    alignSelf: 'flex-start',
  },
  base: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  content: {
    width: '100%',
  },
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  fullWidth: {
    width: '100%',
  },
});
