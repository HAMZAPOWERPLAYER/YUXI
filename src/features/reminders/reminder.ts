import { isValidReminderTime } from '@/features/settings/settingsModel';
import { translate } from '@/i18n/translate';
import type { Language, TranslationKey } from '@/i18n/types';

/** Meta key holding the identifier of the one scheduled daily reminder. */
export const REMINDER_NOTIFICATION_META_KEY = 'reminder_notification_id';

/** Rotating copy keeps the daily nudge from feeling like spam. */
export const REMINDER_BODY_KEYS = [
  'notifications.body1',
  'notifications.body2',
  'notifications.body3',
] as const satisfies readonly TranslationKey[];

export type ReminderTime = {
  hour: number;
  minute: number;
};

/** Parses a validated "HH:mm" string into notification trigger fields. */
export function parseReminderTime(value: string): ReminderTime | null {
  if (!isValidReminderTime(value)) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

/** Stable index in 0..count-1 for any seed, including negative values. */
export function reminderVariantIndex(
  seed: number,
  count: number = REMINDER_BODY_KEYS.length,
): number {
  if (!Number.isFinite(seed) || count <= 0) return 0;
  const size = Math.trunc(count);
  return ((Math.trunc(seed) % size) + size) % size;
}

export type ReminderContent = {
  title: string;
  body: string;
  variant: number;
};

/** Title/body for one scheduled reminder in the selected app language. */
export function buildReminderContent(language: Language, seed: number): ReminderContent {
  const variant = reminderVariantIndex(seed);
  const bodyKey = REMINDER_BODY_KEYS[variant] ?? 'notifications.body1';
  return {
    title: translate(language, 'notifications.title'),
    body: translate(language, bodyKey),
    variant,
  };
}
