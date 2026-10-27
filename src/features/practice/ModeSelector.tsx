import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Icon, type IconName } from '@/components/Icon';
import { Row } from '@/components/Row';
import { Stack } from '@/components/Stack';
import type { ModeChoice } from '@/features/quiz/sessionSetup';
import { useT } from '@/i18n';
import type { TranslationKey } from '@/i18n/types';
import { useAppTheme } from '@/theme/ThemeProvider';

type ModeOption = {
  value: ModeChoice;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: IconName;
};

export const MODE_OPTIONS: readonly ModeOption[] = [
  {
    value: 'mixed',
    labelKey: 'practice.modeMixed',
    descriptionKey: 'practice.modeMixedDesc',
    icon: 'shuffle',
  },
  {
    value: 'kana-to-romaji',
    labelKey: 'practice.modeKanaToRomaji',
    descriptionKey: 'practice.modeKanaToRomajiDesc',
    icon: 'text',
  },
  {
    value: 'romaji-to-kana',
    labelKey: 'practice.modeRomajiToKana',
    descriptionKey: 'practice.modeRomajiToKanaDesc',
    icon: 'language',
  },
  {
    value: 'listening',
    labelKey: 'practice.modeListening',
    descriptionKey: 'practice.modeListeningDesc',
    icon: 'volume-high',
  },
];

export function ModeSelector({
  value,
  onSelect,
}: {
  value: ModeChoice;
  onSelect: (mode: ModeChoice) => void;
}) {
  const t = useT();
  const theme = useAppTheme();

  return (
    <Stack gap={theme.spacing.xs}>
      {MODE_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            accessibilityLabel={`${t(option.labelKey)}. ${t(option.descriptionKey)}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            key={option.value}
            onPress={() => onSelect(option.value)}
          >
            <Card tone={selected ? 'primarySoft' : 'surface'}>
              <Row align="center" gap={theme.spacing.sm}>
                <View
                  style={[
                    styles.icon,
                    {
                      backgroundColor: theme.colors.surface2,
                      borderRadius: theme.radii.sm,
                    },
                  ]}
                >
                  <Icon color="primaryText" name={option.icon} size={21} />
                </View>
                <Stack gap={1} style={styles.text}>
                  <AppText variant="bodyStrong">{t(option.labelKey)}</AppText>
                  <AppText color="textMuted" variant="caption">
                    {t(option.descriptionKey)}
                  </AppText>
                </Stack>
                {selected ? <Icon color="primaryText" name="checkmark-circle" size={22} /> : null}
              </Row>
            </Card>
          </Pressable>
        );
      })}
    </Stack>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  text: {
    flex: 1,
  },
});
