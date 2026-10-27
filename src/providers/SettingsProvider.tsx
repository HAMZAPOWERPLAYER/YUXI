import { type PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { deleteMeta, getMeta, setMeta } from '@/db/repositories';
import { getDatabase } from '@/db/client';
import { REMINDER_NOTIFICATION_META_KEY } from '@/features/reminders';
import { DEFAULT_SETTINGS, type AppSettings } from '@/features/settings/settingsModel';
import { getSettings, updateSettings } from '@/db/repositories/settingsRepository';
import { useI18n } from '@/i18n';
import { now } from '@/services/clock';
import { type ReminderOutcome, configureDailyReminder } from '@/services/notifications';
import { logEvent } from '@/utils/logger';

import { SettingsContext, type SettingsContextValue, type SettingsStatus } from './SettingsContext';

const MS_PER_DAY = 86_400_000;

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function readStoredSettings(): Promise<AppSettings> {
  const db = await getDatabase();
  return getSettings(db);
}

/**
 * Owns persisted settings, mirrors the language into i18n and keeps the
 * single daily reminder in sync. The provider never blocks the app on a failed
 * notification schedule: the outcome is exposed to the settings screen.
 */
export function SettingsProvider({ children }: PropsWithChildren) {
  const { setLanguage } = useI18n();
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<SettingsStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [reminderStatus, setReminderStatus] = useState<ReminderOutcome | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const applyLoaded = useCallback(
    (loaded: AppSettings) => {
      if (!mounted.current) return;
      setSettingsState(loaded);
      if (loaded.onboardingDone) setLanguage(loaded.language);
      setStatus('ready');
      setError(null);
    },
    [setLanguage],
  );

  const applyError = useCallback((caught: unknown) => {
    logEvent('error', 'Could not load settings', caught);
    if (!mounted.current) return;
    setError(messageOf(caught));
    setStatus('error');
  }, []);

  const load = useCallback(async () => {
    try {
      applyLoaded(await readStoredSettings());
    } catch (caught) {
      applyError(caught);
    }
  }, [applyError, applyLoaded]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const loaded = await readStoredSettings();
        if (active) applyLoaded(loaded);
      } catch (caught) {
        if (active) applyError(caught);
      }
    })();
    return () => {
      active = false;
    };
  }, [applyError, applyLoaded]);

  const reload = useCallback(async () => {
    applyLoaded(await readStoredSettings());
  }, [applyLoaded]);

  const scheduleReminder = useCallback(async (candidate: AppSettings) => {
    let outcome: ReminderOutcome;
    try {
      const db = await getDatabase();
      const previous = await getMeta(db, REMINDER_NOTIFICATION_META_KEY);
      outcome = await configureDailyReminder({
        enabled: candidate.reminderEnabled,
        time: candidate.reminderTime,
        language: candidate.language,
        variantSeed: Math.floor(now() / MS_PER_DAY),
        previousIdentifier: previous,
      });

      if (outcome.status === 'scheduled') {
        await setMeta(db, REMINDER_NOTIFICATION_META_KEY, outcome.identifier);
      } else {
        await deleteMeta(db, REMINDER_NOTIFICATION_META_KEY);
      }
    } catch (caught) {
      logEvent('error', 'Could not synchronize the daily reminder', caught);
      outcome = { status: 'error' };
    }

    if (mounted.current) setReminderStatus(outcome);
    return outcome;
  }, []);

  const update = useCallback(
    async (patch: Partial<AppSettings>): Promise<AppSettings> => {
      const db = await getDatabase();
      let next = await updateSettings(db, patch);
      if (!mounted.current) return next;

      setSettingsState(next);
      if (patch.language) setLanguage(next.language);

      const enabling = patch.reminderEnabled === true;
      const touchesReminder =
        enabling ||
        patch.reminderEnabled === false ||
        (patch.reminderTime !== undefined && next.reminderEnabled) ||
        (patch.language !== undefined && next.reminderEnabled);

      if (touchesReminder) {
        const outcome = await scheduleReminder(next);
        if (enabling && outcome.status !== 'scheduled') {
          // The OS refused the reminder, so the switch must not stay on.
          next = await updateSettings(db, { reminderEnabled: false });
          if (mounted.current) setSettingsState(next);
        }
      }

      return next;
    },
    [scheduleReminder, setLanguage],
  );

  const retry = useCallback(() => {
    setStatus('loading');
    setError(null);
    void load();
  }, [load]);

  const clearReminderStatus = useCallback(() => setReminderStatus(null), []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      status,
      error,
      reminderStatus,
      updateSettings: update,
      reload,
      retry,
      clearReminderStatus,
    }),
    [settings, status, error, reminderStatus, update, reload, retry, clearReminderStatus],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
