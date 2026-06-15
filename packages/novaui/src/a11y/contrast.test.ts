import { describe, it, expect } from 'vitest';
import { relativeLuminance, contrastRatio } from './contrast';
import { palette } from '../tokens/palette';

describe('relativeLuminance', () => {
  it('black has luminance 0', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
  });

  it('white has luminance 1', () => {
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('accepts 3-digit hex', () => {
    expect(relativeLuminance('#fff')).toBeCloseTo(1, 5);
    expect(relativeLuminance('#000')).toBeCloseTo(0, 5);
  });

  it('accepts 4-digit hex (#rgba) — alpha ignored, equals 3-digit equivalent', () => {
    // #fff0 (white with alpha=0) should equal luminance of #ffffff
    expect(relativeLuminance('#fff0')).toBeCloseTo(relativeLuminance('#ffffff'), 5);
    // #000f (black with alpha=ff) should equal luminance of #000000
    expect(relativeLuminance('#000f')).toBeCloseTo(relativeLuminance('#000000'), 5);
  });

  it('accepts 8-digit hex (#rrggbbaa) — alpha ignored, equals 6-digit equivalent', () => {
    // #1D4ED880 (primary with 50% alpha) should equal luminance of #1D4ED8
    expect(relativeLuminance('#1D4ED880')).toBeCloseTo(relativeLuminance('#1D4ED8'), 5);
    // #FFFFFF00 (white fully transparent) should equal luminance of #FFFFFF
    expect(relativeLuminance('#FFFFFF00')).toBeCloseTo(relativeLuminance('#FFFFFF'), 5);
  });

  it('accepts uppercase hex', () => {
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
    expect(relativeLuminance('#1D4ED8')).toBeCloseTo(relativeLuminance('#1d4ed8'), 5);
  });

  it('throws on malformed input (wrong length)', () => {
    expect(() => relativeLuminance('#12')).toThrow();
    expect(() => relativeLuminance('#12345')).toThrow();
    expect(() => relativeLuminance('#123456789')).toThrow();
  });

  it('throws on non-hex characters', () => {
    expect(() => relativeLuminance('#GGGGGG')).toThrow();
    expect(() => relativeLuminance('red')).toThrow();
    expect(() => relativeLuminance('rgb(0,0,0)')).toThrow();
  });
});

describe('contrastRatio', () => {
  it('black on white equals 21', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });

  it('white on white equals 1', () => {
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    const a = contrastRatio('#1D4ED8', '#FFFFFF');
    const b = contrastRatio('#FFFFFF', '#1D4ED8');
    expect(a).toBeCloseTo(b, 10);
  });
});

// ── WCAG AA palette assertions ──────────────────────────────────────────────

describe('light theme WCAG AA', () => {
  const { bg, fg, mutedFg, border, primary, primaryFg, danger, dangerFg, focusRing } =
    palette.light;

  it('fg on bg ≥ 7:1 (AAA body text)', () => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(7);
  });

  it('mutedFg on bg ≥ 4.5:1 (AA normal text)', () => {
    expect(contrastRatio(mutedFg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('primaryFg on primary ≥ 4.5:1', () => {
    expect(contrastRatio(primaryFg, primary)).toBeGreaterThanOrEqual(4.5);
  });

  it('dangerFg on danger ≥ 4.5:1', () => {
    expect(contrastRatio(dangerFg, danger)).toBeGreaterThanOrEqual(4.5);
  });

  it('border on bg ≥ 3:1 (AA non-text)', () => {
    expect(contrastRatio(border, bg)).toBeGreaterThanOrEqual(3);
  });

  it('focusRing on bg ≥ 3:1 (AA focus indicator)', () => {
    expect(contrastRatio(focusRing, bg)).toBeGreaterThanOrEqual(3);
  });
});

describe('dark theme WCAG AA', () => {
  const { bg, fg, mutedFg, border, primary, primaryFg, danger, dangerFg, focusRing } =
    palette.dark;

  it('fg on bg ≥ 7:1 (AAA body text)', () => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(7);
  });

  it('mutedFg on bg ≥ 4.5:1 (AA normal text)', () => {
    expect(contrastRatio(mutedFg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('primaryFg on primary ≥ 4.5:1', () => {
    expect(contrastRatio(primaryFg, primary)).toBeGreaterThanOrEqual(4.5);
  });

  it('dangerFg on danger ≥ 4.5:1', () => {
    expect(contrastRatio(dangerFg, danger)).toBeGreaterThanOrEqual(4.5);
  });

  it('border on bg ≥ 3:1 (AA non-text)', () => {
    expect(contrastRatio(border, bg)).toBeGreaterThanOrEqual(3);
  });

  it('focusRing on bg ≥ 3:1 (AA focus indicator)', () => {
    expect(contrastRatio(focusRing, bg)).toBeGreaterThanOrEqual(3);
  });
});
