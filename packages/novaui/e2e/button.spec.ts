import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ── Axe zero-violation tests ─────────────────────────────────────────────────

test('light theme: axe reports zero violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withRules(['color-contrast'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('dark theme: axe reports zero violations', async ({ page }) => {
  await page.goto('/?theme=dark');
  const results = await new AxeBuilder({ page })
    .withRules(['color-contrast'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('full axe audit (light theme): zero violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('full axe audit (dark theme): zero violations', async ({ page }) => {
  await page.goto('/?theme=dark');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

// ── Keyboard: Tab focus + visible focus ring ──────────────────────────────────

test('Tab moves focus to a button and renders a visible focus ring', async ({ page }) => {
  await page.goto('/');

  // Tab into the page — first interactive element (Increment button) should receive focus
  await page.keyboard.press('Tab');

  // The focused element should be a native button element
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase());
  expect(focusedTag).toBe('button');

  // Verify focus ring is visible: evaluate styles on the actually focused element.
  // Tailwind's focus-visible:ring-2 generates a box-shadow via the ring utility
  // (outline is set to none by focus-visible:outline-none, ring appears as box-shadow).
  const styles = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return { outline: '', boxShadow: '', outlineWidth: '' };
    const s = window.getComputedStyle(el);
    return {
      outline: s.outline,
      boxShadow: s.boxShadow,
      outlineWidth: s.outlineWidth,
    };
  });

  // Tailwind ring renders as box-shadow; check it's not 'none'
  const hasRing =
    (styles.boxShadow !== '' && styles.boxShadow !== 'none') ||
    (styles.outline !== '' && styles.outline !== 'none' && styles.outlineWidth !== '0px');

  expect(hasRing, `Expected visible focus ring; got outline="${styles.outline}" boxShadow="${styles.boxShadow}"`).toBe(true);
});

// ── Fix 1 regression guard: hover opacity utilities emit real CSS ─────────────

test('primary button hover applies opacity utility (bg-primary/90 compiles)', async ({ page }) => {
  await page.goto('/');

  const btn = page.getByRole('button', { name: 'primary button', exact: true });

  // Verify that the hover Tailwind class actually exists in the stylesheet
  // by checking the button has the hover class in its class list.
  const hasHoverClass = await btn.evaluate((el) =>
    el.classList.contains('hover:bg-primary/90'),
  );
  expect(
    hasHoverClass,
    'Button must have hover:bg-primary/90 class — verifies opacity utility was compiled into className',
  ).toBe(true);

  // Verify the class compiles to a real CSS rule by checking computed styles after hover.
  // Disable transitions so the computed value is stable immediately on hover.
  await btn.evaluate((el) => {
    (el as HTMLElement).style.transition = 'none';
  });
  await btn.hover();

  // After hover, with transitions disabled, getComputedStyle should reflect the hover rule.
  // bg-primary/90 compiles to background-color with alpha < 1 (rgba) or a different solid colour
  // depending on how the browser composites it. The key proof: the CSS rule MUST exist.
  // We confirm by reading the matched CSS rule directly.
  const hoverRuleExists = await page.evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          if (rule instanceof CSSStyleRule && rule.selectorText === '.hover\\:bg-primary\\/90:hover') {
            return true;
          }
        }
      } catch {
        // cross-origin sheet — skip
      }
    }
    return false;
  });

  expect(
    hoverRuleExists,
    'CSS rule .hover\\:bg-primary\\/90:hover must exist in a stylesheet — proves opacity utility compiled',
  ).toBe(true);
});

// ── Fix 3 regression guard: hostile className cannot remove focus ring ────────

test('button with hostile className still shows focus outline on keyboard focus', async ({ page }) => {
  await page.goto('/');

  const btn = page.getByTestId('hostile-focus-btn');

  // Focus via keyboard (Tab) so :focus-visible fires
  await btn.focus();

  const outline = await btn.evaluate((el) => {
    const s = window.getComputedStyle(el);
    return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth };
  });

  // The CSS rule `.nui-button:focus-visible { outline: 2px solid ... }` must win.
  // outline-none sets outline-width: 0px; our rule sets 2px — check it's not 0.
  expect(
    outline.outlineWidth,
    `Expected outline-width 2px from .nui-button:focus-visible rule; got "${outline.outlineWidth}"`,
  ).not.toBe('0px');

  expect(
    outline.outlineStyle,
    `Expected a visible outline style; got "${outline.outlineStyle}"`,
  ).not.toBe('none');
});

// ── Activation: Enter and Space increment the counter ────────────────────────

test('Enter on counter button increments the count', async ({ page }) => {
  await page.goto('/');

  const counterBtn = page.getByRole('button', { name: 'Increment counter' });
  await counterBtn.focus();

  // Verify initial state
  await expect(page.getByText('clicks: 0')).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page.getByText('clicks: 1')).toBeVisible();
});

test('Space on counter button increments the count', async ({ page }) => {
  await page.goto('/');

  const counterBtn = page.getByRole('button', { name: 'Increment counter' });
  await counterBtn.focus();

  // Start from 0 (or whatever state is clean per test)
  const initialText = await page.getByText(/clicks: \d+/).textContent();
  const initialCount = parseInt(initialText?.replace('clicks: ', '') ?? '0', 10);

  await page.keyboard.press('Space');
  await expect(page.getByText(`clicks: ${initialCount + 1}`)).toBeVisible();
});
