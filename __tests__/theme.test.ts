import { contrastRatio, hexToRgb, meetsContrast, relativeLuminance } from '@/theme/contrast';
import { darkColors, lightColors, masteryColorTokens } from '@/theme/tokens';
import type { ColorTokens } from '@/theme/tokens';

describe('contrast helpers', () => {
  it('parses six-digit hex colors', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#0B0B0F')).toEqual({ r: 11, g: 11, b: 15 });
  });

  it('rejects unsupported color formats', () => {
    expect(() => hexToRgb('white')).toThrow(/Unsupported color format/);
    expect(() => hexToRgb('#FFF')).toThrow();
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
};

const textPairs: ContrastPair[] = [
  { name: 'body text on background', foreground: 'text', background: 'background' },
  { name: 'body text on surface', foreground: 'text', background: 'surface' },
  { name: 'body text on surface2', foreground: 'text', background: 'surface2' },
  { name: 'muted text on background', foreground: 'textMuted', background: 'background' },
  { name: 'muted text on surface', foreground: 'textMuted', background: 'surface' },
  { name: 'muted text on surface2', foreground: 'textMuted', background: 'surface2' },
  {
    name: 'primary accent text on background',
    foreground: 'primaryText',
    background: 'background',
  },
  { name: 'primary accent text on surface', foreground: 'primaryText', background: 'surface' },
  { name: 'primary accent text on surface2', foreground: 'primaryText', background: 'surface2' },
  {
    name: 'primary accent text on primarySoft',
    foreground: 'primaryText',
    background: 'primarySoft',
  },
  { name: 'label on primary button', foreground: 'textOnPrimary', background: 'primary' },
  { name: 'success badge text', foreground: 'success', background: 'successSoft' },
  { name: 'warning badge text', foreground: 'warning', background: 'warningSoft' },
  { name: 'danger badge text', foreground: 'danger', background: 'dangerSoft' },
];

describe.each([
  ['dark', darkColors],
  ['light', lightColors],
] as const)('%s theme contrast', (_name, colors) => {
  it.each(textPairs)('$name meets WCAG AA', ({ foreground, background }) => {
    expect(contrastRatio(colors[foreground], colors[background])).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the four mastery colors visually distinct', () => {
    const values = Object.values(masteryColorTokens).map((token) => colors[token]);
    expect(new Set(values).size).toBe(4);
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
