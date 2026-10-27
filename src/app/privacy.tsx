import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { Stack } from '@/components/Stack';
import { APP_CONTACT_EMAIL } from '@/config/app';
import { useT } from '@/i18n';
import type { TranslationKey } from '@/i18n/types';
import { useAppTheme } from '@/theme/ThemeProvider';

type Section = { title: TranslationKey; body: TranslationKey };

const SECTIONS: readonly Section[] = [
  { title: 'privacy.noAccount', body: 'privacy.noAccountBody' },
  { title: 'privacy.noNetwork', body: 'privacy.noNetworkBody' },
  { title: 'privacy.noAds', body: 'privacy.noAdsBody' },
];

const PERMISSIONS: readonly Section[] = [
  { title: 'privacy.notifications', body: 'privacy.notificationsBody' },
  { title: 'privacy.haptics', body: 'privacy.hapticsBody' },
  { title: 'privacy.files', body: 'privacy.filesBody' },
  { title: 'privacy.speech', body: 'privacy.speechBody' },
];

function InfoCard({ section }: { section: Section }) {
  const t = useT();
  return (
    <Card tone="surface">
      <Stack gap={2}>
        <AppText variant="bodyStrong">{t(section.title)}</AppText>
        <AppText color="textMuted" variant="body">
          {t(section.body)}
        </AppText>
      </Stack>
    </Card>
  );
}

export default function PrivacyScreen() {
  const t = useT();
  const theme = useAppTheme();

  return (
    <Screen header={<ScreenHeader back title={t('privacy.title')} />}>
      <Stack gap={theme.spacing.md}>
        <Card>
          <Stack gap={theme.spacing.xs}>
            <AppText variant="body">{t('privacy.intro')}</AppText>
            <AppText color="textMuted" variant="caption">
              {t('privacy.updated')}
            </AppText>
          </Stack>
        </Card>

        {SECTIONS.map((section) => (
          <InfoCard key={section.title} section={section} />
        ))}

        <SectionHeader title={t('privacy.permissions')} />
        {PERMISSIONS.map((section) => (
          <InfoCard key={section.title} section={section} />
        ))}

        <Card tone="surface2">
          <Stack gap={2}>
            <AppText variant="bodyStrong">{t('about.contact')}</AppText>
            <AppText selectable variant="body">
              {APP_CONTACT_EMAIL}
            </AppText>
          </Stack>
        </Card>
      </Stack>
    </Screen>
  );
}
