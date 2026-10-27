import { Screen } from '@/components/Screen';
import { ErrorState } from '@/components/StateViews';
import { useT } from '@/i18n';

export function DatabaseErrorScreen({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <Screen scroll={false}>
      <ErrorState
        actionLabel={t('errors.retry')}
        body={t('errors.dbBody')}
        onAction={onRetry}
        title={t('errors.dbTitle')}
      />
    </Screen>
  );
}
