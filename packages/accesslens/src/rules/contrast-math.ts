/**
 * Pure contrast-ratio math for WCAG 2.x.
 * No DOM or browser dependencies — unit-testable in Node.
 */

/** Parse "rgb(r,g,b)" or "rgba(r,g,b,a)" into { r, g, b } (0–255). */
export function parseRgb(css: string): { r: number; g: number; b: number } {
  const m = css.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  if (!m) throw new Error(`Cannot parse colour: ${css}`);
  return { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10) };
}

/** Relative luminance per WCAG 2.x (IEC 61966-2-1 sRGB). */
export function relativeLuminance(r: number, g: number, b: number): number {
  const linearise = (c: number): number => {
    const sRGB = c / 255;
    return sRGB <= 0.04045 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/**
 * WCAG contrast ratio between two CSS colour strings.
 * Returns a value in [1, 21].
 */
export function contrastRatio(cssA: string, cssB: string): number {
  const a = parseRgb(cssA);
  const b = parseRgb(cssB);
  const L1 = relativeLuminance(a.r, a.g, a.b);
  const L2 = relativeLuminance(b.r, b.g, b.b);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns true when the text qualifies as "large" per WCAG 1.4.3:
 * >= 24 px normal weight, OR >= 18.66 px bold (weight >= 700).
 */
export function isLargeText(fontSizePx: number, fontWeightNum: number): boolean {
  return fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeightNum >= 700);
}
