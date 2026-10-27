/**
 * WCAG 2.1 relative luminance and contrast helpers.
 * Kept dependency-free so the contrast contract can be unit tested.
 */

export type Rgb = { r: number; g: number; b: number };

const HEX_PATTERN = /^#([0-9a-fA-F]{6})$/;

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

function channelLuminance(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
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
