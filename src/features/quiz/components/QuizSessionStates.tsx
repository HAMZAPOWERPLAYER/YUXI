import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ErrorState, LoadingState } from '@/components/StateViews';
import { useT } from '@/i18n';

/** Shown while questions and the Japanese voice check are loading. */
export function QuizLoadingScreen() {
  const t = useT();
  return (
    <Screen>
      <ScreenHeader back title={t('quiz.title')} />
      <LoadingState label={t('quiz.preparing')} />
    </Screen>
  );
}

export type QuizLoadErrorScreenProps = {
  onRetry: () => void;
  onBack: () => void;
};

/** Shown when the database could not provide questions for this session. */
export function QuizLoadErrorScreen({ onRetry, onBack }: QuizLoadErrorScreenProps) {
  const t = useT();
  return (
    <Screen>
      <ScreenHeader back title={t('quiz.title')} />
      <ErrorState actionLabel={t('common.retry')} body={t('quiz.preparing')} onAction={onRetry} />
      <Button icon="arrow-back" label={t('common.back')} onPress={onBack} variant="ghost" />
    </Screen>
  );
}
