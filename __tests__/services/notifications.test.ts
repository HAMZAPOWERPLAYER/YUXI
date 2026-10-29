import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { buildReminderContent } from '@/features/reminders';
import {
  REMINDER_CHANNEL_ID,
  cancelAllReminders,
  cancelReminder,
  configureDailyReminder,
  countScheduledReminders,
} from '@/services/notifications';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 5 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

const getPermissions = Notifications.getPermissionsAsync as jest.Mock;
const requestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const setChannel = Notifications.setNotificationChannelAsync as jest.Mock;
const schedule = Notifications.scheduleNotificationAsync as jest.Mock;
const cancel = Notifications.cancelScheduledNotificationAsync as jest.Mock;
const listScheduled = Notifications.getAllScheduledNotificationsAsync as jest.Mock;

function scheduledRequest(identifier: string, kind: string) {
  return { identifier, content: { data: { kind } } };
}

const baseInput = {
  enabled: true,
  time: '19:30',
  language: 'en' as const,
  variantSeed: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  getPermissions.mockResolvedValue({ granted: true, canAskAgain: true, status: 'granted' });
  requestPermissions.mockResolvedValue({ granted: true, canAskAgain: true, status: 'granted' });
  setChannel.mockResolvedValue(null);
  schedule.mockResolvedValue('scheduled-id');
  cancel.mockResolvedValue(undefined);
  listScheduled.mockResolvedValue([]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('configureDailyReminder', () => {
  it('cancels reminders and reports disabled', async () => {
    listScheduled.mockResolvedValue([scheduledRequest('old', 'daily-reminder')]);
    await expect(
      configureDailyReminder({ ...baseInput, enabled: false, previousIdentifier: 'old' }),
    ).resolves.toEqual({ status: 'disabled' });
    expect(cancel).toHaveBeenCalledWith('old');
    expect(schedule).not.toHaveBeenCalled();
  });

  it('rejects an invalid time without asking for permission', async () => {
    await expect(configureDailyReminder({ ...baseInput, time: '25:00' })).resolves.toEqual({
      status: 'error',
    });
    expect(getPermissions).not.toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
  });

  it('reports denied when the user blocked notifications', async () => {
    getPermissions.mockResolvedValue({ granted: false, canAskAgain: false, status: 'denied' });
    await expect(configureDailyReminder(baseInput)).resolves.toEqual({ status: 'denied' });
    expect(requestPermissions).not.toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
  });

  it('asks once when permission is undetermined and schedules when granted', async () => {
    getPermissions.mockResolvedValue({
      granted: false,
      canAskAgain: true,
      status: 'undetermined',
    });
    requestPermissions.mockResolvedValue({ granted: true, canAskAgain: true, status: 'granted' });
    await expect(configureDailyReminder(baseInput)).resolves.toMatchObject({ status: 'scheduled' });
    expect(requestPermissions).toHaveBeenCalledTimes(1);
    expect(schedule).toHaveBeenCalledTimes(1);
  });

  it('reports denied after the user declines the prompt', async () => {
    getPermissions.mockResolvedValue({
      granted: false,
      canAskAgain: true,
      status: 'undetermined',
    });
    requestPermissions.mockResolvedValue({ granted: false, canAskAgain: false, status: 'denied' });
    await expect(configureDailyReminder(baseInput)).resolves.toEqual({ status: 'denied' });
    expect(schedule).not.toHaveBeenCalled();
  });

  it('schedules one daily notification with localized rotating copy', async () => {
    const result = await configureDailyReminder(baseInput);
    const content = buildReminderContent('en', 0);

    expect(result).toEqual({ status: 'scheduled', identifier: 'scheduled-id', bodyVariant: 0 });
    expect(schedule).toHaveBeenCalledWith({
      content: {
        title: content.title,
        body: content.body,
        data: { kind: 'daily-reminder' },
      },
      trigger: {
        type: 'daily',
        hour: 19,
        minute: 30,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
  });

  it('creates the Android channel before scheduling', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    await expect(configureDailyReminder(baseInput)).resolves.toMatchObject({
      status: 'scheduled',
    });
    expect(setChannel).toHaveBeenCalledWith(
      REMINDER_CHANNEL_ID,
      expect.objectContaining({ importance: 5 }),
    );
  });

  it('reports unsupported on web', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    await expect(configureDailyReminder(baseInput)).resolves.toEqual({ status: 'unsupported' });
    expect(getPermissions).not.toHaveBeenCalled();
  });

  it('reports unsupported in Expo Go on Android', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.replaceProperty(Constants, 'executionEnvironment', ExecutionEnvironment.StoreClient);
    await expect(configureDailyReminder(baseInput)).resolves.toEqual({ status: 'unsupported' });
    expect(getPermissions).not.toHaveBeenCalled();
    await expect(countScheduledReminders()).resolves.toBe(0);
  });

  it('never throws when scheduling fails', async () => {
    schedule.mockRejectedValue(new Error('engine'));
    await expect(configureDailyReminder(baseInput)).resolves.toEqual({ status: 'error' });
  });

  it('never throws when the permission check fails', async () => {
    getPermissions.mockRejectedValue(new Error('engine'));
    await expect(configureDailyReminder(baseInput)).resolves.toEqual({ status: 'error' });
  });
});

describe('reminder cleanup helpers', () => {
  it('cancels a known identifier and ignores missing ids', async () => {
    await cancelReminder(null);
    expect(cancel).not.toHaveBeenCalled();
    await cancelReminder('reminder-1');
    expect(cancel).toHaveBeenCalledWith('reminder-1');
  });

  it('swallows cancellation errors', async () => {
    cancel.mockRejectedValue(new Error('gone'));
    await expect(cancelReminder('reminder-1')).resolves.toBeUndefined();
  });

  it('cancels only Yuxi reminders during a full cleanup', async () => {
    listScheduled.mockResolvedValue([
      scheduledRequest('a', 'daily-reminder'),
      scheduledRequest('b', 'other'),
      scheduledRequest('c', 'daily-reminder'),
    ]);
    await cancelAllReminders();
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(cancel).toHaveBeenCalledWith('a');
    expect(cancel).toHaveBeenCalledWith('c');
  });

  it('swallows listing errors during cleanup', async () => {
    listScheduled.mockRejectedValue(new Error('engine'));
    await expect(cancelAllReminders()).resolves.toBeUndefined();
  });

  it('counts only Yuxi reminders', async () => {
    listScheduled.mockResolvedValue([
      scheduledRequest('a', 'daily-reminder'),
      scheduledRequest('b', 'other'),
    ]);
    await expect(countScheduledReminders()).resolves.toBe(1);
    listScheduled.mockRejectedValue(new Error('engine'));
    await expect(countScheduledReminders()).resolves.toBe(0);
  });
});
