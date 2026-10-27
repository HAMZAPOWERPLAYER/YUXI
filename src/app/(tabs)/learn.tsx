import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { MascotBubble } from '@/components/MascotBubble';
import { ProgressBar } from '@/components/ProgressBar';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { Stack } from '@/components/Stack';
import { buildMasteryBreakdown } from '@/features/kana/mastery';
import { getByScript } from '@/features/kana/selectors';
import { useT } from '@/i18n';
import { useProgress } from '@/providers/useProgress';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { KanaScript } from '@/types/kana';

const SCRIPTS: readonly KanaScript[] = ['hiragana', 'katakana'];
const SAMPLE_COUNT = 8;

function titleKey(script: KanaScript): 'learn.hiragana' | 'learn.katakana' {
  return script === 'hiragana' ? 'learn.hiragana' : 'learn.katakana';
}

export default function LearnScreen() {
  const t = useT();
  const theme = useAppTheme();
  const { progress } = useProgress();

  return (
    <Screen>
      <Stack gap={theme.spacing.lg}>
        <Stack gap={2}>
          <AppText variant="title">{t('learn.title')}</AppText>
          <AppText color="textMuted" variant="body">
            {t('learn.subtitle')}
          </AppText>
        </Stack>

        {SCRIPTS.map((script) => {
          const pool = getByScript(script);
          const mastery = buildMasteryBreakdown(pool, progress);
          const percent = Math.round(mastery.strongRatio * 100);
          const title = t(titleKey(script));

          return (
            <Pressable
              accessibilityHint={t('learn.open', { script: title })}
              accessibilityLabel={`${title}. ${t('learn.mastery', { percent })}`}
              accessibilityRole="button"
              key={script}
              onPress={() => router.push(`/learn/${script}`)}
              style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
            >
              <Card>
                <Stack gap={theme.spacing.sm}>
                  <Row align="center" justify="between">
                    <Row align="center" gap={theme.spacing.sm}>
                      <View
                        style={[
                          styles.badgeGlyph,
                          {
                            backgroundColor: theme.colors.surface2,
                            borderRadius: theme.radii.md,
                          },
                        ]}
                      >
                        <AppText variant="kanaLarge">{pool[0]?.kana ?? ''}</AppText>
                      </View>
                      <Stack gap={2}>
                        <AppText variant="heading">{title}</AppText>
                        <AppText color="textMuted" variant="caption">
                          {t('common.ofTotal', {
                            current: mastery.studied,
                            total: mastery.total,
                          })}
                        </AppText>
                      </Stack>
                    </Row>
                    <Icon color="textMuted" name="chevron-forward" size={20} />
                  </Row>

                  <Row gap={6} justify="start" wrap>
                    {pool.slice(0, SAMPLE_COUNT).map((kana) => (
                      <View
                        key={kana.id}
                        style={[
                          styles.sample,
                          {
                            backgroundColor: theme.colors.surface2,
                            borderRadius: theme.radii.sm,
                          },
                        ]}
                      >
                        <AppText variant="kana">{kana.kana}</AppText>
                      </View>
                    ))}
                  </Row>

                  <ProgressBar
                    accessibilityLabel={t('learn.mastery', { percent })}
                    progress={mastery.strongRatio}
                  />
                  <Row justify="between">
                    <AppText color="textMuted" variant="caption">
                      {t('learn.mastery', { percent })}
                    </AppText>
                    <AppText color="primaryText" variant="label">
                      {t('learn.open', { script: title })}
                    </AppText>
                  </Row>
                </Stack>
              </Card>
            </Pressable>
          );
        })}

        <MascotBubble compact expression="thinking" message={t('learn.hint')} />
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badgeGlyph: {
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  sample: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});
