import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';

import { IconButton } from './IconButton';
import { Row } from './Row';

export type TextSizeSliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

export const TEXT_SIZE_MIN = 0.8;
export const TEXT_SIZE_MAX = 1.6;
export const TEXT_SIZE_STEP = 0.1;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** Custom, dependency-free slider with accessible increment/decrement actions. */
export function TextSizeSlider({
  value,
  onChange,
  min = TEXT_SIZE_MIN,
  max = TEXT_SIZE_MAX,
  step = TEXT_SIZE_STEP,
}: TextSizeSliderProps) {
  const theme = useAppTheme();
  const t = useT();
  const [trackWidth, setTrackWidth] = useState(0);
  const ratio = clamp((value - min) / (max - min), 0, 1);
  const percent = Math.round(value * 100);
  const knobSize = 24;
  const knobTravel = Math.max(0, trackWidth - knobSize);

  const commit = (next: number) => {
    const clamped = clamp(roundToStep(next, step), min, max);
    onChange(Number(clamped.toFixed(2)));
  };

  return (
    <Row align="center" gap={theme.spacing.xs}>
      <IconButton
        accessibilityLabel={t('a11y.decreaseTextSize')}
        disabled={value <= min}
        filled={false}
        icon="remove"
        onPress={() => commit(value - step)}
        size={20}
      />
      <Pressable
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        accessibilityLabel={t('a11y.textSizeSlider')}
        accessibilityRole="adjustable"
        accessibilityValue={{
          max: Math.round(max * 100),
          min: Math.round(min * 100),
          now: percent,
          text: t('settings.textSizeValue', { percent }),
        }}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'increment') commit(value + step);
          if (event.nativeEvent.actionName === 'decrement') commit(value - step);
        }}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        onPress={(event) => {
          if (trackWidth <= 0) return;
          const nextRatio = clamp(event.nativeEvent.locationX / trackWidth, 0, 1);
          commit(min + nextRatio * (max - min));
        }}
        style={styles.touchArea}
      >
        <View style={[styles.track, { backgroundColor: theme.colors.surface2 }]}>
          <View
            style={[
              styles.fill,
              {
                backgroundColor: theme.colors.primary,
                width: `${ratio * 100}%`,
              },
            ]}
          />
        </View>
        <View
          style={[
            styles.knob,
            {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.background,
              height: knobSize,
              left: ratio * knobTravel,
              width: knobSize,
            },
          ]}
        />
      </Pressable>
      <IconButton
        accessibilityLabel={t('a11y.increaseTextSize')}
        disabled={value >= max}
        filled={false}
        icon="add"
        onPress={() => commit(value + step)}
        size={20}
      />
    </Row>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: 8,
  },
  knob: {
    borderRadius: 999,
    borderWidth: 2,
    position: 'absolute',
    top: 8,
  },
});
