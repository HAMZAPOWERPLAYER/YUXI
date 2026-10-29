import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDirection } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { Row } from './Row';
import { Stack } from './Stack';

export type SettingsRowProps = {
  icon: IconName;
  title: string;
  description?: string;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
  danger?: boolean;
  busy?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

/** One tappable line inside a settings or data group. */
export function SettingsRow({
  icon,
  title,
  description,
  right,
  onPress,
  last = false,
  danger = false,
  busy = false,
  accessibilityLabel,
  testID,
}: SettingsRowProps) {
  const theme = useAppTheme();
  const { isRTL } = useDirection();
  const tint: keyof ColorTokens = danger ? 'danger' : 'textMuted';

  const content = (
    <Row
      align="center"
      gap={theme.spacing.sm}
      style={[
        styles.row,
        {
          borderBottomColor: theme.colors.border,
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
          paddingVertical: theme.spacing.sm,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: danger ? theme.colors.dangerSoft : theme.colors.surface2,
            borderRadius: theme.radii.sm,
          },
        ]}
      >
        <Icon color={tint} name={icon} size={19} />
      </View>
      <Stack gap={1} style={styles.text}>
        <AppText color={danger ? 'danger' : 'text'} variant="bodyStrong">
          {title}
        </AppText>
        {description ? (
          <AppText color="textMuted" variant="caption">
            {description}
          </AppText>
        ) : null}
      </Stack>
      {busy ? (
        <AppText color="textMuted" variant="caption">
          …
        </AppText>
      ) : null}
      {right}
      {onPress && !right && !busy ? (
        <Icon color="textMuted" name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} />
      ) : null}
    </Row>
  );

  if (!onPress) {
    return (
      <View
        accessibilityHint={description}
        accessibilityLabel={accessibilityLabel}
        accessible={Boolean(accessibilityLabel)}
        testID={testID}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={description}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
      testID={testID}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    paddingHorizontal: 12,
  },
  iconWrap: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  text: {
    flex: 1,
  },
});
