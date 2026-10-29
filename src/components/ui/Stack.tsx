import { type PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useDirection } from '@/i18n';

export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

export type StackProps = ViewProps & {
  gap?: number;
  align?: StackAlign;
  justify?: StackJustify;
};

const justifyMap = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
} as const;

/**
 * Logical vertical stack. Horizontal alignment is mirrored for RTL because
 * we deliberately avoid I18nManager.forceRTL (which requires an app restart).
 */
export function Stack({
  gap,
  align = 'stretch',
  justify = 'start',
  style,
  children,
  ...rest
}: PropsWithChildren<StackProps>) {
  const { isRTL } = useDirection();

  const alignItems =
    align === 'stretch'
      ? 'stretch'
      : align === 'center'
        ? 'center'
        : align === 'start'
          ? isRTL
            ? 'flex-end'
            : 'flex-start'
          : isRTL
            ? 'flex-start'
            : 'flex-end';

  return (
    <View
      {...rest}
      style={[styles.base, { alignItems, gap, justifyContent: justifyMap[justify] }, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'column',
  },
});
