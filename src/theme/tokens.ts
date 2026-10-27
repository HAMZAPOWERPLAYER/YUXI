/**
 * Design tokens. The palette is intentionally small and dark-first.
 * A light palette is defined so a future setting can switch without restructuring screens.
 */

export type ColorTokens = {
  background: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryPressed: string;
  /** Accessible text tint of the crimson accent (AA on dark surfaces). */
  primaryText: string;
  primarySoft: string;
  textOnPrimary: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
  transparent: string;
  masteryUnseen: string;
  masteryLearning: string;
  masteryFamiliar: string;
  masteryMastered: string;
};

export const darkColors: ColorTokens = {
  background: '#0B0B0F',
  surface: '#15151C',
  surface2: '#1E1E28',
  border: '#2A2A36',
  text: '#F4F4F6',
  textMuted: '#A3A3B2',
  primary: '#E11D2E',
  primaryPressed: '#B8111F',
  primaryText: '#FF5A68',
  primarySoft: '#3A111A',
  textOnPrimary: '#FFFFFF',
  success: '#2FBF71',
  successSoft: '#10291D',
  warning: '#F5A524',
  warningSoft: '#2E2411',
  danger: '#FF4D5E',
  dangerSoft: '#32141A',
  overlay: 'rgba(0, 0, 0, 0.62)',
  transparent: 'transparent',
  masteryUnseen: '#5C5C6B',
  masteryLearning: '#F5A524',
  masteryFamiliar: '#5B9DFF',
  masteryMastered: '#2FBF71',
};

/**
 * Light theme scaffolding. Not exposed in Part 1, but tokens are ready for a
 * future appearance setting without touching feature code.
 */
export const lightColors: ColorTokens = {
  background: '#F7F7FA',
  surface: '#FFFFFF',
  surface2: '#EFEFF4',
  border: '#D8D8E2',
  text: '#14141B',
  textMuted: '#5D5D6B',
  primary: '#C41224',
  primaryPressed: '#9E0D1C',
  primaryText: '#A80F1F',
  primarySoft: '#FDE7EA',
  textOnPrimary: '#FFFFFF',
  success: '#137A45',
  successSoft: '#E4F7EC',
  warning: '#8A5800',
  warningSoft: '#FFF1D6',
  danger: '#C21D2E',
  dangerSoft: '#FDE7EA',
  overlay: 'rgba(15, 15, 20, 0.45)',
  transparent: 'transparent',
  masteryUnseen: '#8A8A98',
  masteryLearning: '#A86B00',
  masteryFamiliar: '#1F5FB0',
  masteryMastered: '#137A45',
};

export type ThemeMode = 'dark' | 'light';

export const themes: Record<ThemeMode, ColorTokens> = {
  dark: darkColors,
  light: lightColors,
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export type SpacingToken = keyof typeof spacing;

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radii;

export const sizes = {
  touchTarget: 48,
  buttonHeight: 52,
  buttonHeightSmall: 44,
  buttonHeightLarge: 56,
  iconButton: 48,
  tabBarHeight: 64,
  maxContentWidth: 720,
} as const;

export const borders = {
  hairline: 1,
  focus: 2,
} as const;

export type MasteryLevel = 'unseen' | 'learning' | 'familiar' | 'mastered';

export const masteryColorTokens: Record<MasteryLevel, keyof ColorTokens> = {
  unseen: 'masteryUnseen',
  learning: 'masteryLearning',
  familiar: 'masteryFamiliar',
  mastered: 'masteryMastered',
};
