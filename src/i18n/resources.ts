import enJson from './en.json';
import urJson from './ur.json';
import type { Language, TranslationKey } from './types';

export const en = enJson;
export const ur = urJson as Record<TranslationKey, string>;

export const resources: Record<Language, Record<TranslationKey, string>> = {
  en,
  ur,
};
