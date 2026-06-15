/**
 * Canonical hex values for the NovaUI design token palette.
 *
 * These values are the single source of truth used by:
 *  - tokens.css  (channel triplets derived from these hex values — see rgbTriplet below)
 *  - contrast.test.ts  (asserts WCAG AA thresholds at test time)
 *
 * The `rgbTriplet` helper converts a 6-digit hex to "R G B" channel notation,
 * which is what tokens.css uses so that Tailwind opacity utilities work:
 *   e.g.  bg-primary/10  →  rgb(var(--color-primary) / 0.1)
 *
 * Verified contrast ratios (WCAG 2.x):
 *
 * Light theme
 *   fg / bg:              19.20  (≥7 ✓)
 *   mutedFg / bg:          7.56  (≥4.5 ✓)
 *   primaryFg / primary:   6.70  (≥4.5 ✓)
 *   dangerFg / danger:     6.47  (≥4.5 ✓)
 *   border / bg:           4.83  (≥3 ✓)
 *   focusRing / bg:        6.70  (≥3 ✓)
 *
 * Dark theme
 *   fg / bg:              17.53  (≥7 ✓)
 *   mutedFg / bg:          7.49  (≥4.5 ✓)
 *   primaryFg / primary:   7.55  (≥4.5 ✓)
 *   dangerFg / danger:    10.12  (≥4.5 ✓)
 *   border / bg:           4.74  (≥3 ✓)
 *   focusRing / bg:        7.55  (≥3 ✓)
 */
export const palette = {
  light: {
    bg:        '#FFFFFF',
    surface:   '#F8F9FA',
    fg:        '#0D0F11',
    mutedFg:   '#4B5563',
    border:    '#6B7280',
    primary:   '#1D4ED8',
    primaryFg: '#FFFFFF',
    danger:    '#B91C1C',
    dangerFg:  '#FFFFFF',
    focusRing: '#1D4ED8',
  },
  dark: {
    bg:        '#0D0F11',
    surface:   '#1A1D22',
    fg:        '#F1F5F9',
    mutedFg:   '#94A3B8',
    border:    '#708090',
    primary:   '#60A5FA',
    primaryFg: '#0D0F11',
    danger:    '#FCA5A5',
    dangerFg:  '#0D0F11',
    focusRing: '#60A5FA',
  },
} as const;

/**
 * Convert a 6-digit hex colour to a space-separated sRGB channel triplet string.
 * Used to generate the values stored in tokens.css so Tailwind opacity utilities work.
 *
 * Example: rgbTriplet('#1D4ED8') → '29 78 216'
 */
export function rgbTriplet(hex: string): string {
  const h = hex.replace(/^#/, '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}
