import { AppText } from '@/components/AppText';
import { Stack } from '@/components/Stack';
import type { GeneratedExercise } from '@/features/exercises';
import { FuriganaText } from '@/features/exercises/components/FuriganaText';
import { useI18n, useT } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';

function localized(language: 'ur' | 'en', en: string | undefined, ur: string | undefined): string {
  if (language === 'ur') return ur ?? en ?? '';
  return en ?? ur ?? '';
}

/** Instruction plus the prompt for any generated exercise kind. */
export function ExercisePrompt({ exercise }: { exercise: GeneratedExercise }) {
  const t = useT();
  const theme = useAppTheme();
  const { language } = useI18n();

  if (exercise.kind === 'meaning-choice') {
    return (
      <Stack align="center" gap={theme.spacing.xs}>
        <AppText align="center" color="textMuted" variant="label">
          {t('lesson.chooseMeaning')}
        </AppText>
        <FuriganaText
          align="center"
          segments={exercise.prompt.segments}
          text={exercise.prompt.ja ?? ''}
          variant="kanaHero"
        />
      </Stack>
    );
  }

  if (exercise.kind === 'reverse-choice') {
    return (
      <Stack align="center" gap={theme.spacing.xs}>
        <AppText align="center" color="textMuted" variant="label">
          {t('lesson.chooseJapanese')}
        </AppText>
        <AppText align="center" variant="title">
          {localized(language, exercise.prompt.en, exercise.prompt.ur)}
        </AppText>
      </Stack>
    );
  }

  return (
    <Stack align="center" gap={theme.spacing.xs}>
      <AppText align="center" color="textMuted" variant="label">
        {exercise.kind === 'sentence-builder'
          ? t('lesson.buildSentence')
          : t('lesson.fillParticle')}
      </AppText>
      <AppText align="center" variant="title">
        {localized(language, exercise.prompt.en, exercise.prompt.ur)}
      </AppText>
    </Stack>
  );
}
