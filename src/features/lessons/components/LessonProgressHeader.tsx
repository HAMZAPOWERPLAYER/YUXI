import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { Row } from '@/components/Row';
import { Stack } from '@/components/Stack';
import { useT } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';

export type LessonProgressHeaderProps = {
  current: number;
  total: number;
  onQuit: () => void;
};

/** Quit control, question counter and progress bar for a lesson run. */
export function LessonProgressHeader({ current, total, onQuit }: LessonProgressHeaderProps) {
  const t = useT();
  const theme = useAppTheme();
  const progress = total === 0 ? 0 : current / total;

  return (
    <Stack gap={theme.spacing.xs}>
      <Row align="center" justify="between">
        <Button
          fullWidth={false}
          icon="close"
          label={t('lesson.quit')}
          onPress={onQuit}
          size="sm"
          variant="ghost"
        />
        <AppText color="textMuted" variant="label">
          {t('lesson.questionOf', { current, total })}
        </AppText>
      </Row>
      <ProgressBar
        accessibilityLabel={t('lesson.questionOf', { current, total })}
        progress={progress}
      />
    </Stack>
  );
}
