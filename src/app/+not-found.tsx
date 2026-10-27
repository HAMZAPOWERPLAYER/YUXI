import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ErrorState } from '@/components/StateViews';
import { useT } from '@/i18n';

export default function NotFoundScreen() {
  const t = useT();
  return (
    <Screen>
      <ScreenHeader title={t('common.notFound')} />
      <ErrorState
        actionLabel={t('tabs.home')}
        body={t('errors.screenNotFoundBody')}
        onAction={() => router.replace('/(tabs)/home')}
        title={t('errors.screenNotFoundTitle')}
      />
    </Screen>
  );
}
