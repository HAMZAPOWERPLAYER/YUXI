import {
  DEFAULT_SETTINGS,
  DAILY_GOALS,
  clampTextScale,
  decodeSettings,
  encodeSettingsPatch,
  isDailyGoal,
  isSettingKey,
  isValidReminderTime,
} from '@/features/settings/settingsModel';

describe('settings model', () => {
  it('uses the documented defaults', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      language: 'ur',
      textScale: 1,
      theme: 'dark',
      dailyGoalMinutes: 10,
      reminderEnabled: false,
      reminderTime: '19:00',
      hapticsEnabled: true,
      onboardingDone: false,
    });
    expect(DAILY_GOALS).toEqual([5, 10, 20]);
  });

  it('accepts device-derived overrides for the first run', () => {
    const settings = decodeSettings({}, { language: 'en', onboardingDone: false });
    expect(settings.language).toBe('en');
    expect(settings.dailyGoalMinutes).toBe(10);
  });

  it('decodes valid stored values', () => {
    const settings = decodeSettings({
      language: 'en',
      textScale: '1.25',
      theme: 'light',
      dailyGoalMinutes: '20',
      reminderEnabled: 'true',
      reminderTime: '06:45',
      hapticsEnabled: 'false',
      onboardingDone: 'true',
    });

    expect(settings).toEqual({
      language: 'en',
      textScale: 1.25,
      theme: 'light',
      dailyGoalMinutes: 20,
      reminderEnabled: true,
      reminderTime: '06:45',
      hapticsEnabled: false,
      onboardingDone: true,
    });
  });

  it('falls back safely for corrupt rows', () => {
    const settings = decodeSettings({
      language: 'fr',
      textScale: 'not-a-number',
      theme: 'neon',
      dailyGoalMinutes: '7',
      reminderEnabled: 'maybe',
      reminderTime: '25:99',
      hapticsEnabled: '2',
      onboardingDone: '',
    });

    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('clamps text scale to the supported range', () => {
    expect(clampTextScale(0.1)).toBe(0.8);
    expect(clampTextScale(4)).toBe(1.6);
    expect(clampTextScale(1.234)).toBe(1.23);
    expect(clampTextScale(Number.NaN)).toBe(1);
  });

  it('parses stored booleans in both notations', () => {
    expect(decodeSettings({ hapticsEnabled: '1' }).hapticsEnabled).toBe(true);
    expect(decodeSettings({ hapticsEnabled: '0' }).hapticsEnabled).toBe(false);
    expect(decodeSettings({ hapticsEnabled: 'TRUE' }).hapticsEnabled).toBe(true);
  });

  it('validates daily goals and reminder times', () => {
    expect(isDailyGoal(5)).toBe(true);
    expect(isDailyGoal(10)).toBe(true);
    expect(isDailyGoal(20)).toBe(true);
    expect(isDailyGoal(15)).toBe(false);
    expect(isDailyGoal('10')).toBe(false);

    expect(isValidReminderTime('00:00')).toBe(true);
    expect(isValidReminderTime('23:59')).toBe(true);
    expect(isValidReminderTime('24:00')).toBe(false);
    expect(isValidReminderTime('9:00')).toBe(false);
    expect(isValidReminderTime('19:60')).toBe(false);
  });

  it('recognizes only known setting keys', () => {
    expect(isSettingKey('language')).toBe(true);
    expect(isSettingKey('unknown')).toBe(false);
  });

  it('encodes only supplied fields', () => {
    expect(encodeSettingsPatch({ language: 'en', hapticsEnabled: false })).toEqual([
      ['language', 'en'],
      ['hapticsEnabled', 'false'],
    ]);
    expect(encodeSettingsPatch({})).toEqual([]);
  });

  it('clamps text scale while encoding', () => {
    expect(encodeSettingsPatch({ textScale: 9 })).toEqual([['textScale', '1.6']]);
  });

  it('encodes every field type', () => {
    expect(
      encodeSettingsPatch({
        theme: 'light',
        dailyGoalMinutes: 20,
        reminderEnabled: true,
        reminderTime: '07:30',
        onboardingDone: true,
      }),
    ).toEqual([
      ['theme', 'light'],
      ['dailyGoalMinutes', '20'],
      ['reminderEnabled', 'true'],
      ['reminderTime', '07:30'],
      ['onboardingDone', 'true'],
    ]);
  });

  it('rejects an invalid reminder time before writing', () => {
    expect(() => encodeSettingsPatch({ reminderTime: '99:99' })).toThrow(/Invalid reminder time/);
  });
});
