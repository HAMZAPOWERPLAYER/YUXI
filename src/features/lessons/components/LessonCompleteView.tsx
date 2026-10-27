import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { MascotBubble } from '@/components/MascotBubble';
import { Row } from '@/components/Row';
import { Stack } from '@/components/Stack';
import { StatTile } from '@/components/StatTile';
import { useDirection, useT } from '@/i18n';
import type { LessonStats } from '@/features/lessons/session';
import { useAppTheme } from '@/theme/ThemeProvider';

export type LessonCompleteViewProps = {
  lessonTitle: string;
  stats: LessonStats;
  xp: number;
  saveError: boolean;
  onBackToUnit: () => void;
  onRepeat: () => void;
};

export function LessonCompleteView({
  lessonTitle,
  stats,
  xp,
  saveError,
  onBackToUnit,
  onRepeat,
}: LessonCompleteViewProps) {
  const t = useT();
  const theme = useAppTheme();
  const { isRTL } = useDirection();
  const percent = Math.round(stats.accuracy * 100);

  return (
    <Stack gap={theme.spacing.lg}>
      <MascotBubble
        expression="cheer"
        message={t('lesson.completeBody', { lesson: lessonTitle })}
        title={t('lesson.completeTitle')}
      />

      <Row gap={theme.spacing.sm} wrap>
        <StatTile
          color="success"
          icon="checkmark-circle"
          label={t('lesson.score')}
          subtitle={t('summary.correctCount', {
            correct: stats.correct,
            total: stats.answered,
          })}
          value={`${percent}%`}
        />
        <StatTile
          color="primaryText"
          icon="sparkles"
          label={t('lesson.xpEarned')}
          value={`${xp}`}
        />
      </Row>

      {saveError ? (
        <AppText color="warning" variant="caption">
          {t('lesson.saveError')}
        </AppText>
      ) : null}

      <Stack gap={theme.spacing.sm}>
        <Button
          icon={isRTL ? 'arrow-forward' : 'arrow-back'}
          label={t('lesson.backToUnit')}
          onPress={onBackToUnit}
        />
        <Button icon="refresh" label={t('lesson.repeat')} onPress={onRepeat} variant="secondary" />
      </Stack>
    </Stack>
  );
}
