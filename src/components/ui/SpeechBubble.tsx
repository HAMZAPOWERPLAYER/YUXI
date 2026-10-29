import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useDirection } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';

import { AppText, type AppTextLang } from './AppText';

export type SpeechBubbleTail = 'start' | 'end' | 'none';

export type SpeechBubbleProps = {
  message: string;
  lang?: AppTextLang;
  tail?: SpeechBubbleTail;
  maxLines?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * RTL-aware speech bubble. `tail="start"` points toward the speaker at the
 * inline-start edge, which is the right edge in Urdu and the left edge in
 * English. The tail is mirrored, the Japanese/Urdu text is not.
 */
export function SpeechBubble({
  message,
  lang = 'auto',
  tail = 'start',
  maxLines = 2,
  style,
  testID,
}: SpeechBubbleProps) {
  const theme = useAppTheme();
  const { isRTL } = useDirection();
  const tailSide =
    tail === 'none'
      ? null
      : tail === 'start'
        ? isRTL
          ? 'right'
          : 'left'
        : isRTL
          ? 'left'
          : 'right';

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      style={[
        styles.bubble,
        {
          backgroundColor: theme.colors.surface2,
          borderColor: theme.colors.borderStrong,
          borderRadius: theme.radii.lg,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
        },
        style,
      ]}
      testID={testID}
    >
      <AppText ellipsizeMode="tail" lang={lang} numberOfLines={maxLines} variant="body">
        {message}
      </AppText>
      {tailSide ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.tail,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.borderStrong,
              bottom: 10,
              [tailSide]: -5,
            },
          ]}
          testID={testID ? `${testID}-tail` : undefined}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignSelf: 'stretch',
    borderWidth: 1,
    maxWidth: 360,
  },
  tail: {
    borderWidth: 1,
    height: 12,
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
    width: 12,
  },
});
