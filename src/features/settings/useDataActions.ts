import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { getDatabase } from '@/db/client';
import { resetAllData } from '@/db/repositories';
import {
  applyBackup,
  buildBackup,
  parseBackupJson,
  serializeBackup,
  type BackupPayload,
} from '@/features/backup';
import { APP_VERSION } from '@/config/app';
import { useT } from '@/i18n';
import { useProgress } from '@/providers/useProgress';
import { useSettings } from '@/providers/useSettings';
import { exportBackupFile, pickBackupFile } from '@/services/backupFiles';
import { now } from '@/services/clock';
import { cancelAllReminders } from '@/services/notifications';
import { logEvent } from '@/utils/logger';

export type DataAction = 'export' | 'import' | 'reset' | null;

/**
 * Export, import and double-confirmed reset flows. Alerts are used instead of
 * inline cards because every action is destructive or leaves the app.
 */
export function useDataActions() {
  const t = useT();
  const { reload, updateSettings } = useSettings();
  const { refresh } = useProgress();
  const [busy, setBusy] = useState<DataAction>(null);

  const exportData = async () => {
    if (busy) return;
    setBusy('export');
    try {
      const db = await getDatabase();
      const timestamp = now();
      const payload = await buildBackup(db, APP_VERSION, timestamp);
      await exportBackupFile(serializeBackup(payload), timestamp, t('settings.export'));
      Alert.alert(t('settings.export'), t('settings.exportSuccess'), [{ text: t('common.ok') }]);
    } catch (error) {
      logEvent('error', 'Backup export failed', error);
      Alert.alert(t('common.errorTitle'), t('settings.exportError'));
    } finally {
      setBusy(null);
    }
  };

  const applyImport = async (payload: BackupPayload) => {
    setBusy('import');
    try {
      const db = await getDatabase();
      await applyBackup(db, payload);
      await reload();
      await refresh();
      try {
        await updateSettings({
          reminderEnabled: payload.settings.reminderEnabled,
          reminderTime: payload.settings.reminderTime,
        });
      } catch (error) {
        logEvent('warn', 'Imported settings but could not sync the reminder', error);
      }
      Alert.alert(t('settings.import'), t('settings.importSuccess'));
      if (!payload.settings.onboardingDone) {
        router.replace('/onboarding');
      }
    } catch (error) {
      logEvent('error', 'Backup import failed', error);
      Alert.alert(t('common.errorTitle'), t('settings.importError'));
    } finally {
      setBusy(null);
    }
  };

  const importData = async () => {
    if (busy) return;
    setBusy('import');
    try {
      const picked = await pickBackupFile();
      if (picked.status === 'canceled') return;
      if (picked.status === 'too-large') {
        Alert.alert(t('settings.import'), t('settings.importTooLarge'));
        return;
      }

      const parsed = parseBackupJson(picked.text, picked.byteSize);
      if (!parsed.ok) {
        Alert.alert(
          t('settings.import'),
          parsed.reason === 'too-large'
            ? t('settings.importTooLarge')
            : t('settings.importInvalid'),
        );
        return;
      }

      setBusy(null);
      Alert.alert(
        t('settings.importTitle'),
        t('settings.importBody', {
          days: parsed.summary.dayCount,
          kana: parsed.summary.kanaCount,
        }),
        [
          { onPress: () => setBusy(null), style: 'cancel', text: t('common.cancel') },
          {
            onPress: () => void applyImport(parsed.payload),
            style: 'destructive',
            text: t('common.confirm'),
          },
        ],
      );
    } catch (error) {
      logEvent('error', 'Could not read the chosen backup', error);
      Alert.alert(t('common.errorTitle'), t('settings.importInvalid'));
    } finally {
      setBusy((current) => (current === 'import' ? null : current));
    }
  };

  const performReset = async () => {
    setBusy('reset');
    try {
      const db = await getDatabase();
      await resetAllData(db);
      await cancelAllReminders();
      await reload();
      await refresh();
      Alert.alert(t('common.done'), t('settings.resetSuccess'));
      router.replace('/onboarding');
    } catch (error) {
      logEvent('error', 'Reset failed', error);
      Alert.alert(t('common.errorTitle'), t('settings.resetError'));
    } finally {
      setBusy(null);
    }
  };

  const resetData = () => {
    if (busy) return;
    Alert.alert(t('settings.resetTitle'), t('settings.resetBody'), [
      { style: 'cancel', text: t('common.cancel') },
      {
        onPress: () => {
          Alert.alert(t('settings.resetStep2Title'), t('settings.resetStep2Body'), [
            { style: 'cancel', text: t('common.cancel') },
            {
              onPress: () => void performReset(),
              style: 'destructive',
              text: t('settings.resetConfirm'),
            },
          ]);
        },
        style: 'destructive',
        text: t('common.continue'),
      },
    ]);
  };

  return { busy, exportData, importData, resetData };
}
