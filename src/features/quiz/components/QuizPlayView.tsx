import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Row } from '@/components/Row';
import { Stack } from '@/components/Stack';
import { useT } from '@/i18n';
import type { SpeakOutcome } from '@/services/tts';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { QuizQuestion } from '@/types/quiz';

import { QuizFeedback } from './QuizFeedback';
import { QuizOptionButton, type OptionState } from './QuizOptionButton';
import { QuizProgressHeader } from './QuizProgressHeader';
import { QuizPrompt } from './QuizPrompt';

export type QuizFeedbackState = {
  question: QuizQuestion;
  selectedOptionId: string;
  correct: boolean;
};

export type QuizPlayViewProps = {
  question: QuizQuestion;
  currentNumber: number;
  total: number;
  voiceAvailable: boolean;
  ttsOutcome: SpeakOutcome | null;
  feedback: QuizFeedbackState | null;
  saving: boolean;
  saveError: boolean;
  isLast: boolean;
  onQuit: () => void;
  onReplay: () => void;
  onSelectOption: (optionId: string) => void;
  onNext: () => void;
};

/** Prompt, answer grid and feedback for the active question. */
export function QuizPlayView({
  question,
  currentNumber,
  total,
  voiceAvailable,
  ttsOutcome,
  feedback,
  saving,
  saveError,
  isLast,
  onQuit,
  onReplay,
  onSelectOption,
  onNext,
}: QuizPlayViewProps) {
  const t = useT();
  const theme = useAppTheme();

  return (
    <Stack gap={theme.spacing.md}>
      <QuizProgressHeader current={currentNumber} onQuit={onQuit} total={total} />

      <QuizPrompt
        onReplay={onReplay}
        question={question}
        ttsOutcome={ttsOutcome}
        voiceAvailable={voiceAvailable}
      />

      <Row gap={theme.spacing.sm} wrap>
        {question.options.map((option) => {
          let state: OptionState = 'idle';
          if (feedback) {
            if (option.kanaId === question.correctOptionId) state = 'correct';
            else if (option.kanaId === feedback.selectedOptionId) state = 'wrong';
            else state = 'muted';
          }
          const label =
            state === 'correct'
              ? t('a11y.optionCorrect', { text: option.text })
              : state === 'wrong'
                ? t('a11y.optionWrong', { text: option.text })
                : option.text;
          return (
            <QuizOptionButton
              accessibilityLabel={label}
              disabled={feedback !== null}
              key={`${question.id}-${option.kanaId}`}
              label={option.text}
              lang={question.mode === 'kana-to-romaji' ? 'auto' : 'ja'}
              onPress={() => onSelectOption(option.kanaId)}
              state={state}
            />
          );
        })}
      </Row>

      {feedback ? (
        <Stack gap={theme.spacing.sm}>
          <QuizFeedback
            correct={feedback.correct}
            index={Math.max(0, currentNumber - 1)}
            question={feedback.question}
            saveError={saveError}
          />
          <Button
            icon={isLast ? 'flag' : 'arrow-forward'}
            iconPosition={isLast ? 'start' : 'end'}
            label={isLast ? t('quiz.finish') : t('quiz.next')}
            loading={saving}
            onPress={onNext}
          />
        </Stack>
      ) : (
        <View style={styles.hint}>
          <AppText align="center" color="textMuted" variant="caption">
            {t('quiz.questionOf', { current: currentNumber, total })}
          </AppText>
        </View>
      )}
    </Stack>
  );
}

const styles = StyleSheet.create({
  hint: {
    alignItems: 'center',
    paddingVertical: 4,
  },
});
