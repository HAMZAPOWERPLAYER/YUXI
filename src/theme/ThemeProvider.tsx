import { type PropsWithChildren, createContext, useContext, useMemo } from 'react';

import { useReduceMotion } from '@/hooks/useReduceMotion';

import { type ColorTokens, type ThemeMode, borders, radii, sizes, spacing, themes } from './tokens';
import { typography } from './typography';

export type AppTheme = {
  mode: ThemeMode;
  colors: ColorTokens;
  spacing: typeof spacing;
  radii: typeof radii;
  sizes: typeof sizes;
  borders: typeof borders;
  typography: typeof typography;
  textScale: number;
  fontsLoaded: boolean;
  reduceMotion: boolean;
};

const ThemeContext = createContext<AppTheme | null>(null);

type Props = PropsWithChildren<{
  mode?: ThemeMode;
  textScale?: number;
  fontsLoaded?: boolean;
}>;

export function AppThemeProvider({
  children,
  mode = 'dark',
  textScale = 1,
  fontsLoaded = false,
}: Props) {
  const reduceMotion = useReduceMotion();

  const value = useMemo<AppTheme>(
    () => ({
      mode,
      colors: themes[mode],
      spacing,
      radii,
      sizes,
      borders,
      typography,
      textScale: Math.min(1.6, Math.max(0.8, textScale)),
      fontsLoaded,
      reduceMotion,
    }),
    [mode, textScale, fontsLoaded, reduceMotion],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useAppTheme must be used inside AppThemeProvider');
  }
  return theme;
}
