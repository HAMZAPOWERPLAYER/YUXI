import {
  URDU_LINE_HEIGHT_RATIO,
  URDU_TOP_PADDING_RATIO,
  resolveTextMetrics,
  typography,
} from '@/theme/typography';

describe('resolveTextMetrics', () => {
  it('applies the in-app and OS scales exactly once', () => {
    const result = resolveTextMetrics(typography.body, {
      textScale: 1.25,
      fontScale: 2,
      language: 'en',
      urduFontsLoaded: true,
    });

    expect(result.fontSize).toBeCloseTo(40);
    expect(result.lineHeight).toBeCloseTo(60);
    expect(result.paddingTop).toBe(0);
  });

  it('adds Nastaliq line height and top padding for Urdu', () => {
    const result = resolveTextMetrics(typography.body, {
      textScale: 1,
      fontScale: 1,
      language: 'ur',
      urduFontsLoaded: true,
    });

    expect(result.fontSize).toBe(16);
    expect(result.lineHeight).toBeGreaterThanOrEqual(16 * URDU_LINE_HEIGHT_RATIO);
    expect(result.paddingTop).toBe(Math.round(16 * URDU_TOP_PADDING_RATIO));
  });

  it('uses the fallback Urdu ratio before the font loads', () => {
    const result = resolveTextMetrics(typography.body, {
      textScale: 1,
      fontScale: 1,
      language: 'ur',
      urduFontsLoaded: false,
    });

    expect(result.lineHeight).toBeGreaterThanOrEqual(16 * 1.7);
    expect(result.paddingTop).toBe(0);
  });

  it('does not apply Urdu spacing to Japanese or English', () => {
    const japanese = resolveTextMetrics(typography.kana, {
      textScale: 1,
      fontScale: 1,
      language: 'ja',
      urduFontsLoaded: true,
    });
    const english = resolveTextMetrics(typography.body, {
      textScale: 1,
      fontScale: 1,
      language: 'en',
      urduFontsLoaded: true,
    });

    expect(japanese.lineHeight).toBe(typography.kana.lineHeight);
    expect(english.lineHeight).toBe(typography.body.lineHeight);
  });

  it('caps display and kana sizes at 200% combined scaling', () => {
    for (const variant of ['display', 'title', 'kanaHero'] as const) {
      const token = typography[variant];
      const result = resolveTextMetrics(token, {
        textScale: 2,
        fontScale: 2,
        language: 'en',
        urduFontsLoaded: true,
      });
      expect(result.fontSize).toBeCloseTo(token.fontSize * (token.maxScale ?? 4));
      expect(result.fontSize).toBeLessThan(token.fontSize * 4);
    }
  });

  it('keeps body text uncapped so it reaches the full accessibility scale', () => {
    const result = resolveTextMetrics(typography.body, {
      textScale: 1.6,
      fontScale: 2,
      language: 'en',
      urduFontsLoaded: true,
    });

    expect(result.fontSize).toBeCloseTo(16 * 3.2);
    expect(result.lineHeight).toBeCloseTo(24 * 3.2);
  });
});
