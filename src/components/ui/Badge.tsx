import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { Row } from './Row';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: IconName;
  accessibilityLabel?: string;
};

const backgrounds: Record<BadgeVariant, keyof ColorTokens> = {
  neutral: 'surface2',
  primary: 'primarySoft',
  success: 'successSoft',
  warning: 'warningSoft',
  danger: 'dangerSoft',
  info: 'infoSoft',
};

const foregrounds: Record<BadgeVariant, keyof ColorTokens> = {
  neutral: 'textMuted',
  primary: 'primaryText',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
};

export function Badge({
  label,
  variant = 'neutral',
  size = 'md',
  icon,
  accessibilityLabel,
}: BadgeProps) {
  const theme = useAppTheme();
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
      style={[
        styles.base,
        {
          backgroundColor: theme.colors[backgrounds[variant]],
          borderRadius: theme.radii.pill,
          paddingHorizontal: size === 'sm' ? theme.spacing.xs : theme.spacing.sm,
          paddingVertical: size === 'sm' ? 2 : 4,
        },
      ]}
    >
      <Row gap={theme.spacing.xxs} justify="center">
        {icon ? (
          <Icon color={foregrounds[variant]} name={icon} size={theme.sizes.iconSm - 2} />
        ) : null}
        <AppText color={foregrounds[variant]} lang="auto" style={styles.label} variant="caption">
          {label}
        </AppText>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    minHeight: 24,
  },
  label: {
    fontWeight: '600',
  },
});
