import { Button } from '@/components/Button';
import { AppText } from '@/components/AppText';
import { ProgressBar } from '@/components/ProgressBar';
import { Row } from '@/components/Row';
import { Stack } from '@/components/Stack';
import { useT } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';

export type QuizProgressHeaderProps = {
  current: number;
  total: number;
  onQuit: () => void;
};

export function QuizProgressHeader({ current, total, onQuit }: QuizProgressHeaderProps) {
  const t = useT();
  const theme = useAppTheme();
  const progress = total === 0 ? 0 : current / total;

  return (
    <Stack gap={theme.spacing.xs}>
      <Row align="center" justify="between">
        <Button
          fullWidth={false}
          icon="close"
          label={t('quiz.quit')}
          onPress={onQuit}
          size="sm"
          variant="ghost"
        />
        <AppText color="textMuted" variant="label">
          {t('quiz.questionOf', { current, total })}
        </AppText>
      </Row>
      <ProgressBar
        accessibilityLabel={t('quiz.questionOf', { current, total })}
        progress={progress}
      />
    </Stack>
  );
}
