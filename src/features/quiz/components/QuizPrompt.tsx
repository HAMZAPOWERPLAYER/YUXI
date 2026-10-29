import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Row } from '@/components/Row';
import { Stack } from '@/components/Stack';
import { useT } from '@/i18n';
import type { TranslationKey } from '@/i18n/types';
import type { SpeakOutcome } from '@/services/tts';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { QuizQuestion } from '@/types/quiz';

const MODE_KEYS: Record<QuizQuestion['mode'], TranslationKey> = {
  'kana-to-romaji': 'practice.modeKanaToRomaji',
  'romaji-to-kana': 'practice.modeRomajiToKana',
  listening: 'practice.modeListening',
};

export type QuizPromptProps = {
  question: QuizQuestion;
  voiceAvailable: boolean;
  ttsOutcome: SpeakOutcome | null;
  onReplay: () => void;
};

export function QuizPrompt({ question, voiceAvailable, ttsOutcome, onReplay }: QuizPromptProps) {
  const t = useT();
  const theme = useAppTheme();

  return (
    <Card>
      <Stack align="center" gap={theme.spacing.sm}>
        <Badge label={t(MODE_KEYS[question.mode])} variant="neutral" />

        {question.mode === 'kana-to-romaji' ? (
          <>
            <AppText align="center" lang="ja" variant="kanaHero">
              {question.prompt}
            </AppText>
            <AppText color="textMuted" variant="body">
              {t('quiz.promptKana')}
            </AppText>
          </>
        ) : null}

        {question.mode === 'romaji-to-kana' ? (
          <>
            <AppText align="center" lang="en" variant="display">
              {question.prompt}
            </AppText>
            <AppText align="center" color="textMuted" variant="body">
              {t('quiz.promptRomaji')}
            </AppText>
          </>
        ) : null}

        {question.mode === 'listening' ? (
          <>
            <Pressable
              accessibilityLabel={t('a11y.replaySound')}
              accessibilityRole="button"
              onPress={onReplay}
              style={({ pressed }) => [
                styles.speaker,
                {
                  backgroundColor: theme.colors.primarySoft,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radii.pill,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Icon color="primaryText" name="volume-high" size={44} />
            </Pressable>
            <AppText align="center" variant="subtitle">
              {t('quiz.listeningPrompt')}
            </AppText>
            <AppText color="textMuted" variant="caption">
              {t('quiz.tapToHear')}
            </AppText>
            {!voiceAvailable || ttsOutcome === 'missing-voice' ? (
              <Row align="center" gap={6}>
                <Icon color="warning" name="volume-mute-outline" size={16} />
                <AppText color="warning" variant="caption">
                  {t('quiz.voiceMissing')}
                </AppText>
              </Row>
            ) : null}
          </>
        ) : null}
      </Stack>
    </Card>
  );
}

const styles = StyleSheet.create({
  speaker: {
    alignItems: 'center',
    borderWidth: 1,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
});
