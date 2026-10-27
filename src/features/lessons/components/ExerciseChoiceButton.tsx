import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { useAppTheme } from '@/theme/ThemeProvider';

export type ExerciseChoiceState = 'idle' | 'selected' | 'correct' | 'wrong' | 'muted';

export type ExerciseChoiceButtonProps = {
  label: string;
  caption?: string;
  japanese?: boolean;
  state: ExerciseChoiceState;
  disabled: boolean;
  accessibilityLabel: string;
  onPress: () => void;
};

const backgrounds: Record<
  ExerciseChoiceState,
  'surface' | 'primarySoft' | 'successSoft' | 'dangerSoft' | 'surface2'
> = {
  idle: 'surface',
  selected: 'primarySoft',
  correct: 'successSoft',
  wrong: 'dangerSoft',
  muted: 'surface2',
};

const borders: Record<ExerciseChoiceState, 'border' | 'primary' | 'success' | 'danger'> = {
  idle: 'border',
  selected: 'primary',
  correct: 'success',
  wrong: 'danger',
  muted: 'border',
};

/** Shared option tile for choice and particle exercises. */
export function ExerciseChoiceButton({
  label,
  caption,
  japanese = false,
  state,
  disabled,
  accessibilityLabel,
  onPress,
}: ExerciseChoiceButtonProps) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{
        disabled,
        selected: state === 'selected' || state === 'correct',
      }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed ? { opacity: 0.78 } : null]}
    >
      <View
        style={[
          styles.option,
          {
            backgroundColor: theme.colors[backgrounds[state]],
            borderColor: theme.colors[borders[state]],
            borderRadius: theme.radii.md,
            opacity: state === 'muted' ? 0.62 : 1,
          },
        ]}
      >
        <AppText
          align="center"
          lang={japanese ? 'ja' : 'auto'}
          variant={japanese ? 'kanaLarge' : 'bodyStrong'}
        >
          {label}
        </AppText>
        {caption ? (
          <AppText
            align="center"
            color="textMuted"
            lang={japanese ? 'ja' : 'auto'}
            variant="caption"
          >
            {caption}
          </AppText>
        ) : null}
        {state === 'correct' ? (
          <View style={styles.icon}>
            <Icon color="success" name="checkmark-circle" size={18} />
          </View>
        ) : null}
        {state === 'wrong' ? (
          <View style={styles.icon}>
            <Icon color="danger" name="close-circle" size={18} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 64,
  },
  option: {
    alignItems: 'center',
    borderWidth: 1.5,
    flex: 1,
    justifyContent: 'center',
    minHeight: 64,
    paddingHorizontal: 10,
    paddingVertical: 10,
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    top: 5,
    end: 5,
  },
});
