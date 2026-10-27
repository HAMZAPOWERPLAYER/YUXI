import { router } from 'expo-router';
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
import { localizedDescription, localizedTitle } from '@/features/lessons/labels';
import type { UnitStatus } from '@/features/lessons';
import { useI18n, useT } from '@/i18n';
import { useProgress } from '@/providers/useProgress';
import { useAppTheme } from '@/theme/ThemeProvider';

const STATUS_VARIANT: Record<UnitStatus, BadgeVariant> = {
  completed: 'success',
  available: 'primary',
  locked: 'neutral',
};

export default function CourseScreen() {
  const t = useT();
  const theme = useAppTheme();
  const { language } = useI18n();
  const { lessonProgress, status, refresh } = useProgress();
  const content = useMemo(() => loadCourseContent(), []);

  const overviews = useMemo(
    () => buildCourseOverview(content.units, lessonProgress),
    [content.units, lessonProgress],
  );

  const header = <ScreenHeader back subtitle={t('course.subtitle')} title={t('course.title')} />;

  if (content.error) {
    return (
      <Screen header={header}>
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
      <Screen header={header}>
        <LoadingState />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen header={header}>
        <ErrorState onAction={() => void refresh()} />
      </Screen>
    );
  }

  if (overviews.length === 0) {
    return (
      <Screen header={header}>
        <EmptyState
          actionLabel={t('course.emptyCta')}
          body={t('course.emptyBody')}
          onAction={() => router.replace('/(tabs)/learn')}
          title={t('course.emptyTitle')}
        />
      </Screen>
    );
  }

  return (
    <Screen header={header}>
      <Stack gap={theme.spacing.md}>
        {overviews.map((unit) => {
          const title = localizedTitle(unit.file.unit, language);
          const description = localizedDescription(unit.file.unit, language);
          const locked = unit.status === 'locked';
          const statusLabel =
            unit.status === 'completed'
              ? t('course.unitComplete')
              : locked
                ? t('course.unitLocked')
                : t('unit.available');
          const requiredId = unit.file.unit.unlock.requiresUnitId;
          const required = requiredId
            ? overviews.find((entry) => entry.file.unit.id === requiredId)
            : undefined;
          const requiredTitle = required ? localizedTitle(required.file.unit, language) : '';

          return (
            <Card
              accessibilityHint={locked ? t('course.lockedHint') : t('course.open')}
              accessibilityLabel={`${title}. ${statusLabel}. ${t('course.completedOf', {
                completed: unit.completedLessons,
                total: unit.totalLessons,
              })}`}
              key={unit.file.unit.id}
              onPress={locked ? undefined : () => router.push(`/course/${unit.file.unit.id}`)}
              style={locked ? styles.lockedCard : undefined}
            >
              <Stack gap={theme.spacing.sm}>
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
                      {unit.file.unit.order}
                    </AppText>
                  </View>

                  <Stack gap={2} style={styles.flex}>
                    <Row align="center" gap={theme.spacing.xs} justify="between">
                      <AppText numberOfLines={2} style={styles.flex} variant="heading">
                        {title}
                      </AppText>
                      <Badge label={statusLabel} variant={STATUS_VARIANT[unit.status]} />
                    </Row>
                    <AppText color="textMuted" variant="caption">
                      {description}
                    </AppText>
                  </Stack>
                </Row>

                {locked ? (
                  <Row align="center" gap={6}>
                    <Icon color="textMuted" name="lock-closed" size={16} />
                    <AppText color="textMuted" style={styles.flex} variant="caption">
                      {requiredTitle
                        ? t('course.unlockPrevious', { unit: requiredTitle })
                        : t('course.lockedHint')}
                    </AppText>
                  </Row>
                ) : null}

                <ProgressBar
                  accessibilityLabel={t('course.completedOf', {
                    completed: unit.completedLessons,
                    total: unit.totalLessons,
                  })}
                  progress={unit.progressRatio}
                />

                <Row align="center" justify="between">
                  <AppText color="textMuted" variant="caption">
                    {t('course.completedOf', {
                      completed: unit.completedLessons,
                      total: unit.totalLessons,
                    })}
                  </AppText>
                  <AppText color="textMuted" variant="caption">
                    {t('course.lessonCount', { count: unit.totalLessons })}
                  </AppText>
                </Row>
              </Stack>
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
