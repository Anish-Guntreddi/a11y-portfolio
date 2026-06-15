import { describe, expect, it } from 'vitest';
import { parseRgb, contrastRatio, compositeOver, isLargeText } from './contrast-math.js';

describe('parseRgb', () => {
  it('parses rgb() strings', () => {
    expect(parseRgb('rgb(0, 0, 0)')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    expect(parseRgb('rgb(255, 255, 255)')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it('parses rgba() strings (preserves alpha)', () => {
    expect(parseRgb('rgba(170, 170, 170, 1)')).toEqual({ r: 170, g: 170, b: 170, a: 1 });
    expect(parseRgb('rgba(0, 0, 0, 0.5)')).toEqual({ r: 0, g: 0, b: 0, a: 0.5 });
  });

  it('parses CSS Color-4 space-separated rgb(r g b)', () => {
    expect(parseRgb('rgb(1 2 3)')).toEqual({ r: 1, g: 2, b: 3, a: 1 });
  });

  it('parses CSS Color-4 rgb(r g b / a)', () => {
    expect(parseRgb('rgb(1 2 3 / 0.5)')).toEqual({ r: 1, g: 2, b: 3, a: 0.5 });
  });

  it('parses transparent keyword', () => {
    expect(parseRgb('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });

  it('throws on unparseable input (currentColor)', () => {
    expect(() => parseRgb('currentColor')).toThrow(/Cannot parse colour/);
  });

  it('throws on unparseable input (inherit)', () => {
    expect(() => parseRgb('inherit')).toThrow(/Cannot parse colour/);
  });
});

describe('contrastRatio', () => {
  it('black on white = 21', () => {
    const ratio = contrastRatio('rgb(0,0,0)', 'rgb(255,255,255)');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('white on white = 1', () => {
    const ratio = contrastRatio('rgb(255,255,255)', 'rgb(255,255,255)');
    expect(ratio).toBeCloseTo(1, 4);
  });

  it('is symmetric (order of arguments does not matter)', () => {
    const r1 = contrastRatio('rgb(0,0,0)', 'rgb(255,255,255)');
    const r2 = contrastRatio('rgb(255,255,255)', 'rgb(0,0,0)');
    expect(r1).toBeCloseTo(r2, 10);
  });

  it('#aaa on #fff ≈ 2.32 (fails AA 4.5 threshold)', () => {
    // #aaa = rgb(170,170,170)
    const ratio = contrastRatio('rgb(170,170,170)', 'rgb(255,255,255)');
    // WCAG reference value is ~2.32:1
    expect(ratio).toBeGreaterThan(2.0);
    expect(ratio).toBeLessThan(3.0);
  });

  it('#222 on #fff ≈ 16:1 (passes AA)', () => {
    const ratio = contrastRatio('rgb(34,34,34)', 'rgb(255,255,255)');
    expect(ratio).toBeGreaterThan(4.5);
  });

  it('accepts rgba() strings', () => {
    // Same as black / white
    const ratio = contrastRatio('rgba(0,0,0,1)', 'rgba(255,255,255,1)');
    expect(ratio).toBeCloseTo(21, 0);
  });
});

describe('compositeOver', () => {
  it('opaque over opaque returns fg unchanged', () => {
    const fg = { r: 100, g: 100, b: 100, a: 1 };
    const bg = { r: 255, g: 255, b: 255, a: 1 };
    const result = compositeOver(fg, bg);
    expect(result.r).toBeCloseTo(100, 0);
    expect(result.g).toBeCloseTo(100, 0);
    expect(result.b).toBeCloseTo(100, 0);
    expect(result.a).toBeCloseTo(1, 5);
  });

  it('transparent fg leaves bg colour', () => {
    const fg = { r: 0, g: 0, b: 0, a: 0 };
    const bg = { r: 255, g: 255, b: 255, a: 1 };
    const result = compositeOver(fg, bg);
    expect(result.r).toBeCloseTo(255, 0);
    expect(result.g).toBeCloseTo(255, 0);
    expect(result.b).toBeCloseTo(255, 0);
  });

  it('50% black over white gives grey', () => {
    const fg = { r: 0, g: 0, b: 0, a: 0.5 };
    const bg = { r: 255, g: 255, b: 255, a: 1 };
    const result = compositeOver(fg, bg);
    expect(result.r).toBeCloseTo(127.5, 0);
    expect(result.a).toBeCloseTo(1, 5);
  });
});

describe('contrastRatio — alpha handling', () => {
  it('near-transparent colour (a < 0.1) throws so caller can skip', () => {
    expect(() => contrastRatio('rgba(0,0,0,0.05)', 'rgb(255,255,255)')).toThrow();
  });

  it('transparent keyword throws so caller can skip', () => {
    expect(() => contrastRatio('transparent', 'rgb(255,255,255)')).toThrow();
  });

  it('semi-transparent 50% black on white is composited (does not throw)', () => {
    // rgba(0,0,0,0.5) composited over white → approx rgb(128,128,128) → ~3.95:1
    const ratio = contrastRatio('rgba(0,0,0,0.5)', 'rgb(255,255,255)');
    expect(ratio).toBeGreaterThan(1);
    expect(ratio).toBeLessThan(21);
  });
});

describe('isLargeText', () => {
  it('24 px normal weight is large', () => {
    expect(isLargeText(24, 400)).toBe(true);
  });

  it('23.9 px normal weight is NOT large', () => {
    expect(isLargeText(23.9, 400)).toBe(false);
  });

  it('18.66 px bold (700) is large', () => {
    expect(isLargeText(18.66, 700)).toBe(true);
  });

  it('18.65 px bold is NOT large', () => {
    expect(isLargeText(18.65, 700)).toBe(false);
  });

  it('18.66 px weight 400 is NOT large', () => {
    expect(isLargeText(18.66, 400)).toBe(false);
  });

  it('30 px any weight is large', () => {
    expect(isLargeText(30, 100)).toBe(true);
  });
});
