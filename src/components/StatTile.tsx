import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { Row } from './Row';
import { Stack } from './Stack';

export type StatTileProps = {
  label: string;
  value: string;
  icon?: IconName;
  color?: keyof ColorTokens;
  subtitle?: string;
  right?: ReactNode;
};

/** Compact metric card used on Home, Stats and the session summary. */
export function StatTile({
  label,
  value,
  icon,
  color = 'primaryText',
  subtitle,
  right,
}: StatTileProps) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.md,
          padding: theme.spacing.sm,
        },
      ]}
    >
      <Stack gap={2}>
        <Row align="center" gap={6}>
          {icon ? <Icon color={color} name={icon} size={16} /> : null}
          <AppText color="textMuted" variant="caption">
            {label}
          </AppText>
          {right}
        </Row>
        <AppText color={color} numberOfLines={1} variant="heading">
          {value}
        </AppText>
        {subtitle ? (
          <AppText color="textMuted" variant="caption">
            {subtitle}
          </AppText>
        ) : null}
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    flex: 1,
    minWidth: 96,
  },
});
