import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';
import { Row } from './Row';

export type SegmentedOption<T extends string | number> = {
  value: T;
  label: string;
  disabled?: boolean;
};

export type SegmentedProps<T extends string | number> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  disabled?: boolean;
};

/** Logical segmented control used for language, goal, script and length. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  disabled = false,
}: SegmentedProps<T>) {
  const theme = useAppTheme();

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="radiogroup"
      style={[
        styles.track,
        {
          backgroundColor: theme.colors.surface2,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.md,
          opacity: disabled ? 0.55 : 1,
          padding: 4,
        },
      ]}
    >
      <Row gap={4}>
        {options.map((option) => {
          const selected = option.value === value;
          const optionDisabled = disabled || option.disabled === true;
          return (
            <Pressable
              accessibilityLabel={option.label}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: optionDisabled }}
              disabled={optionDisabled}
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: selected ? theme.colors.surface : theme.colors.transparent,
                  borderColor: selected ? theme.colors.border : theme.colors.transparent,
                  borderRadius: theme.radii.sm,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <AppText
                align="center"
                color={selected ? 'text' : 'textMuted'}
                numberOfLines={1}
                variant={selected ? 'bodyStrong' : 'label'}
              >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderWidth: 1,
    width: '100%',
  },
  option: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
});
