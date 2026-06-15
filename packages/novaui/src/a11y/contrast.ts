/**
 * WCAG 2.x relative luminance and contrast ratio utilities.
 * Pure functions — no DOM, no side-effects, usable in tests and at build time.
 */

/**
 * Convert an 8-bit sRGB channel value (0–255) to linear light.
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Parse a hex colour string to [r, g, b] channel values (0–255).
 *
 * Accepted formats (case-insensitive, leading # optional):
 *   #rgb        3-digit shorthand
 *   #rrggbb     6-digit full
 *   #rgba       4-digit shorthand with alpha — alpha is ignored
 *   #rrggbbaa   8-digit full with alpha   — alpha is ignored
 *
 * Throws a descriptive Error for any other input.
 */
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace(/^#/, '').toLowerCase();

  let r: number, g: number, b: number;

  if (h.length === 3 || h.length === 4) {
    // #rgb or #rgba — expand each nibble
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
  } else if (h.length === 6 || h.length === 8) {
    // #rrggbb or #rrggbbaa
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  } else {
    throw new Error(
      `parseHex: invalid hex colour "${hex}". ` +
      'Expected #rgb, #rrggbb, #rgba, or #rrggbbaa (with or without leading #).',
    );
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error(
      `parseHex: non-hex characters in "${hex}". ` +
      'Only 0-9 and a-f/A-F are allowed.',
    );
  }

  return [r, g, b];
}

/**
 * Relative luminance of a hex colour string.
 * Accepts #rgb, #rrggbb, #rgba, #rrggbbaa (alpha ignored).
 * Returns a value in [0, 1] where 0 = black and 1 = white.
 * Throws on malformed input.
 */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * WCAG 2.x contrast ratio between two hex colours.
 * Returns a value in [1, 21] (white-on-black ≈ 21:1).
 * Throws on malformed input.
 */
export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
