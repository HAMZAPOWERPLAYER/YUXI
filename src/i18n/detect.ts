import { getLocales } from 'expo-localization';

import type { Language } from './types';

/**
 * English devices start in English. Every other device starts in Urdu,
 * which is the app's primary audience. This is only a default; onboarding
 * and settings always let the learner change it.
 */
export function detectDefaultLanguage(): Language {
  try {
    const primary = getLocales()[0];
    return primary?.languageCode === 'en' ? 'en' : 'ur';
  } catch {
    return 'ur';
  }
}
