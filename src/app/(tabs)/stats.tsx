import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Stack } from '@/components/Stack';
import { ErrorState, LoadingState } from '@/components/StateViews';
import { StatTile } from '@/components/StatTile';
import { masteryFor } from '@/features/kana/mastery';
import { getByScript } from '@/features/kana/selectors';
import {
  buildActivitySeries,
  hasAnyActivity,
  totalQuestions,
  totalSeconds,
} from '@/features/stats';
import { useT } from '@/i18n';
import { useProgress } from '@/providers/useProgress';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { MasteryLevel } from '@/theme/tokens';
import type { KanaScript } from '@/types/kana';
import { minutesFromSeconds } from '@/utils/date';

const LEVEL_COLORS: Record<
  MasteryLevel,
  'masteryUnseen' | 'masteryLearning' | 'masteryFamiliar' | 'masteryMastered'
> = {
  unseen: 'masteryUnseen',
  learning: 'masteryLearning',
  familiar: 'masteryFamiliar',
  mastered: 'masteryMastered',
};

const LEVEL_KEYS: Record<
  MasteryLevel,
  'stats.legendUnseen' | 'stats.legendLearning' | 'stats.legendFamiliar' | 'stats.legendMastered'
> = {
  unseen: 'stats.legendUnseen',
  learning: 'stats.legendLearning',
  familiar: 'stats.legendFamiliar',
  mastered: 'stats.legendMastered',
};

const SCRIPTS: readonly KanaScript[] = ['hiragana', 'katakana'];

export default function StatsScreen() {
  const t = useT();
  const theme = useAppTheme();
  const progress = useProgress();
  const { accuracy7, accuracy30, level, stats, streak, today, totalXp } = progress;

  const activity = useMemo(() => buildActivitySeries(stats, today, 14), [stats, today]);
  const active = hasAnyActivity(stats);
  const minutes = minutesFromSeconds(totalSeconds(stats));
  const questions = totalQuestions(stats);

  if (progress.status === 'loading') {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (progress.status === 'error') {
    return (
      <Screen>
        <ErrorState body={t('errors.loadBody')} onAction={() => void progress.refresh()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack gap={theme.spacing.lg}>
        <Stack gap={2}>
          <AppText variant="title">{t('stats.title')}</AppText>
          <AppText color="textMuted" variant="body">
            {t('home.subtitle')}
          </AppText>
        </Stack>

        {!active ? (
          <Card>
            <Stack align="center" gap={theme.spacing.sm}>
              <AppText align="center" color="textMuted" variant="body">
                {t('stats.noData')}
              </AppText>
              <Button
                icon="school"
                label={t('stats.startPractice')}
                onPress={() => router.navigate('/(tabs)/practice')}
              />
            </Stack>
          </Card>
        ) : (
          <>
            <Row gap={theme.spacing.sm} wrap>
              <StatTile
                color="primaryText"
                icon="star"
                label={t('stats.totalXp')}
                value={String(totalXp)}
              />
              <StatTile
                color="text"
                icon="shield-checkmark-outline"
                label={t('stats.level')}
                value={String(level.level)}
              />
              <StatTile
                color="warning"
                icon="flame"
                label={t('stats.currentStreak')}
                value={t('stats.streakValue', { count: streak.current })}
              />
              <StatTile
                color="warning"
                icon="trophy-outline"
                label={t('stats.bestStreak')}
                value={t('stats.streakValue', { count: streak.longest })}
              />
              <StatTile
                color="success"
                icon="checkmark-circle-outline"
                label={t('stats.accuracy7')}
                value={t('common.percent', { percent: Math.round(accuracy7 * 100) })}
              />
              <StatTile
                color="success"
                icon="analytics-outline"
                label={t('stats.accuracy30')}
                value={t('common.percent', { percent: Math.round(accuracy30 * 100) })}
              />
              <StatTile
                color="text"
                icon="time-outline"
                label={t('stats.timePracticed')}
                value={t('stats.minutes', { count: minutes })}
              />
              <StatTile
                color="text"
                icon="help-circle-outline"
                label={t('stats.questions')}
                value={String(questions)}
              />
            </Row>

            <Card>
              <Stack gap={theme.spacing.sm}>
                <SectionHeader subtitle={t('stats.activitySubtitle')} title={t('stats.activity')} />
                <Row align="end" gap={4} style={styles.chart}>
                  {activity.map((day) => (
                    <View
                      accessibilityLabel={t('stats.dayMinutes', {
                        day: day.day,
                        minutes: day.minutes,
                      })}
                      accessible
                      key={day.day}
                      style={styles.barColumn}
                    >
                      <View
                        style={[
                          styles.bar,
                          {
                            backgroundColor: day.isToday
                              ? theme.colors.primary
                              : theme.colors.masteryLearning,
                            height: Math.max(3, Math.round(day.ratio * 76)),
                            opacity: day.secondsActive > 0 ? 1 : 0.22,
                          },
                        ]}
                      />
                    </View>
                  ))}
                </Row>
                <Row justify="between">
                  <AppText color="textMuted" variant="caption">
                    {activity[0]?.day.slice(5) ?? ''}
                  </AppText>
                  <AppText color="textMuted" variant="caption">
                    {t('common.today')}
                  </AppText>
                </Row>
                {activity.every((day) => day.secondsActive === 0) ? (
                  <AppText color="textMuted" variant="caption">
                    {t('stats.activityEmpty')}
                  </AppText>
                ) : null}
              </Stack>
            </Card>

            <Card>
              <Stack gap={theme.spacing.sm}>
                <SectionHeader subtitle={t('stats.heatmapSubtitle')} title={t('stats.heatmap')} />
                {SCRIPTS.map((script) => (
                  <Stack gap={theme.spacing.xxs} key={script}>
                    <AppText color="textMuted" variant="caption">
                      {script === 'hiragana' ? t('learn.hiragana') : t('learn.katakana')}
                    </AppText>
                    <View style={styles.heatmap}>
                      {getByScript(script).map((kana) => {
                        const levelKey = masteryFor(progress.progressById.get(kana.id));
                        return (
                          <View
                            accessibilityLabel={t('a11y.masteryCell', {
                              kana: kana.kana,
                              level: t(LEVEL_KEYS[levelKey]),
                            })}
                            accessible
                            key={kana.id}
                            style={[
                              styles.heatCell,
                              { backgroundColor: theme.colors[LEVEL_COLORS[levelKey]] },
                            ]}
                          />
                        );
                      })}
                    </View>
                  </Stack>
                ))}
                <Row gap={theme.spacing.sm} justify="start" wrap>
                  {(Object.keys(LEVEL_KEYS) as MasteryLevel[]).map((levelKey) => (
                    <Row align="center" gap={4} key={levelKey}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: theme.colors[LEVEL_COLORS[levelKey]] },
                        ]}
                      />
                      <AppText color="textMuted" variant="caption">
                        {t(LEVEL_KEYS[levelKey])}
                      </AppText>
                    </Row>
                  ))}
                </Row>
              </Stack>
            </Card>
          </>
        )}
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chart: {
    height: 92,
    paddingTop: 8,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 3,
    minWidth: 4,
    width: '68%',
  },
  heatmap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  heatCell: {
    borderRadius: 2,
    height: 14,
    width: 14,
  },
  legendDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
});
