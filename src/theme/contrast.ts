/**
 * WCAG 2.1 relative luminance and contrast helpers.
 * Kept dependency-free so the contrast contract can be unit tested.
 */

export type Rgb = { r: number; g: number; b: number };
export type Rgba = Rgb & { a: number };

const HEX_PATTERN = /^#([0-9a-fA-F]{6})$/;
const RGBA_PATTERN =
  /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d*\.?\d+))?\s*\)$/i;

export function hexToRgb(hex: string): Rgb {
  const match = HEX_PATTERN.exec(hex.trim());
  if (!match?.[1]) {
    throw new Error(`Unsupported color format: ${hex}. Expected #RRGGBB.`);
  }
  const value = match[1];
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

/** Parses the opaque hex and rgba() forms used by the design tokens. */
export function parseColor(color: string): Rgba {
  const hex = HEX_PATTERN.exec(color.trim());
  if (hex?.[1]) {
    return { ...hexToRgb(color), a: 1 };
  }

  const rgba = RGBA_PATTERN.exec(color.trim());
  if (rgba?.[1] && rgba[2] && rgba[3]) {
    const r = Number.parseInt(rgba[1], 10);
    const g = Number.parseInt(rgba[2], 10);
    const b = Number.parseInt(rgba[3], 10);
    const a = rgba[4] === undefined ? 1 : Number.parseFloat(rgba[4]);
    if (r > 255 || g > 255 || b > 255 || a < 0 || a > 1) {
      throw new Error(`Color channel out of range: ${color}`);
    }
    return { r, g, b, a };
  }

  throw new Error(`Unsupported color format: ${color}. Expected #RRGGBB or rgba().`);
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

/**
 * Flattens a translucent token over an opaque surface. Use this before
 * measuring contrast for colours such as primarySoft and glow.
 */
export function compositeOver(color: string, background: string): string {
  const foreground = parseColor(color);
  const base = parseColor(background);
  if (base.a < 1) {
    throw new Error('The background passed to compositeOver must be opaque.');
  }
  if (foreground.a >= 1) return rgbToHex(foreground);

  return rgbToHex({
    r: foreground.r * foreground.a + base.r * (1 - foreground.a),
    g: foreground.g * foreground.a + base.g * (1 - foreground.a),
    b: foreground.b * foreground.a + base.b * (1 - foreground.a),
  });
}

function channelLuminance(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: string): number {
  const { r, g, b, a } = parseColor(color);
  if (a < 1) {
    throw new Error(
      `Cannot measure translucent colour ${color}. Composite it over its surface first.`,
    );
  }
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

export function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AA-large' | 'AAA' = 'AA',
): boolean {
  const ratio = contrastRatio(foreground, background);
  const threshold = level === 'AAA' ? 7 : level === 'AA-large' ? 3 : 4.5;
  return ratio >= threshold;
}
