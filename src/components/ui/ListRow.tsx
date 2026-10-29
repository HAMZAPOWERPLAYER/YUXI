import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useDirection } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { Row } from './Row';
import { Stack } from './Stack';

export type ListRowProps = {
  title: string;
  description?: string;
  icon?: IconName;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
  danger?: boolean;
  busy?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Grouped settings/list line. The chevron is mirrored in Urdu and the row
 * keeps a 56dp minimum height for a comfortable TalkBack target.
 */
export function ListRow({
  title,
  description,
  icon,
  right,
  onPress,
  last = false,
  danger = false,
  busy = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: ListRowProps) {
  const theme = useAppTheme();
  const { isRTL } = useDirection();
  const tint: keyof ColorTokens = danger ? 'danger' : 'textMuted';

  const content = (pressed: boolean) => (
    <Row
      align="center"
      gap={theme.spacing.sm}
      style={[
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.surface2 : theme.colors.transparent,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
          paddingVertical: theme.spacing.sm,
        },
        style,
      ]}
    >
      {icon ? (
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: danger ? theme.colors.dangerSoft : theme.colors.surface2,
              borderRadius: theme.radii.sm,
            },
          ]}
        >
          <Icon color={tint} name={icon} size={theme.sizes.iconMd} />
        </View>
      ) : null}
      <Stack gap={2} style={styles.text}>
        <AppText color={danger ? 'danger' : 'text'} variant="bodyStrong">
          {title}
        </AppText>
        {description ? (
          <AppText color="textMuted" variant="caption">
            {description}
          </AppText>
        ) : null}
      </Stack>
      {busy ? <ActivityIndicator color={theme.colors.primary} size="small" /> : null}
      {right}
      {onPress && !right && !busy ? (
        <Icon
          color="textMuted"
          name={isRTL ? 'chevron-back' : 'chevron-forward'}
          size={theme.sizes.iconSm}
        />
      ) : null}
    </Row>
  );

  if (!onPress) {
    return (
      <View
        accessibilityHint={accessibilityHint ?? description}
        accessibilityLabel={accessibilityLabel}
        accessible={Boolean(accessibilityLabel)}
        testID={testID}
      >
        {content(false)}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint ?? description}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onPress={onPress}
      testID={testID}
      style={styles.pressable}
    >
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pressable: {
    minHeight: 56,
  },
  row: {
    minHeight: 56,
    paddingHorizontal: 12,
  },
  text: {
    flex: 1,
  },
});
