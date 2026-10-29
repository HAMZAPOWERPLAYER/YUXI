import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Mascot } from '@/components/Mascot';
import { Row } from '@/components/Row';
import { Stack } from '@/components/Stack';
import { useT } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { QuizQuestion } from '@/types/quiz';

export type QuizFeedbackProps = {
  question: QuizQuestion;
  correct: boolean;
  index: number;
  saveError: boolean;
};

export function QuizFeedback({ question, correct, index, saveError }: QuizFeedbackProps) {
  const t = useT();
  const theme = useAppTheme();
  const messages = [t('quiz.correct'), t('quiz.correct2'), t('quiz.correct3')];
  const message = correct
    ? (messages[index % messages.length] ?? t('quiz.correct'))
    : t('quiz.wrong');

  return (
    <Card accessibilityLiveRegion="polite" tone={correct ? 'successSoft' : 'dangerSoft'}>
      <Stack gap={theme.spacing.xs}>
        <Row align="center" gap={theme.spacing.sm}>
          <Mascot decorative expression={correct ? 'happy' : 'thinking'} size={56} />
          <Stack gap={2} style={styles.flex}>
            <AppText color={correct ? 'success' : 'danger'} variant="bodyStrong">
              {message}
            </AppText>
            <Row align="center" gap={4} wrap>
              <AppText color="textMuted" variant="caption">
                {t('quiz.urduHint')}:
              </AppText>
              <AppText color="textMuted" lang="ur" variant="caption">
                {question.kana.urduHint}
              </AppText>
            </Row>
          </Stack>
        </Row>

        {!correct ? (
          <Row align="center" gap={6} wrap>
            <AppText color="textMuted" variant="caption">
              {t('quiz.correctAnswer')}:
            </AppText>
            <AppText lang={question.mode === 'kana-to-romaji' ? 'en' : 'ja'} variant="bodyStrong">
              {question.answer}
            </AppText>
            <AppText color="textMuted" lang="ja" variant="caption">
              ({question.kana.kana})
            </AppText>
          </Row>
        ) : null}

        {saveError ? (
          <AppText color="danger" variant="caption">
            {t('quiz.saveError')}
          </AppText>
        ) : null}
      </Stack>
    </Card>
  );
}

const styles = {
  flex: { flex: 1 },
} as const;
