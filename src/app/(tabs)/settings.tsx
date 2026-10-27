import { router } from 'expo-router';
import { useState } from 'react';
import { Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Segmented } from '@/components/Segmented';
import { SettingsGroup } from '@/components/SettingsGroup';
import { SettingsRow } from '@/components/SettingsRow';
import { Stack } from '@/components/Stack';
import { TextSizeSlider } from '@/components/TextSizeSlider';
import { APP_VERSION } from '@/config/app';
import { ReminderTimeRow } from '@/features/settings/components/ReminderTimeRow';
import type { AppSettings, DailyGoalMinutes } from '@/features/settings/settingsModel';
import { useDataActions } from '@/features/settings/useDataActions';
import { LANGUAGE_LABELS, useT } from '@/i18n';
import { useSettings } from '@/providers/useSettings';
import { useAppTheme } from '@/theme/ThemeProvider';

const GOALS: readonly DailyGoalMinutes[] = [5, 10, 20];

export default function SettingsScreen() {
  const t = useT();
  const theme = useAppTheme();
  const { settings, updateSettings, reminderStatus } = useSettings();
  const { busy, exportData, importData, resetData } = useDataActions();
  const [saveError, setSaveError] = useState(false);

  const apply = async (patch: Partial<AppSettings>) => {
    try {
      await updateSettings(patch);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  };

  const reminderMessage =
    reminderStatus?.status === 'scheduled'
      ? t('settings.reminderScheduled')
      : reminderStatus?.status === 'denied'
        ? t('settings.remindersDenied')
        : reminderStatus?.status === 'unsupported'
          ? t('settings.remindersUnsupported')
          : reminderStatus?.status === 'error'
            ? t('settings.remindersError')
            : null;
  const reminderColor = reminderStatus?.status === 'scheduled' ? 'success' : 'warning';

  const switchColors = {
    ios_backgroundColor: theme.colors.surface2,
    thumbColor: theme.colors.text,
    trackColor: { false: theme.colors.surface2, true: theme.colors.primary },
  };

  return (
    <Screen>
      <Stack gap={theme.spacing.lg}>
        <Stack gap={2}>
          <AppText variant="title">{t('settings.title')}</AppText>
          <AppText color="textMuted" variant="caption">
            {t('settings.version', { version: APP_VERSION })}
          </AppText>
        </Stack>

        <Stack gap={theme.spacing.sm}>
          <SectionHeader title={t('settings.language')} />
          <Card>
            <Stack gap={theme.spacing.sm}>
              <AppText color="textMuted" variant="caption">
                {t('settings.languageDesc')}
              </AppText>
              <Segmented
                label={t('settings.language')}
                onChange={(language) => void apply({ language })}
                options={[
                  { label: LANGUAGE_LABELS.ur.native, value: 'ur' },
                  { label: LANGUAGE_LABELS.en.native, value: 'en' },
                ]}
                value={settings.language}
              />
            </Stack>
          </Card>

          <SectionHeader title={t('settings.textSize')} />
          <Card>
            <Stack gap={theme.spacing.xs}>
              <Row justify="between">
                <AppText variant="bodyStrong">{t('settings.textSize')}</AppText>
                <AppText color="primaryText" variant="label">
                  {t('settings.textSizeValue', {
                    percent: Math.round(settings.textScale * 100),
                  })}
                </AppText>
              </Row>
              <AppText color="textMuted" variant="caption">
                {t('settings.textSizeHint')}
              </AppText>
              <TextSizeSlider
                onChange={(textScale) => void apply({ textScale })}
                value={settings.textScale}
              />
            </Stack>
          </Card>

          <SectionHeader title={t('settings.dailyGoal')} />
          <Card>
            <Stack gap={theme.spacing.sm}>
              <AppText color="textMuted" variant="caption">
                {t('settings.dailyGoalDesc')}
              </AppText>
              <Segmented
                label={t('settings.dailyGoal')}
                onChange={(dailyGoalMinutes) => void apply({ dailyGoalMinutes })}
                options={GOALS.map((goal) => ({
                  label: t('common.minutesShort', { count: goal }),
                  value: goal,
                }))}
                value={settings.dailyGoalMinutes}
              />
            </Stack>
          </Card>

          <SettingsGroup>
            <SettingsRow
              description={t('settings.hapticsDesc')}
              icon="phone-portrait-outline"
              last
              right={
                <Switch
                  accessibilityLabel={t('settings.haptics')}
                  onValueChange={(hapticsEnabled) => void apply({ hapticsEnabled })}
                  value={settings.hapticsEnabled}
                  {...switchColors}
                />
              }
              title={t('settings.haptics')}
            />
          </SettingsGroup>
        </Stack>

        <Stack gap={theme.spacing.sm}>
          <SectionHeader title={t('settings.reminder')} />
          <SettingsGroup>
            <SettingsRow
              description={t('settings.reminderDesc')}
              icon="notifications-outline"
              last={!settings.reminderEnabled}
              right={
                <Switch
                  accessibilityLabel={t('settings.reminder')}
                  onValueChange={(reminderEnabled) => void apply({ reminderEnabled })}
                  value={settings.reminderEnabled}
                  {...switchColors}
                />
              }
              title={t('settings.reminder')}
            />
            {settings.reminderEnabled ? (
              <ReminderTimeRow
                onChange={(reminderTime) => void apply({ reminderTime })}
                value={settings.reminderTime}
              />
            ) : null}
          </SettingsGroup>
          {reminderMessage ? (
            <AppText color={reminderColor} variant="caption">
              {reminderMessage}
            </AppText>
          ) : null}
        </Stack>

        <Stack gap={theme.spacing.sm}>
          <SectionHeader subtitle={t('settings.dataPrivacyNote')} title={t('settings.data')} />
          <SettingsGroup>
            <SettingsRow
              busy={busy === 'export'}
              description={t('settings.exportDesc')}
              icon="share-outline"
              onPress={() => void exportData()}
              title={t('settings.export')}
            />
            <SettingsRow
              busy={busy === 'import'}
              description={t('settings.importDesc')}
              icon="download-outline"
              onPress={() => void importData()}
              title={t('settings.import')}
            />
            <SettingsRow
              busy={busy === 'reset'}
              danger
              description={t('settings.resetDesc')}
              icon="trash-outline"
              last
              onPress={resetData}
              title={t('settings.reset')}
            />
          </SettingsGroup>
        </Stack>

        <Stack gap={theme.spacing.sm}>
          <SectionHeader title={t('settings.about')} />
          <SettingsGroup>
            <SettingsRow
              icon="information-circle-outline"
              onPress={() => router.push('/about')}
              title={t('settings.about')}
            />
            <SettingsRow
              icon="shield-checkmark-outline"
              onPress={() => router.push('/privacy')}
              title={t('settings.privacy')}
            />
            <SettingsRow
              icon="document-text-outline"
              last
              onPress={() => router.push('/licenses')}
              title={t('settings.licenses')}
            />
          </SettingsGroup>
          <View>
            <AppText align="center" color="textMuted" variant="caption">
              {t('settings.version', { version: APP_VERSION })}
            </AppText>
          </View>
        </Stack>

        {saveError ? (
          <AppText color="danger" variant="caption">
            {t('settings.saveError')}
          </AppText>
        ) : null}
      </Stack>
    </Screen>
  );
}
