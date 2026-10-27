import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';

import { AppText } from './AppText';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  accessibilityLabel?: string;
};

const backgrounds: Record<BadgeVariant, keyof ColorTokens> = {
  neutral: 'surface2',
  primary: 'primarySoft',
  success: 'successSoft',
  warning: 'warningSoft',
  danger: 'dangerSoft',
};

const foregrounds: Record<BadgeVariant, keyof ColorTokens> = {
  neutral: 'textMuted',
  primary: 'primaryText',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

export function Badge({ label, variant = 'neutral', accessibilityLabel }: BadgeProps) {
  const theme = useAppTheme();
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
      style={[
        styles.base,
        {
          backgroundColor: theme.colors[backgrounds[variant]],
          borderColor: theme.colors.border,
          borderRadius: theme.radii.pill,
        },
      ]}
    >
      <AppText variant="caption" color={foregrounds[variant]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
});
