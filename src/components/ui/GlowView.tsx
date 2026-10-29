import { type PropsWithChildren, useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useAppTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';

export type GlowViewProps = {
  color?: keyof ColorTokens;
  /** 0–1. The gradient fades to transparent at the edge. */
  intensity?: number;
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Static radial halo. It is an SVG gradient, not `elevation` and not a blur.
 * Use it on at most three elements per screen: the progress ring, the current
 * path node and the primary CTA / correct-answer highlight.
 */
export function GlowView({
  children,
  color = 'primary',
  intensity = 0.35,
  size,
  style,
  testID,
}: PropsWithChildren<GlowViewProps>) {
  const theme = useAppTheme();
  const rawId = useId();
  const gradientId = `glow-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const clamped = Math.max(0, Math.min(1, Number.isFinite(intensity) ? intensity : 0.35));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, size ? { height: size, width: size } : null, style]}
      testID={testID}
    >
      <Svg
        accessibilityElementsHidden
        height="100%"
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
        width="100%"
      >
        <Defs>
          <RadialGradient cx="50%" cy="50%" id={gradientId} r="50%">
            <Stop offset="0%" stopColor={theme.colors[color]} stopOpacity={clamped} />
            <Stop offset="70%" stopColor={theme.colors[color]} stopOpacity={clamped * 0.45} />
            <Stop offset="100%" stopColor={theme.colors[color]} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect fill={`url(#${gradientId})`} height="100%" width="100%" x="0" y="0" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
});
