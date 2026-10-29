import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useDirection } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';
import { motion, type ColorTokens } from '@/theme/tokens';

import { clampProgress } from './progress';

export type ProgressBarProps = {
  /** 0–1. Values outside are clamped. */
  progress: number;
  color?: keyof ColorTokens;
  height?: number;
  accessibilityLabel?: string;
  testID?: string;
};

/**
 * Linear progress with a 320ms fill. The width is animated on the JS driver
 * because React Native cannot drive layout width natively; it is a single bar,
 * not a list-row animation.
 */
export function ProgressBar({
  progress,
  color = 'primary',
  height = 8,
  accessibilityLabel,
  testID,
}: ProgressBarProps) {
  const theme = useAppTheme();
  const { isRTL } = useDirection();
  const clamped = clampProgress(progress);
  const [animated] = useState(() => new Animated.Value(clamped));

  useEffect(() => {
    if (theme.reduceMotion) {
      animated.setValue(clamped);
      return;
    }
    const animation = Animated.timing(animated, {
      toValue: clamped,
      duration: motion.duration.fill,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animated, clamped, theme.reduceMotion]);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ max: 100, min: 0, now: Math.round(clamped * 100) }}
      style={[
        styles.track,
        { backgroundColor: theme.colors.surface2, borderRadius: height / 2, height },
      ]}
      testID={testID}
    >
      <Animated.View
        style={{
          alignSelf: isRTL ? 'flex-end' : 'flex-start',
          backgroundColor: theme.colors[color],
          borderRadius: height / 2,
          height,
          width: animated.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
  },
});
