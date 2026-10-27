import type { Language } from '@/i18n/types';

export type DailyGoalMinutes = 5 | 10 | 20;
export type ThemeModeSetting = 'dark' | 'light';

export type AppSettings = {
  language: Language;
  textScale: number;
  theme: ThemeModeSetting;
  dailyGoalMinutes: DailyGoalMinutes;
  reminderEnabled: boolean;
  reminderTime: string;
  hapticsEnabled: boolean;
  onboardingDone: boolean;
};

export const DAILY_GOALS: readonly DailyGoalMinutes[] = [5, 10, 20];

export const SETTINGS_KEYS = [
  'language',
  'textScale',
  'theme',
  'dailyGoalMinutes',
  'reminderEnabled',
  'reminderTime',
  'hapticsEnabled',
  'onboardingDone',
] as const;

export type SettingKey = (typeof SETTINGS_KEYS)[number];

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'ur',
  textScale: 1,
  theme: 'dark',
  dailyGoalMinutes: 10,
  reminderEnabled: false,
  reminderTime: '19:00',
  hapticsEnabled: true,
  onboardingDone: false,
};

export const MIN_TEXT_SCALE = 0.8;
export const MAX_TEXT_SCALE = 1.6;

const REMINDER_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isSettingKey(value: string): value is SettingKey {
  return (SETTINGS_KEYS as readonly string[]).includes(value);
}

export function isDailyGoal(value: unknown): value is DailyGoalMinutes {
  return value === 5 || value === 10 || value === 20;
}

export function isValidReminderTime(value: string): boolean {
  return REMINDER_TIME_PATTERN.test(value);
}

export function clampTextScale(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SETTINGS.textScale;
  const clamped = Math.min(MAX_TEXT_SCALE, Math.max(MIN_TEXT_SCALE, value));
  return Math.round(clamped * 100) / 100;
}

function parseBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  return fallback;
}

function parseGoal(raw: string | undefined, fallback: DailyGoalMinutes): DailyGoalMinutes {
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  return isDailyGoal(parsed) ? parsed : fallback;
}

function parseTextScale(raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? clampTextScale(parsed) : fallback;
}

/**
 * Decodes persisted string values defensively. A corrupt or hand-edited row
 * must never prevent the app from opening.
 */
export function decodeSettings(
  stored: Partial<Record<SettingKey, string>>,
  overrides: Partial<AppSettings> = {},
): AppSettings {
  const base: AppSettings = { ...DEFAULT_SETTINGS, ...overrides };
  const language =
    stored.language === 'ur' || stored.language === 'en' ? stored.language : base.language;
  const theme = stored.theme === 'light' || stored.theme === 'dark' ? stored.theme : base.theme;
  const reminderTime =
    stored.reminderTime !== undefined && isValidReminderTime(stored.reminderTime)
      ? stored.reminderTime
      : base.reminderTime;

  return {
    language,
    textScale: parseTextScale(stored.textScale, base.textScale),
    theme,
    dailyGoalMinutes: parseGoal(stored.dailyGoalMinutes, base.dailyGoalMinutes),
    reminderEnabled: parseBoolean(stored.reminderEnabled, base.reminderEnabled),
    reminderTime,
    hapticsEnabled: parseBoolean(stored.hapticsEnabled, base.hapticsEnabled),
    onboardingDone: parseBoolean(stored.onboardingDone, base.onboardingDone),
  };
}

/** Only defined fields are written, so partial updates never clobber others. */
export function encodeSettingsPatch(
  patch: Partial<AppSettings>,
): (readonly [SettingKey, string])[] {
  const rows: (readonly [SettingKey, string])[] = [];
  if (patch.language !== undefined) rows.push(['language', patch.language]);
  if (patch.textScale !== undefined)
    rows.push(['textScale', String(clampTextScale(patch.textScale))]);
  if (patch.theme !== undefined) rows.push(['theme', patch.theme]);
  if (patch.dailyGoalMinutes !== undefined) {
    rows.push(['dailyGoalMinutes', String(patch.dailyGoalMinutes)]);
  }
  if (patch.reminderEnabled !== undefined) {
    rows.push(['reminderEnabled', patch.reminderEnabled ? 'true' : 'false']);
  }
  if (patch.reminderTime !== undefined) {
    if (!isValidReminderTime(patch.reminderTime)) {
      throw new Error(`Invalid reminder time: ${patch.reminderTime}`);
    }
    rows.push(['reminderTime', patch.reminderTime]);
  }
  if (patch.hapticsEnabled !== undefined) {
    rows.push(['hapticsEnabled', patch.hapticsEnabled ? 'true' : 'false']);
  }
  if (patch.onboardingDone !== undefined) {
    rows.push(['onboardingDone', patch.onboardingDone ? 'true' : 'false']);
  }
  return rows;
}
