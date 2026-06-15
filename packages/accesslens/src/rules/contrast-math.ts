/**
 * Pure contrast-ratio math for WCAG 2.x.
 * No DOM or browser dependencies — unit-testable in Node.
 */

/**
 * Parse a CSS rgb/rgba colour string into { r, g, b, a } (channels 0–255, alpha 0–1).
 *
 * Supports:
 *   Legacy comma syntax:  rgb(r, g, b)  /  rgba(r, g, b, a)
 *   CSS Color-4 syntax:   rgb(r g b)    /  rgb(r g b / a)
 *
 * Special keywords handled:
 *   transparent → { r:0, g:0, b:0, a:0 }  (fully transparent)
 *   currentColor / inherit / initial / …   → throws (caller should catch + skip)
 *
 * Throws with /Cannot parse colour/ for unrecognised input so callers can
 * distinguish "skip this node" from programming errors.
 */
export function parseRgb(css: string): { r: number; g: number; b: number; a: number } {
  const trimmed = css.trim();

  // Handle keyword: transparent
  if (trimmed === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // Legacy comma syntax: rgb(r, g, b) or rgba(r, g, b, a)
  const legacy = trimmed.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/,
  );
  if (legacy) {
    const a = legacy[4] !== undefined ? parseFloat(legacy[4]) : 1;
    return { r: parseInt(legacy[1], 10), g: parseInt(legacy[2], 10), b: parseInt(legacy[3], 10), a };
  }

  // CSS Color-4 space-separated: rgb(r g b) or rgb(r g b / a)
  const modern = trimmed.match(
    /^rgba?\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\s*\)$/,
  );
  if (modern) {
    const a = modern[4] !== undefined ? parseFloat(modern[4]) : 1;
    return { r: parseInt(modern[1], 10), g: parseInt(modern[2], 10), b: parseInt(modern[3], 10), a };
  }

  throw new Error(`Cannot parse colour: ${css}`);
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
 * Composite a foreground colour over a background colour using the Porter-Duff
 * "over" operator (straight alpha). All channels 0–255, alpha 0–1.
 * Returns opaque { r, g, b, a:1 }.
 */
export function compositeOver(
  fg: { r: number; g: number; b: number; a: number },
  bg: { r: number; g: number; b: number; a: number },
): { r: number; g: number; b: number; a: number } {
  const a = fg.a + bg.a * (1 - fg.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const r = (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a;
  const g = (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a;
  const b = (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a;
  return { r, g, b, a };
}

/**
 * WCAG contrast ratio between two CSS colour strings.
 * Returns a value in [1, 21].
 *
 * If either colour is meaningfully translucent (alpha < 0.9) AND cannot be
 * resolved to an opaque colour, returns null so the caller can skip the node.
 * Fully opaque colours (alpha >= 0.9) are treated as opaque for WCAG purposes.
 */
export function contrastRatio(cssA: string, cssB: string): number {
  const a = parseRgb(cssA);
  const b = parseRgb(cssB);
  // Skip nodes with meaningfully translucent foreground or background where we
  // cannot determine the actual perceived colour.
  if (a.a < 0.9 || b.a < 0.9) {
    // Composite each over the assumed canvas white (rgb 255 255 255) to get an
    // approximation rather than erroring. For near-transparent (a < 0.1) skip.
    if (a.a < 0.1 || b.a < 0.1) {
      // One colour is essentially invisible — contrast is undefined / misleading
      throw new Error(`Cannot determine contrast: colour is near-transparent (${cssA}, ${cssB})`);
    }
    const white = { r: 255, g: 255, b: 255, a: 1 };
    const ca = compositeOver(a, white);
    const cb = compositeOver(b, white);
    const L1 = relativeLuminance(ca.r, ca.g, ca.b);
    const L2 = relativeLuminance(cb.r, cb.g, cb.b);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  }
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
