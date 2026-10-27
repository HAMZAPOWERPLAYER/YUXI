import type { Direction, Language } from './types';

export function directionFor(language: Language): Direction {
  return language === 'ur' ? 'rtl' : 'ltr';
}

export function isRtlLanguage(language: Language): boolean {
  return directionFor(language) === 'rtl';
}
