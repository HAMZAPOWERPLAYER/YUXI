import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import type { MascotExpression } from '@/theme/mascot';

import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';
import { MoodMascot } from './MoodMascot';
import { Stack } from './Stack';

export type EmptyStateProps = {
  title: string;
  body?: string;
  expression?: MascotExpression;
  actionLabel?: string;
  actionIcon?: IconName;
  onAction?: () => void;
  testID?: string;
};

/**
 * Companion-led empty/error/success panel. Use one clear action at most; the
 * caller chooses the expression that matches the situation.
 */
export function EmptyState({
  title,
  body,
  expression = 'calm',
  actionLabel,
  actionIcon,
  onAction,
  testID,
}: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <Card padding={theme.spacing.lg} testID={testID}>
      <Stack align="center" gap={theme.spacing.md}>
        <View
          style={[
            styles.mascotFrame,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.pill,
            },
          ]}
        >
          <MoodMascot expression={expression} size={104} />
        </View>
        <Stack align="center" gap={theme.spacing.xs}>
          <AppText align="center" variant="heading">
            {title}
          </AppText>
          {body ? (
            <AppText align="center" color="textMuted" variant="body">
              {body}
            </AppText>
          ) : null}
        </Stack>
        {actionLabel && onAction ? (
          <Button icon={actionIcon} label={actionLabel} onPress={onAction} />
        ) : (
          <Icon color="textFaint" name="sparkles-outline" size={theme.sizes.iconMd} />
        )}
      </Stack>
    </Card>
  );
}

const styles = StyleSheet.create({
  mascotFrame: {
    alignItems: 'center',
    borderWidth: 1,
    height: 124,
    justifyContent: 'center',
    width: 124,
  },
});
