import {
  REMINDER_BODY_KEYS,
  buildReminderContent,
  isReminderPlatformSupported,
  parseReminderTime,
  reminderVariantIndex,
} from '@/features/reminders';

describe('parseReminderTime', () => {
  it.each([
    ['00:00', { hour: 0, minute: 0 }],
    ['07:05', { hour: 7, minute: 5 }],
    ['19:30', { hour: 19, minute: 30 }],
    ['23:59', { hour: 23, minute: 59 }],
  ])('parses %s', (value, expected) => {
    expect(parseReminderTime(value)).toEqual(expected);
  });

  it.each(['', '9:00', '24:00', '12:60', 'noon', '12:5'])('rejects %s', (value) => {
    expect(parseReminderTime(value)).toBeNull();
  });
});

describe('reminder variant selection', () => {
  it('keeps the index inside the available bodies', () => {
    expect(reminderVariantIndex(0)).toBe(0);
    expect(reminderVariantIndex(1)).toBe(1);
    expect(reminderVariantIndex(2)).toBe(2);
    expect(reminderVariantIndex(3)).toBe(0);
    expect(reminderVariantIndex(4)).toBe(1);
  });

  it('handles negative, fractional and invalid seeds', () => {
    expect(reminderVariantIndex(-1)).toBe(2);
    expect(reminderVariantIndex(-4)).toBe(2);
    expect(reminderVariantIndex(7.9)).toBe(1);
    expect(reminderVariantIndex(Number.NaN)).toBe(0);
  });

  it('supports a custom body count', () => {
    expect(reminderVariantIndex(5, 2)).toBe(1);
    expect(reminderVariantIndex(5, 0)).toBe(0);
  });
});

describe('buildReminderContent', () => {
  it('uses every rotating body in English', () => {
    const bodies = REMINDER_BODY_KEYS.map((_key, index) => buildReminderContent('en', index).body);
    expect(new Set(bodies).size).toBe(REMINDER_BODY_KEYS.length);
    for (const body of bodies) {
      expect(body.length).toBeGreaterThan(0);
    }
    expect(buildReminderContent('en', 0).title).toBe('A few minutes of Japanese today?');
  });

  it('returns localized Urdu copy', () => {
    const english = buildReminderContent('en', 1);
    const urdu = buildReminderContent('ur', 1);
    expect(urdu.title).not.toBe(english.title);
    expect(urdu.body).not.toBe(english.body);
    expect(urdu.title.length).toBeGreaterThan(0);
    expect(urdu.body.length).toBeGreaterThan(0);
  });

  it('is stable for the same seed and wraps around', () => {
    expect(buildReminderContent('en', 7)).toEqual(buildReminderContent('en', 1));
    expect(buildReminderContent('en', 7).variant).toBe(1);
  });
});

describe('platform support', () => {
  it('supports native platforms only', () => {
    expect(isReminderPlatformSupported('ios')).toBe(true);
    expect(isReminderPlatformSupported('android')).toBe(true);
    expect(isReminderPlatformSupported('web')).toBe(false);
  });
});
