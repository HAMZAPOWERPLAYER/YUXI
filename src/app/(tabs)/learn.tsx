import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { MascotBubble } from '@/components/MascotBubble';
import { ProgressBar } from '@/components/ProgressBar';
import { Row } from '@/components/Row';
import { Screen, TAB_SCREEN_EDGES } from '@/components/Screen';
import { Stack } from '@/components/Stack';
import { buildMasteryBreakdown } from '@/features/kana/mastery';
import { getByScript } from '@/features/kana/selectors';
import { useDirection, useT } from '@/i18n';
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
  const { isRTL } = useDirection();
  const { progress } = useProgress();

  return (
    <Screen edges={TAB_SCREEN_EDGES}>
      <Stack gap={theme.spacing.lg}>
        <Stack gap={2}>
          <AppText variant="title">{t('learn.title')}</AppText>
          <AppText color="textMuted" variant="body">
            {t('learn.subtitle')}
          </AppText>
        </Stack>

        <Card
          accessibilityHint={t('course.open')}
          accessibilityLabel={t('course.title')}
          onPress={() => router.push('/course')}
        >
          <Row align="center" gap={theme.spacing.sm}>
            <View
              style={[
                styles.courseIcon,
                {
                  backgroundColor: theme.colors.primarySoft,
                  borderRadius: theme.radii.md,
                },
              ]}
            >
              <Icon color="primaryText" name="book-outline" size={24} />
            </View>
            <Stack gap={2} style={styles.flex}>
              <AppText variant="heading">{t('course.title')}</AppText>
              <AppText color="textMuted" variant="caption">
                {t('course.subtitle')}
              </AppText>
            </Stack>
            <Icon color="textMuted" name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} />
          </Row>
        </Card>

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
                    <Icon
                      color="textMuted"
                      name={isRTL ? 'chevron-back' : 'chevron-forward'}
                      size={20}
                    />
                  </Row>

                  <Row dir="ltr" gap={6} justify="start" wrap>
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
  courseIcon: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  flex: {
    flex: 1,
  },
  sample: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});
