import licensesFile from '@/generated/licenses.json';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Divider } from '@/components/Divider';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { Stack } from '@/components/Stack';
import { useT } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';

type LicenseEntry = {
  name: string;
  version: string;
  license: string;
  repository?: string;
};

const entries: readonly LicenseEntry[] = licensesFile.licenses;

export default function LicensesScreen() {
  const t = useT();
  const theme = useAppTheme();

  return (
    <Screen header={<ScreenHeader back title={t('licenses.title')} />}>
      <Stack gap={theme.spacing.md}>
        <Card>
          <AppText variant="body">{t('licenses.intro')}</AppText>
        </Card>

        <Stack gap={theme.spacing.xs}>
          <SectionHeader title={t('licenses.fonts')} />
          <Card>
            <AppText color="textMuted" variant="body">
              {t('licenses.fontBody')}
            </AppText>
          </Card>
        </Stack>

        <Stack gap={theme.spacing.xs}>
          <SectionHeader title={t('licenses.deps')} />
          <Card padding={0}>
            <Stack gap={0}>
              {entries.map((entry, index) => (
                <Stack gap={0} key={entry.name}>
                  <Stack gap={2} style={{ padding: theme.spacing.sm }}>
                    <AppText variant="bodyStrong">{entry.name}</AppText>
                    <AppText color="textMuted" variant="caption">
                      {t('licenses.version')}: {entry.version} · {t('licenses.license')}:{' '}
                      {entry.license || t('licenses.unknown')}
                    </AppText>
                  </Stack>
                  {index < entries.length - 1 ? <Divider /> : null}
                </Stack>
              ))}
            </Stack>
          </Card>
        </Stack>
      </Stack>
    </Screen>
  );
}
