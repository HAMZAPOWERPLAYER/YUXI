import type en from './en.json';

export type Language = 'ur' | 'en';
export type Direction = 'rtl' | 'ltr';
export type TranslationKey = keyof typeof en;
export type TranslationParams = Record<string, string | number>;
export type Translate = (key: TranslationKey, params?: TranslationParams) => string;

export const LANGUAGE_LABELS: Record<Language, { native: string; english: string }> = {
  ur: { native: 'اردو', english: 'Urdu' },
  en: { native: 'English', english: 'English' },
};
