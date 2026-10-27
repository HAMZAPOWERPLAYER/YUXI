import { useT } from '@/i18n';

import { AppText } from '@/components/AppText';
import { MascotBubble } from '@/components/MascotBubble';
import { Screen } from '@/components/Screen';
import { Stack } from '@/components/Stack';

export default function IndexScreen() {
  const t = useT();

  return (
    <Screen>
      <Stack gap={24} style={{ flex: 1, justifyContent: 'center' }}>
        <AppText variant="display" align="center">
          {t('common.appName')}
        </AppText>
        <AppText variant="body" color="textMuted" align="center">
          {t('common.brandTagline')}
        </AppText>
        <MascotBubble message={t('onboarding.welcomeBody')} title={t('onboarding.welcomeTitle')} />
      </Stack>
    </Screen>
  );
}
