/**
 * Design tokens for the Neon Night + Companion-first system.
 *
 * The palette stays dark-first. A light palette is retained so a future
 * appearance setting can be added without restructuring screens. Legacy token
 * names are preserved while screens migrate to the new component library.
 */

export type ColorTokens = {
  background: string;
  bgElevated: string;
  surface: string;
  surface2: string;
  surface3: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  /** Decorative only. Never use for essential text. */
  textFaint: string;
  primary: string;
  primaryPressed: string;
  primaryBright: string;
  primaryDeep: string;
  /** Accessible crimson text tint (AA on dark surfaces). */
  primaryText: string;
  /** 14% crimson tint for active surfaces. */
  primarySoft: string;
  /** 35% crimson radial-glow colour. */
  glow: string;
  textOnPrimary: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;
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
  bgElevated: '#101016',
  surface: '#15151C',
  surface2: '#1E1E28',
  surface3: '#272733',
  border: '#2A2A36',
  borderStrong: '#3A3A4A',
  text: '#F4F4F6',
  textMuted: '#A3A3B2',
  textFaint: '#6E6E80',
  primary: '#E11D2E',
  primaryPressed: '#B8111F',
  primaryBright: '#FF3B4E',
  primaryDeep: '#8F0F1B',
  primaryText: '#FF5F6C',
  primarySoft: 'rgba(225, 29, 46, 0.14)',
  glow: 'rgba(225, 29, 46, 0.35)',
  textOnPrimary: '#FFFFFF',
  success: '#2FBF71',
  successSoft: '#10291D',
  warning: '#F5A524',
  warningSoft: '#2E2411',
  info: '#4F8CFF',
  infoSoft: '#12203D',
  danger: '#FF4D5E',
  dangerSoft: '#32141A',
  overlay: 'rgba(0, 0, 0, 0.62)',
  transparent: 'transparent',
  // Requested #5B5B6B measures 2.73:1 on surface. Keep the accessible unseen
  // grey so the non-text mastery cue clears the 3:1 target.
  masteryUnseen: '#6B6B7C',
  masteryLearning: '#F5A524',
  masteryFamiliar: '#4F8CFF',
  masteryMastered: '#2FBF71',
};

/**
 * Light theme scaffolding. Not exposed in the dark-only redesign pass, but
 * every token is populated so the component library is theme-ready.
 */
export const lightColors: ColorTokens = {
  background: '#F7F7FA',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surface2: '#EFEFF4',
  surface3: '#E4E4EC',
  border: '#D8D8E2',
  borderStrong: '#B9B9C8',
  text: '#14141B',
  textMuted: '#5D5D6B',
  textFaint: '#8A8A98',
  primary: '#C41224',
  primaryPressed: '#9E0D1C',
  primaryBright: '#A80F1F',
  primaryDeep: '#8F0F1B',
  primaryText: '#A80F1F',
  primarySoft: 'rgba(196, 18, 36, 0.10)',
  glow: 'rgba(196, 18, 36, 0.25)',
  textOnPrimary: '#FFFFFF',
  success: '#137A45',
  successSoft: '#E4F7EC',
  warning: '#8A5800',
  warningSoft: '#FFF1D6',
  info: '#1F5FB0',
  infoSoft: '#E3EEFF',
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
  mdPlus: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export type SpacingToken = keyof typeof spacing;

export const radii = {
  xs: 4,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
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
  tabBarFloatingHeight: 72,
  maxContentWidth: 720,
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  iconXl: 32,
} as const;

export const borders = {
  hairline: 1,
  focus: 2,
} as const;

export const motion = {
  duration: {
    press: 120,
    enter: 200,
    fill: 320,
  },
  pressScale: 0.98,
  enterOffset: 8,
} as const;

/** Dark-only gradients for the current redesign pass. */
export const gradients = {
  /** Subtle hero wash: elevated black into a 30% crimson deep. */
  hero: ['#101016', '#2D0D12'] as const,
  /** Decorative crimson fill. Do not place normal-size white text on the end. */
  primary: ['#E11D2E', '#FF3B4E'] as const,
  /**
   * Accessible CTA fill. The white label clears AA at both ends; primaryBright
   * fails AA for normal-size white text, so it is reserved for accents.
   */
  button: ['#8F0F1B', '#E11D2E'] as const,
  buttonPressed: ['#6F0A14', '#B8111F'] as const,
  card: ['#15151C', '#1E1E28'] as const,
} as const;

export type MasteryLevel = 'unseen' | 'learning' | 'familiar' | 'mastered';

export const masteryColorTokens: Record<MasteryLevel, keyof ColorTokens> = {
  unseen: 'masteryUnseen',
  learning: 'masteryLearning',
  familiar: 'masteryFamiliar',
  mastered: 'masteryMastered',
};

/** Non-color cue paired with each tier so level is not conveyed by color alone. */
export type MasteryCue = 'none' | 'dot' | 'ring' | 'check';

export const masteryCues: Record<MasteryLevel, MasteryCue> = {
  unseen: 'none',
  learning: 'dot',
  familiar: 'ring',
  mastered: 'check',
};
