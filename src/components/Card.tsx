import { type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';

export type CardTone =
  'surface' | 'surface2' | 'primarySoft' | 'successSoft' | 'warningSoft' | 'dangerSoft';

export type CardProps = {
  tone?: CardTone;
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
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityLiveRegion,
  padding,
  style,
  testID,
}: PropsWithChildren<CardProps>) {
  const theme = useAppTheme();
  const cardStyle: StyleProp<ViewStyle> = [
    styles.base,
    {
      backgroundColor: theme.colors[toneColor[tone]],
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      padding: padding ?? theme.spacing.md,
    },
    style,
  ];

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
        {children}
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
      style={({ pressed }) => [cardStyle, pressed ? { opacity: 0.82 } : null]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
