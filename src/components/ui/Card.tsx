import { LinearGradient } from 'expo-linear-gradient';
import { type PropsWithChildren, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { type ColorTokens, gradients, type RadiusToken } from '@/theme/tokens';

export type CardTone =
  'surface' | 'surface2' | 'primarySoft' | 'successSoft' | 'warningSoft' | 'dangerSoft';

export type CardVariant = 'default' | 'elevated' | 'hero' | 'glowAccent';

export type CardProps = {
  /** Legacy semantic tint. Ignored when a visual variant is supplied. */
  tone?: CardTone;
  variant?: CardVariant;
  radius?: RadiusToken;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  padding?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const toneColor: Record<CardTone, keyof ColorTokens> = {
  surface: 'surface',
  surface2: 'surface2',
  primarySoft: 'primarySoft',
  successSoft: 'successSoft',
  warningSoft: 'warningSoft',
  dangerSoft: 'dangerSoft',
};

export function Card({
  children,
  tone = 'surface',
  variant = 'default',
  radius = 'lg',
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityLiveRegion,
  padding,
  style,
  testID,
}: PropsWithChildren<CardProps>) {
  const theme = useAppTheme();
  const contentPadding = padding ?? theme.spacing.md;
  const isHero = variant === 'hero';
  const backgroundColor = isHero
    ? undefined
    : variant === 'elevated'
      ? theme.colors.bgElevated
      : variant === 'glowAccent'
        ? theme.colors.surface
        : theme.colors[toneColor[tone]];
  const borderColor =
    variant === 'elevated' || isHero
      ? theme.colors.borderStrong
      : variant === 'glowAccent'
        ? theme.colors.primaryDeep
        : theme.colors.border;

  const cardStyle: StyleProp<ViewStyle> = [
    styles.base,
    {
      backgroundColor,
      borderColor,
      borderRadius: theme.radii[radius],
      padding: isHero ? 0 : contentPadding,
    },
    style,
  ];

  const content = isHero ? (
    <LinearGradient
      colors={gradients.hero}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={styles.fill}
    >
      <View style={{ padding: contentPadding }}>{children}</View>
    </LinearGradient>
  ) : (
    children
  );

  const inner = (
    <>
      {variant === 'glowAccent' ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={[styles.glowRing, { borderColor: theme.colors.glow }]}
        />
      ) : null}
      {content}
    </>
  );

  if (!onPress) {
    return (
      <View
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityLiveRegion={accessibilityLiveRegion}
        accessible={Boolean(accessibilityLabel)}
        style={cardStyle}
        testID={testID}
      >
        {inner}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion={accessibilityLiveRegion}
      accessibilityRole="button"
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [cardStyle, pressed ? { opacity: 0.86 } : null]}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
  },
  glowRing: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1,
    pointerEvents: 'none',
  },
});

export type CardContent = ReactNode;
