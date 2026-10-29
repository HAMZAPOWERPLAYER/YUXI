import { type PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useDirection } from '@/i18n';

export type RowAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type RowJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

export type RowProps = ViewProps & {
  gap?: number;
  align?: RowAlign;
  justify?: RowJustify;
  wrap?: boolean;
  /** Flip the logical order in addition to the language direction. */
  reverse?: boolean;
  /**
   * Force left-to-right sibling order. Use for Japanese sequences (sentences,
   * kana charts) even when the surrounding UI language is Urdu.
   */
  dir?: 'auto' | 'ltr';
};

const alignMap = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
} as const;

const justifyMap = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
} as const;

/**
 * Logical row primitive. Screens must not write RTL logic by hand.
 * In Urdu the main axis is reversed, so the first child appears at the start
 * (right edge) in both languages.
 */
export function Row({
  gap,
  align = 'center',
  justify = 'start',
  wrap = false,
  reverse = false,
  dir = 'auto',
  style,
  children,
  ...rest
}: PropsWithChildren<RowProps>) {
  const { isRTL } = useDirection();
  const flip = dir === 'auto' && isRTL !== reverse;
  return (
    <View
      {...rest}
      style={[
        styles.base,
        {
          alignItems: alignMap[align],
          direction: dir === 'ltr' ? 'ltr' : undefined,
          flexDirection: flip ? 'row-reverse' : 'row',
          flexWrap: wrap ? 'wrap' : 'nowrap',
          gap,
          justifyContent: justifyMap[justify],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
  },
});
