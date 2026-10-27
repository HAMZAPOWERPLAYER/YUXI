import { resources } from './resources';
import type { Language, TranslationKey, TranslationParams } from './types';

const INTERPOLATION_PATTERN = /\{\{(\w+)\}\}/g;

export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(INTERPOLATION_PATTERN, (match, token: string) => {
    const value = params[token];
    return value === undefined ? match : String(value);
  });
}

export function translate(
  language: Language,
  key: TranslationKey,
  params?: TranslationParams,
): string {
  const table = resources[language] ?? resources.en;
  const template = table[key] ?? resources.en[key] ?? key;
  return interpolate(template, params);
}
