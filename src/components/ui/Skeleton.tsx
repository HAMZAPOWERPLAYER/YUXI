import {
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';

export type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Static loading placeholder. It deliberately does not loop a shimmer: the
 * design system forbids continuous decorative animation, and reduce-motion
 * users should not lose the layout cue when animation is disabled.
 */
export function Skeleton({ width = '100%', height = 16, radius, style, testID }: SkeletonProps) {
  const theme = useAppTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          backgroundColor: theme.colors.surface2,
          borderRadius: radius ?? theme.radii.sm,
          height,
          opacity: 0.72,
          width,
        },
        styles.base,
        style,
      ]}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
