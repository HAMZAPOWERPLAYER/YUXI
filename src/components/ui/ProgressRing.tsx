import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useDirection } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';
import { motion } from '@/theme/tokens';

import { clampProgress } from './progress';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type ProgressRingProps = {
  /** 0–1. Values outside are clamped. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  accessibilityLabel?: string;
  children?: ReactNode;
  testID?: string;
};

/**
 * SVG progress ring. The stroke is mirrored in Urdu so progress travels in the
 * reading direction, while children (the value label) stay unmirrored.
 */
export function ProgressRing({
  progress,
  size = 132,
  strokeWidth = 12,
  color,
  trackColor,
  accessibilityLabel,
  children,
  testID,
}: ProgressRingProps) {
  const theme = useAppTheme();
  const { isRTL } = useDirection();
  const clamped = clampProgress(progress);
  const [animated] = useState(() => new Animated.Value(clamped));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.round(clamped * 100);

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

  const dashOffset = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ max: 100, min: 0, now: percent }}
      style={{ height: size, width: size }}
      testID={testID}
    >
      <Svg height={size} style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} width={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={trackColor ?? theme.colors.surface2}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke={color ?? theme.colors.primary}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
