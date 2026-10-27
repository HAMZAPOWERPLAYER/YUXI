import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import type { MascotExpression } from '@/theme/mascot';

import { AppText } from './AppText';
import { Mascot } from './Mascot';
import { Row } from './Row';
import { Stack } from './Stack';

export type MascotBubbleProps = {
  message: string;
  title?: string;
  expression?: MascotExpression;
  mascotSize?: number;
  compact?: boolean;
};

export function MascotBubble({
  message,
  title,
  expression = 'happy',
  mascotSize = 92,
  compact = false,
}: MascotBubbleProps) {
  const theme = useAppTheme();
  return (
    <Row align="center" gap={theme.spacing.sm}>
      <Mascot expression={expression} size={compact ? 64 : mascotSize} />
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: theme.colors.surface2,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.lg,
            padding: compact ? theme.spacing.sm : theme.spacing.md,
          },
        ]}
      >
        <Stack gap={4}>
          {title ? (
            <AppText variant="bodyStrong" color="text">
              {title}
            </AppText>
          ) : null}
          <AppText variant="body" color="text">
            {message}
          </AppText>
        </Stack>
      </View>
    </Row>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderWidth: 1,
    flex: 1,
  },
});
