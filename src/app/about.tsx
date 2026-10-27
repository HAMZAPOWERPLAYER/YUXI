import { router } from 'expo-router';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Divider } from '@/components/Divider';
import { Mascot } from '@/components/Mascot';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Stack } from '@/components/Stack';
import { APP_CONTACT_EMAIL, APP_VERSION } from '@/config/app';
import { useT } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';

export default function AboutScreen() {
  const t = useT();
  const theme = useAppTheme();

  return (
    <Screen header={<ScreenHeader back title={t('about.title')} />}>
      <Stack gap={theme.spacing.lg}>
        <Stack align="center" gap={theme.spacing.xs}>
          <Mascot decorative expression="happy" size={132} />
          <AppText color="primaryText" variant="display">
            {t('common.appName')}
          </AppText>
          <AppText align="center" color="textMuted" variant="body">
            {t('common.brandTagline')}
          </AppText>
          <AppText color="textMuted" variant="caption">
            {t('about.version', { version: APP_VERSION })}
          </AppText>
        </Stack>

        <Card>
          <AppText variant="body">{t('about.body')}</AppText>
        </Card>

        <Card>
          <Stack gap={theme.spacing.sm}>
            <AppText variant="heading">{t('about.credits')}</AppText>
            <AppText color="textMuted" variant="body">
              {t('about.creditsBody')}
            </AppText>
            <Divider />
            <Stack gap={2}>
              <AppText variant="label">{t('about.madeBy')}</AppText>
              <AppText color="textMuted" selectable variant="caption">
                {APP_CONTACT_EMAIL}
              </AppText>
            </Stack>
          </Stack>
        </Card>

        <Stack gap={theme.spacing.xs}>
          <Button
            icon="shield-checkmark-outline"
            label={t('about.privacyLink')}
            onPress={() => router.push('/privacy')}
            variant="secondary"
          />
          <Button
            icon="document-text-outline"
            label={t('about.licensesLink')}
            onPress={() => router.push('/licenses')}
            variant="secondary"
          />
        </Stack>
      </Stack>
    </Screen>
  );
}
