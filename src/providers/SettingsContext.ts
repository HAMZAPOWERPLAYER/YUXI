import { createContext } from 'react';

import type { AppSettings } from '@/features/settings/settingsModel';
import type { ReminderOutcome } from '@/services/notifications';

export type SettingsStatus = 'loading' | 'ready' | 'error';

export type SettingsContextValue = {
  settings: AppSettings;
  status: SettingsStatus;
  error: string | null;
  reminderStatus: ReminderOutcome | null;
  updateSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>;
  reload: () => Promise<void>;
  retry: () => void;
  clearReminderStatus: () => void;
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);
