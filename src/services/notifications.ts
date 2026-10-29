import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import {
  buildReminderContent,
  isReminderPlatformSupported,
  parseReminderTime,
} from '@/features/reminders';
import { translate } from '@/i18n/translate';
import type { Language } from '@/i18n/types';
import { logEvent } from '@/utils/logger';

export const REMINDER_CHANNEL_ID = 'yuxi-daily-reminder';
export const REMINDER_DATA_KIND = 'daily-reminder';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null | undefined;

/**
 * Expo Go for Android does not ship the native ExpoTopicSubscriptionModule,
 * but expo-notifications imports it eagerly. Requiring the package lazily keeps
 * the app bootable there; reminders report "unsupported" until a development
 * build is installed.
 */
function isExpoGoAndroid(): boolean {
  return (
    Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  );
}

function getNotifications(): NotificationsModule | null {
  if (isExpoGoAndroid()) return null;
  if (notificationsModule === undefined) {
    try {
      // Lazy on purpose: expo-notifications evaluates a native module at import.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      notificationsModule = require('expo-notifications') as NotificationsModule;
    } catch (error) {
      logEvent('warn', 'expo-notifications is unavailable on this platform', error);
      notificationsModule = null;
    }
  }
  return notificationsModule;
}

function getSupportedNotifications(): NotificationsModule | null {
  if (!isReminderPlatformSupported(Platform.OS)) return null;
  return getNotifications();
}

export type ReminderOutcome =
  | { status: 'scheduled'; identifier: string; bodyVariant: number }
  | { status: 'disabled' }
  | { status: 'denied' }
  | { status: 'unsupported' }
  | { status: 'error' };

export type ConfigureReminderInput = {
  enabled: boolean;
  /** "HH:mm", already validated by the settings model. */
  time: string;
  language: Language;
  /** Rotates the reminder copy; usually the current day number. */
  variantSeed: number;
  /** Identifier returned by the previous schedule call, if known. */
  previousIdentifier?: string | null;
};

export function areRemindersSupported(): boolean {
  return getSupportedNotifications() !== null;
}

async function ensurePermission(Notifications: NotificationsModule): Promise<'granted' | 'denied'> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (!current.canAskAgain) return 'denied';

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted ? 'granted' : 'denied';
}

async function ensureChannel(
  Notifications: NotificationsModule,
  language: Language,
): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: translate(language, 'notifications.channelName'),
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    enableVibrate: false,
    showBadge: false,
  });
}

/** Cancels one known reminder id and ignores "already gone" errors. */
export async function cancelReminder(identifier?: string | null): Promise<void> {
  if (!identifier) return;
  const Notifications = getSupportedNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    logEvent('debug', 'Could not cancel reminder', error);
  }
}

/**
 * Removes any reminder this app previously scheduled. Scanning by data kind
 * also cleans up an id lost by a reset or an interrupted write.
 */
export async function cancelAllReminders(): Promise<void> {
  const Notifications = getSupportedNotifications();
  if (!Notifications) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const request of scheduled) {
      if (request.content.data?.kind === REMINDER_DATA_KIND) {
        await cancelReminder(request.identifier);
      }
    }
  } catch (error) {
    logEvent('debug', 'Could not list scheduled reminders', error);
  }
}

/**
 * Synchronizes the single daily reminder with the current settings.
 * Never throws: the settings screen maps the outcome to localized copy.
 */
export async function configureDailyReminder(
  input: ConfigureReminderInput,
): Promise<ReminderOutcome> {
  const Notifications = getSupportedNotifications();
  if (!Notifications) return { status: 'unsupported' };

  try {
    if (!input.enabled) {
      await cancelReminder(input.previousIdentifier);
      await cancelAllReminders();
      return { status: 'disabled' };
    }

    const time = parseReminderTime(input.time);
    if (!time) {
      logEvent('warn', `Invalid reminder time: ${input.time}`);
      return { status: 'error' };
    }

    if ((await ensurePermission(Notifications)) !== 'granted') {
      return { status: 'denied' };
    }

    await ensureChannel(Notifications, input.language);
    await cancelReminder(input.previousIdentifier);
    await cancelAllReminders();

    const content = buildReminderContent(input.language, input.variantSeed);
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        data: { kind: REMINDER_DATA_KIND },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
        channelId: REMINDER_CHANNEL_ID,
      },
    });

    return { status: 'scheduled', identifier, bodyVariant: content.variant };
  } catch (error) {
    logEvent('error', 'Could not configure the daily reminder', error);
    return { status: 'error' };
  }
}

/** Number of Yuxi reminders currently queued (normally 0 or 1). */
export async function countScheduledReminders(): Promise<number> {
  const Notifications = getSupportedNotifications();
  if (!Notifications) return 0;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.filter((request) => request.content.data?.kind === REMINDER_DATA_KIND).length;
  } catch (error) {
    logEvent('debug', 'Could not count scheduled reminders', error);
    return 0;
  }
}
