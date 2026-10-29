import {
  compositeOver,
  contrastRatio,
  hexToRgb,
  meetsContrast,
  parseColor,
  relativeLuminance,
} from '@/theme/contrast';
import {
  darkColors,
  gradients,
  lightColors,
  masteryColorTokens,
  masteryCues,
} from '@/theme/tokens';
import type { ColorTokens } from '@/theme/tokens';

describe('contrast helpers', () => {
  it('parses six-digit hex colors', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#0B0B0F')).toEqual({ r: 11, g: 11, b: 15 });
  });

  it('parses rgba tokens', () => {
    expect(parseColor('rgba(225, 29, 46, 0.14)')).toEqual({ r: 225, g: 29, b: 46, a: 0.14 });
    expect(parseColor('#E11D2E')).toEqual({ r: 225, g: 29, b: 46, a: 1 });
  });

  it('composites a translucent token over an opaque surface', () => {
    expect(compositeOver('rgba(225, 29, 46, 0.14)', '#0B0B0F')).toMatch(/^#[0-9A-F]{6}$/);
    expect(compositeOver('#E11D2E', '#0B0B0F')).toBe('#E11D2E');
  });

  it('rejects unsupported color formats', () => {
    expect(() => hexToRgb('white')).toThrow(/Unsupported color format/);
    expect(() => hexToRgb('#FFF')).toThrow();
    expect(() => parseColor('white')).toThrow(/Unsupported color format/);
  });

  it('refuses to measure translucent colours without a surface', () => {
    expect(() => relativeLuminance('rgba(225, 29, 46, 0.14)')).toThrow(/Composite/);
  });

  it('matches the WCAG reference ratios for black and white', () => {
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('applies AA, AA-large and AAA thresholds', () => {
    expect(meetsContrast('#FFFFFF', '#000000', 'AAA')).toBe(true);
    expect(meetsContrast('#777777', '#FFFFFF', 'AA')).toBe(false);
    expect(meetsContrast('#777777', '#FFFFFF', 'AA-large')).toBe(true);
  });
});

type ContrastPair = {
  name: string;
  foreground: keyof ColorTokens;
  background: keyof ColorTokens;
  /** Opaque surface behind a translucent background token. */
  base?: keyof ColorTokens;
};

const textPairs: ContrastPair[] = [
  { name: 'body text on background', foreground: 'text', background: 'background' },
  { name: 'body text on bgElevated', foreground: 'text', background: 'bgElevated' },
  { name: 'body text on surface', foreground: 'text', background: 'surface' },
  { name: 'body text on surface2', foreground: 'text', background: 'surface2' },
  { name: 'body text on surface3', foreground: 'text', background: 'surface3' },
  { name: 'muted text on background', foreground: 'textMuted', background: 'background' },
  { name: 'muted text on bgElevated', foreground: 'textMuted', background: 'bgElevated' },
  { name: 'muted text on surface', foreground: 'textMuted', background: 'surface' },
  { name: 'muted text on surface2', foreground: 'textMuted', background: 'surface2' },
  { name: 'muted text on surface3', foreground: 'textMuted', background: 'surface3' },
  {
    name: 'primary accent text on background',
    foreground: 'primaryText',
    background: 'background',
  },
  { name: 'primary accent text on surface', foreground: 'primaryText', background: 'surface' },
  { name: 'primary accent text on surface2', foreground: 'primaryText', background: 'surface2' },
  { name: 'label on primary button', foreground: 'textOnPrimary', background: 'primary' },
  { name: 'success badge text', foreground: 'success', background: 'successSoft' },
  { name: 'warning badge text', foreground: 'warning', background: 'warningSoft' },
  { name: 'info badge text', foreground: 'info', background: 'infoSoft' },
  { name: 'danger badge text', foreground: 'danger', background: 'dangerSoft' },
];

const translucentPairs: ContrastPair[] = [
  {
    name: 'primary accent text on primarySoft over background',
    foreground: 'primaryText',
    background: 'primarySoft',
    base: 'background',
  },
  {
    name: 'primary accent text on primarySoft over surface',
    foreground: 'primaryText',
    background: 'primarySoft',
    base: 'surface',
  },
  {
    name: 'primary accent text on primarySoft over surface2',
    foreground: 'primaryText',
    background: 'primarySoft',
    base: 'surface2',
  },
  {
    name: 'primary accent text on primarySoft over surface3',
    foreground: 'primaryText',
    background: 'primarySoft',
    base: 'surface3',
  },
];

function pairRatio(colors: ColorTokens, pair: ContrastPair): number {
  const base = colors[pair.base ?? 'background'];
  const background = compositeOver(colors[pair.background], base);
  return contrastRatio(colors[pair.foreground], background);
}

describe.each([
  ['dark', darkColors],
  ['light', lightColors],
] as const)('%s theme contrast', (_name, colors) => {
  it.each([...textPairs, ...translucentPairs])('$name meets WCAG AA', (pair) => {
    expect(pairRatio(colors, pair)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps every CTA gradient endpoint safe for its white label', () => {
    for (const endpoint of gradients.button) {
      expect(contrastRatio(colors.textOnPrimary, endpoint)).toBeGreaterThanOrEqual(4.5);
    }
    for (const endpoint of gradients.buttonPressed) {
      expect(contrastRatio(colors.textOnPrimary, endpoint)).toBeGreaterThanOrEqual(4.5);
    }
    // The bright decorative endpoint is reserved for accent fills and must not
    // carry normal-size white text.
    expect(contrastRatio(colors.textOnPrimary, colors.primaryBright)).toBeGreaterThanOrEqual(3);
  });

  it('keeps the four mastery colors visually distinct', () => {
    const values = Object.values(masteryColorTokens).map((token) => colors[token]);
    expect(new Set(values).size).toBe(4);
  });

  it('keeps every mastery tier at 3:1 against the card surface', () => {
    for (const token of Object.values(masteryColorTokens)) {
      expect(contrastRatio(colors[token], colors.surface)).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('mastery cues', () => {
  it('uses a different non-color shape for every tier', () => {
    expect(new Set(Object.values(masteryCues)).size).toBe(4);
  });
});

describe('brand colors', () => {
  it('keeps the specified crimson as the primary fill in dark mode', () => {
    expect(darkColors.primary).toBe('#E11D2E');
    expect(darkColors.background).toBe('#0B0B0F');
  });

  it('keeps the crimson accent visible as a graphical element', () => {
    // WCAG 1.4.11 requires 3:1 for non-text UI boundaries and indicators.
    expect(contrastRatio(darkColors.primary, darkColors.background)).toBeGreaterThanOrEqual(3);
  });
});
