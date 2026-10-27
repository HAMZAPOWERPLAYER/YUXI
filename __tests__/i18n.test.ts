import en from '@/i18n/en.json';
import ur from '@/i18n/ur.json';
import { directionFor, isRtlLanguage } from '@/i18n/direction';
import { interpolate, translate } from '@/i18n/translate';

const enEntries = Object.entries(en as Record<string, string>);
const urEntries = Object.entries(ur as Record<string, string>);

describe('translation resources', () => {
  it('has exactly the same key set in Urdu and English', () => {
    const enKeys = enEntries.map(([key]) => key).sort();
    const urKeys = urEntries.map(([key]) => key).sort();
    expect(urKeys).toEqual(enKeys);
  });

  it('has no empty or whitespace-only values', () => {
    for (const [locale, entries] of [
      ['en', enEntries],
      ['ur', urEntries],
    ] as const) {
      for (const [key, value] of entries) {
        expect({ locale, key, blank: value.trim().length === 0 }).toEqual({
          locale,
          key,
          blank: false,
        });
      }
    }
  });

  it('uses dotted, unique, lowerCamelCase keys', () => {
    const seen = new Set<string>();
    for (const [key] of enEntries) {
      expect(key).toMatch(/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)+$/);
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('keeps the same interpolation placeholders in both locales', () => {
    const placeholders = (value: string) =>
      [...value.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort();

    for (const [key, enValue] of enEntries) {
      const urValue = (ur as Record<string, string>)[key];
      expect({ key, placeholders: placeholders(urValue ?? '') }).toEqual({
        key,
        placeholders: placeholders(enValue),
      });
    }
  });
});

describe('direction helpers', () => {
  it('maps Urdu to RTL and English to LTR', () => {
    expect(directionFor('ur')).toBe('rtl');
    expect(directionFor('en')).toBe('ltr');
    expect(isRtlLanguage('ur')).toBe(true);
    expect(isRtlLanguage('en')).toBe(false);
  });
});

describe('interpolation', () => {
  it('replaces every known placeholder', () => {
    expect(interpolate('{{minutes}} of {{goal}} min', { minutes: 4, goal: 10 })).toBe(
      '4 of 10 min',
    );
  });

  it('leaves unknown placeholders untouched', () => {
    expect(interpolate('Hello {{name}}', {})).toBe('Hello {{name}}');
  });

  it('returns the template when no params are supplied', () => {
    expect(interpolate('Just text')).toBe('Just text');
  });
});

describe('translate', () => {
  it('returns the localized string with params applied', () => {
    expect(translate('en', 'common.minutesShort', { count: 5 })).toBe('5 min');
    expect(translate('ur', 'common.minutesShort', { count: 5 })).toBe('5 منٹ');
  });

  it('returns a non-empty string for every key in both locales', () => {
    const keys = Object.keys(en) as (keyof typeof en)[];
    for (const key of keys) {
      expect(translate('en', key).length).toBeGreaterThan(0);
      expect(translate('ur', key).length).toBeGreaterThan(0);
    }
  });
});
