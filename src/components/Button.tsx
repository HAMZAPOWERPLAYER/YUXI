import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { Row } from './Row';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
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
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const theme = useAppTheme();
  const isDisabled = disabled || loading;
  const height =
    size === 'sm'
      ? theme.sizes.buttonHeightSmall
      : size === 'lg'
        ? theme.sizes.buttonHeightLarge
        : theme.sizes.buttonHeight;

  const palette = {
    primary: {
      background: theme.colors.primary,
      pressed: theme.colors.primaryPressed,
      border: theme.colors.primary,
      text: 'textOnPrimary' as const,
    },
    secondary: {
      background: theme.colors.surface2,
      pressed: theme.colors.surface,
      border: theme.colors.border,
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
  }[variant];

  const content = (
    <Row gap={theme.spacing.xs} justify="center" style={styles.content}>
      {icon && iconPosition === 'start' ? (
        <Icon name={icon} size={20} color={isDisabled ? 'textMuted' : palette.text} />
      ) : null}
      <AppText variant="button" color={isDisabled ? 'textMuted' : palette.text} align="center">
        {label}
      </AppText>
      {icon && iconPosition === 'end' ? (
        <Icon name={icon} size={20} color={isDisabled ? 'textMuted' : palette.text} />
      ) : null}
      {loading ? <ActivityIndicator size="small" color={theme.colors.textMuted} /> : null}
    </Row>
  );

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      hitSlop={4}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed && !isDisabled ? palette.pressed : palette.background,
          borderColor: palette.border,
          borderRadius: theme.radii.md,
          height,
          opacity: isDisabled ? 0.55 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 20,
  },
  content: {
    width: '100%',
  },
});
