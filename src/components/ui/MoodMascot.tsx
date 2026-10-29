import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Mascot } from '@/components/Mascot';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { MascotExpression } from '@/theme/mascot';

export type MoodMascotMood =
  'idle' | 'loading' | 'correct' | 'wrong' | 'empty' | 'success' | 'streak' | 'encourage';

const MOOD_EXPRESSIONS: Record<MoodMascotMood, MascotExpression> = {
  idle: 'calm',
  loading: 'thinking',
  correct: 'happy',
  wrong: 'encourage',
  empty: 'sleepy',
  success: 'cheer',
  streak: 'cheer',
  encourage: 'encourage',
};

export function mascotExpressionForMood(mood: MoodMascotMood): MascotExpression {
  return MOOD_EXPRESSIONS[mood];
}

type FadeInMascotProps = {
  expression: MascotExpression;
  size: number;
  decorative: boolean;
  accessibilityLabel?: string;
};

/**
 * Remounted whenever the expression changes. The new image fades in over
 * 150ms from the surrounding surface, which avoids the ghosting of a true
 * two-layer crossfade when the poses differ. Reduce motion draws it at once.
 */
function FadeInMascot({ expression, size, decorative, accessibilityLabel }: FadeInMascotProps) {
  const theme = useAppTheme();
  const [opacity] = useState(() => new Animated.Value(theme.reduceMotion ? 1 : 0));

  useEffect(() => {
    if (theme.reduceMotion) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [opacity, theme.reduceMotion]);

  return (
    <Animated.View style={{ opacity }}>
      <Mascot
        accessibilityLabel={accessibilityLabel}
        decorative={decorative}
        expression={expression}
        size={size}
      />
    </Animated.View>
  );
}

export type MoodMascotProps = {
  mood?: MoodMascotMood;
  /** Explicit expression wins over the mood mapping. */
  expression?: MascotExpression;
  size?: number;
  decorative?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Companion image that fades in when the expression changes. */
export function MoodMascot({
  mood = 'idle',
  expression,
  size = 120,
  decorative = true,
  accessibilityLabel,
  style,
  testID,
}: MoodMascotProps) {
  const target = expression ?? mascotExpressionForMood(mood);

  return (
    <View style={[{ height: size, width: size }, styles.wrap, style]} testID={testID}>
      <FadeInMascot
        accessibilityLabel={accessibilityLabel}
        decorative={decorative}
        expression={target}
        key={target}
        size={size}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
