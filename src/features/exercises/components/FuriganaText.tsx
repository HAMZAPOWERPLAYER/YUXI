import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';

import { AppText, type AppTextAlign } from '@/components/AppText';
import type { FuriganaSegment } from '@/features/content';
import type { ColorTokens } from '@/theme/tokens';
import type { TextVariant } from '@/theme/typography';

import { hasFurigana, normalizeFuriganaSegments } from '../furigana';

export type FuriganaTextProps = {
  /** Base Japanese text; also the accessible label. */
  text: string;
  segments?: readonly FuriganaSegment[];
  variant?: TextVariant;
  readingVariant?: TextVariant;
  color?: keyof ColorTokens;
  readingColor?: keyof ColorTokens;
  align?: AppTextAlign;
  style?: StyleProp<TextStyle>;
  testID?: string;
};

/**
 * Renders authored furigana without parsing kanji. Readings stack above their
 * segment while the base glyphs stay on a common bottom line. Japanese text is
 * always laid out left-to-right, even when the surrounding UI is Urdu/RTL.
 */
export function FuriganaText({
  text,
  segments,
  variant = 'kana',
  readingVariant = 'caption',
  color = 'text',
  readingColor = 'textMuted',
  align = 'start',
  style,
  testID,
}: FuriganaTextProps) {
  const safeSegments = normalizeFuriganaSegments(text, segments);

  if (!hasFurigana(safeSegments)) {
    return (
      <AppText
        lang="ja"
        variant={variant}
        color={color}
        align={align}
        style={style}
        testID={testID}
      >
        {text}
      </AppText>
    );
  }

  const justifyContent =
    align === 'center' ? 'center' : align === 'end' ? 'flex-end' : 'flex-start';

  return (
    <View
      accessible
      accessibilityLabel={text}
      accessibilityRole="text"
      style={[styles.row, { justifyContent }]}
      testID={testID}
    >
      {safeSegments.map((segment, index) => (
        <View key={`${index}:${segment.text}`} style={styles.segment}>
          {segment.reading ? (
            <AppText
              lang="ja"
              variant={readingVariant}
              color={readingColor}
              align="center"
              accessible={false}
            >
              {segment.reading}
            </AppText>
          ) : null}
          <AppText
            lang="ja"
            variant={variant}
            color={color}
            align={align}
            accessible={false}
            style={style}
          >
            {segment.text}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  segment: {
    alignItems: 'center',
  },
});
