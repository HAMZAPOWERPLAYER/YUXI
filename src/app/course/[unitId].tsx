import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Badge, type BadgeVariant } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Stack } from '@/components/Stack';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { buildCourseOverview, loadCourseContent } from '@/features/lessons';
import type { LessonStatus } from '@/features/lessons';
import { localizedDescription, localizedTitle } from '@/features/lessons/labels';
import { useI18n, useT } from '@/i18n';
import { useProgress } from '@/providers/useProgress';
import { useAppTheme } from '@/theme/ThemeProvider';

const LESSON_VARIANT: Record<LessonStatus, BadgeVariant> = {
  completed: 'success',
  available: 'primary',
  locked: 'neutral',
};

export default function UnitScreen() {
  const params = useLocalSearchParams<{ unitId?: string }>();
  const t = useT();
  const theme = useAppTheme();
  const { language } = useI18n();
  const { lessonProgress, status, refresh } = useProgress();
  const content = useMemo(() => loadCourseContent(), []);

  const overviews = useMemo(
    () => buildCourseOverview(content.units, lessonProgress),
    [content.units, lessonProgress],
  );
  const unit = useMemo(
    () => overviews.find((entry) => entry.file.unit.id === params.unitId),
    [overviews, params.unitId],
  );

  if (content.error) {
    return (
      <Screen header={<ScreenHeader back title={t('course.loadErrorTitle')} />}>
        <EmptyState
          actionLabel={t('course.emptyCta')}
          body={t('course.loadErrorBody')}
          onAction={() => router.replace('/(tabs)/learn')}
          title={t('course.loadErrorTitle')}
        />
      </Screen>
    );
  }

  if (status === 'loading') {
    return (
      <Screen header={<ScreenHeader back title={t('unit.lessons')} />}>
        <LoadingState />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen header={<ScreenHeader back title={t('unit.lessons')} />}>
        <ErrorState onAction={() => void refresh()} />
      </Screen>
    );
  }

  if (!unit) {
    return (
      <Screen header={<ScreenHeader back title={t('unit.notFoundTitle')} />}>
        <EmptyState
          actionLabel={t('course.title')}
          body={t('unit.notFoundBody')}
          onAction={() => router.replace('/course')}
          title={t('unit.notFoundTitle')}
        />
      </Screen>
    );
  }

  const title = localizedTitle(unit.file.unit, language);
  const description = localizedDescription(unit.file.unit, language);
  const requiredId = unit.file.unit.unlock.requiresUnitId;
  const required = requiredId
    ? overviews.find((entry) => entry.file.unit.id === requiredId)
    : undefined;

  return (
    <Screen header={<ScreenHeader back subtitle={description} title={title} />}>
      <Stack gap={theme.spacing.md}>
        <Card>
          <Stack gap={theme.spacing.sm}>
            <Row align="center" justify="between">
              <AppText variant="bodyStrong">{t('unit.lessons')}</AppText>
              <Badge
                label={
                  unit.status === 'completed'
                    ? t('course.unitComplete')
                    : unit.status === 'locked'
                      ? t('course.unitLocked')
                      : t('unit.available')
                }
                variant={
                  unit.status === 'completed'
                    ? 'success'
                    : unit.status === 'locked'
                      ? 'neutral'
                      : 'primary'
                }
              />
            </Row>
            <ProgressBar
              accessibilityLabel={t('course.completedOf', {
                completed: unit.completedLessons,
                total: unit.totalLessons,
              })}
              progress={unit.progressRatio}
            />
            <AppText color="textMuted" variant="caption">
              {t('course.completedOf', {
                completed: unit.completedLessons,
                total: unit.totalLessons,
              })}
            </AppText>
            {unit.status === 'locked' ? (
              <Row align="center" gap={6}>
                <Icon color="textMuted" name="lock-closed" size={16} />
                <AppText color="textMuted" style={styles.flex} variant="caption">
                  {required
                    ? t('course.unlockPrevious', {
                        unit: localizedTitle(required.file.unit, language),
                      })
                    : t('course.lockedHint')}
                </AppText>
              </Row>
            ) : null}
          </Stack>
        </Card>

        {unit.lessons.map((entry) => {
          const lessonTitle = localizedTitle(entry.lesson, language);
          const locked = entry.status === 'locked';
          const statusLabel =
            entry.status === 'completed'
              ? t('unit.completed')
              : locked
                ? t('unit.locked')
                : t('unit.available');
          const accuracy = entry.accuracy === null ? null : Math.round(entry.accuracy * 100);

          return (
            <Card
              accessibilityHint={locked ? t('unit.lockedLesson') : t('unit.openLesson')}
              accessibilityLabel={`${lessonTitle}. ${statusLabel}`}
              key={entry.lesson.id}
              onPress={locked ? undefined : () => router.push(`/lesson/${entry.lesson.id}`)}
              style={locked ? styles.lockedCard : undefined}
            >
              <Row align="center" gap={theme.spacing.sm}>
                <View
                  style={[
                    styles.orderBadge,
                    {
                      backgroundColor: locked ? theme.colors.surface2 : theme.colors.primarySoft,
                      borderRadius: theme.radii.pill,
                    },
                  ]}
                >
                  <AppText color={locked ? 'textMuted' : 'primaryText'} variant="bodyStrong">
                    {entry.lesson.order}
                  </AppText>
                </View>

                <Stack gap={2} style={styles.flex}>
                  <Row align="center" gap={theme.spacing.xs} justify="between">
                    <AppText numberOfLines={2} style={styles.flex} variant="bodyStrong">
                      {lessonTitle}
                    </AppText>
                    <Badge label={statusLabel} variant={LESSON_VARIANT[entry.status]} />
                  </Row>
                  <Row align="center" gap={theme.spacing.sm}>
                    <AppText color="textMuted" variant="caption">
                      {t('course.itemCount', { count: entry.lesson.items.length })}
                    </AppText>
                    {accuracy !== null ? (
                      <AppText color="textMuted" variant="caption">
                        {t('unit.accuracy', { percent: accuracy })}
                      </AppText>
                    ) : null}
                  </Row>
                  {locked ? (
                    <AppText color="textMuted" variant="caption">
                      {t('unit.lockedLesson')}
                    </AppText>
                  ) : null}
                </Stack>

                <Icon
                  color="textMuted"
                  name={locked ? 'lock-closed' : 'chevron-forward'}
                  size={18}
                />
              </Row>
            </Card>
          );
        })}
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  lockedCard: {
    opacity: 0.72,
  },
  orderBadge: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
