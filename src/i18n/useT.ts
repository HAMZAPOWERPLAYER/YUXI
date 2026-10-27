import { useContext, useMemo } from 'react';

import { I18nContext, type I18nContextValue } from './I18nContext';
import { translate } from './translate';
import type { Direction, Language, Translate } from './types';

export type UseDirectionResult = {
  direction: Direction;
  isRTL: boolean;
  language: Language;
  /** Start-aligned text: right for Urdu, left for English. */
  textAlign: 'right' | 'left';
  /** Logical row direction: row-reverse for Urdu. */
  rowDirection: 'row' | 'row-reverse';
};

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return context;
}

export function useT(): Translate {
  const { language } = useI18n();
  return useMemo(() => (key, params) => translate(language, key, params), [language]);
}

export function useDirection(): UseDirectionResult {
  const { direction, isRTL, language } = useI18n();
  return useMemo(
    () => ({
      direction,
      isRTL,
      language,
      textAlign: isRTL ? 'right' : 'left',
      rowDirection: isRTL ? 'row-reverse' : 'row',
    }),
    [direction, isRTL, language],
  );
}
