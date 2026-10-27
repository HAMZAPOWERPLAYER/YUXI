import { type PropsWithChildren, useCallback, useMemo, useState } from 'react';

import { detectDefaultLanguage } from './detect';
import { directionFor } from './direction';
import { I18nContext, type I18nContextValue } from './I18nContext';
import type { Language } from './types';

type Props = PropsWithChildren<{
  initialLanguage?: Language;
}>;

export function I18nProvider({ children, initialLanguage }: Props) {
  const [language, setLanguageState] = useState<Language>(
    () => initialLanguage ?? detectDefaultLanguage(),
  );

  const setLanguage = useCallback((next: Language) => {
    setLanguageState((current) => (current === next ? current : next));
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const direction = directionFor(language);
    return {
      language,
      direction,
      isRTL: direction === 'rtl',
      setLanguage,
    };
  }, [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
