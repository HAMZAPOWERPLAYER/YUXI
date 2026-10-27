import { createContext } from 'react';

import type { Direction, Language } from './types';

export type I18nContextValue = {
  language: Language;
  direction: Direction;
  isRTL: boolean;
  setLanguage: (language: Language) => void;
};

export const I18nContext = createContext<I18nContextValue | null>(null);
