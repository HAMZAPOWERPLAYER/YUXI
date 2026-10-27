import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';

export type ProgressBarProps = {
  /** 0–1. Values outside are clamped. */
  progress: number;
  color?: keyof ColorTokens;
  height?: number;
  accessibilityLabel?: string;
};

export function ProgressBar({
  progress,
  color = 'primary',
  height = 8,
  accessibilityLabel,
}: ProgressBarProps) {
  const theme = useAppTheme();
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ max: 100, min: 0, now: Math.round(clamped * 100) }}
      style={[styles.track, { backgroundColor: theme.colors.surface2, height }]}
    >
      <View
        style={{
          backgroundColor: theme.colors[color],
          borderRadius: height / 2,
          height,
          width: `${clamped * 100}%`,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
  },
});
