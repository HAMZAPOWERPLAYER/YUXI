import { memo, useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { useAppTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';

export type WavePatternProps = {
  color?: keyof ColorTokens;
  height?: number;
  /** 0.04–0.06 is the intended range. */
  opacity?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const WAVE_PATHS = [
  // Upper row: one scallop centred in the 80×80 tile.
  'M0 40 A40 40 0 0 1 80 40',
  'M10 40 A30 30 0 0 1 70 40',
  'M20 40 A20 20 0 0 1 60 40',
  'M30 40 A10 10 0 0 1 50 40',
  // Lower row: two half-scallops that join across tile edges.
  'M-40 80 A40 40 0 0 1 40 80',
  'M-30 80 A30 30 0 0 1 30 80',
  'M-20 80 A20 20 0 0 1 20 80',
  'M-10 80 A10 10 0 0 1 10 80',
  'M40 80 A40 40 0 0 1 120 80',
  'M50 80 A30 30 0 0 1 110 80',
  'M60 80 A20 20 0 0 1 100 80',
  'M70 80 A10 10 0 0 1 90 80',
] as const;

/**
 * Static seigaiha-style line texture. Use it only behind hero content, never
 * behind long text lists, and never animate it. The SVG is memoised so a hero
 * re-render does not rebuild the pattern.
 */
export const WavePattern = memo(function WavePattern({
  color = 'text',
  height = 160,
  opacity = 0.05,
  style,
  testID,
}: WavePatternProps) {
  const theme = useAppTheme();
  const rawId = useId();
  const patternId = `seigaiha-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[{ height }, styles.base, style]}
      testID={testID}
    >
      <Svg height="100%" width="100%">
        <Defs>
          <Pattern height={80} id={patternId} patternUnits="userSpaceOnUse" width={80} x={0} y={0}>
            {WAVE_PATHS.map((path) => (
              <Path
                d={path}
                fill="none"
                key={path}
                stroke={theme.colors[color]}
                strokeOpacity={opacity}
                strokeWidth={1.5}
              />
            ))}
          </Pattern>
        </Defs>
        <Rect fill={`url(#${patternId})`} height="100%" width="100%" x="0" y="0" />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
