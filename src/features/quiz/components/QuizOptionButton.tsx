import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, type AppTextLang } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { useAppTheme } from '@/theme/ThemeProvider';

export type OptionState = 'idle' | 'correct' | 'wrong' | 'muted';

export type QuizOptionButtonProps = {
  label: string;
  lang: AppTextLang;
  state: OptionState;
  disabled: boolean;
  accessibilityLabel: string;
  onPress: () => void;
};

const backgrounds: Record<OptionState, 'surface' | 'successSoft' | 'dangerSoft' | 'surface2'> = {
  idle: 'surface',
  correct: 'successSoft',
  wrong: 'dangerSoft',
  muted: 'surface2',
};

const borders: Record<OptionState, 'border' | 'success' | 'danger' | 'border'> = {
  idle: 'border',
  correct: 'success',
  wrong: 'danger',
  muted: 'border',
};

export function QuizOptionButton({
  label,
  lang,
  state,
  disabled,
  accessibilityLabel,
  onPress,
}: QuizOptionButtonProps) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: state === 'correct' }}
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
        <AppText align="center" lang={lang} variant={lang === 'ja' ? 'kanaLarge' : 'heading'}>
          {label}
        </AppText>
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
    minHeight: 68,
  },
  option: {
    alignItems: 'center',
    borderWidth: 1.5,
    flex: 1,
    justifyContent: 'center',
    minHeight: 68,
    paddingHorizontal: 8,
    paddingVertical: 10,
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
});
