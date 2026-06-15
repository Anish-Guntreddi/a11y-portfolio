import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ── Axe zero-violation tests for the form section ────────────────────────────

test('input section: light theme — axe reports zero violations', async ({ page }) => {
  await page.goto('/');
  const section = page.getByTestId('inputs-section');
  await expect(section).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('input section: dark theme — axe reports zero violations', async ({ page }) => {
  await page.goto('/?theme=dark');
  const section = page.getByTestId('inputs-section');
  await expect(section).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

// ── Label association: clicking label focuses input ───────────────────────────

test('clicking the "Full name" label focuses the input', async ({ page }) => {
  await page.goto('/');

  // The label with text "Full name" — click it
  await page.getByText('Full name').click();

  // The associated input should now be focused
  const focused = await page.evaluate(() => {
    const el = document.activeElement as HTMLInputElement | null;
    return el ? { tag: el.tagName.toLowerCase(), testid: el.dataset['testid'] } : null;
  });

  expect(focused?.tag).toBe('input');
  expect(focused?.testid).toBe('normal-input');
});

// ── Error field: aria-invalid + aria-describedby wiring ─────────────────────

test('error field exposes aria-invalid=true', async ({ page }) => {
  await page.goto('/');
  const input = page.getByTestId('error-input');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
});

test('error field aria-describedby resolves to element containing error text', async ({ page }) => {
  await page.goto('/');
  const input = page.getByTestId('error-input');

  const describedBy = await input.getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();

  // Every id token in aria-describedby MUST resolve to a real DOM element —
  // dangling ids are a hard failure (not silently skipped with `if (el)`).
  const result = await page.evaluate((ids: string) => {
    const tokens = ids.trim().split(/\s+/);
    const missing: string[] = [];
    const texts: string[] = [];
    for (const id of tokens) {
      const el = document.getElementById(id);
      if (!el) {
        missing.push(id);
      } else {
        texts.push(el.textContent ?? '');
      }
    }
    return { missing, combinedText: texts.join(' ') };
  }, describedBy as string);

  // Fail immediately if any id is dangling
  expect(result.missing, `Dangling aria-describedby ids: ${result.missing.join(', ')}`).toHaveLength(0);
  expect(result.combinedText).toContain('Please enter a valid email');
});

// ── Keyboard focus: visible outline on Input ──────────────────────────────────

test('Tab to input shows a visible focus ring', async ({ page }) => {
  await page.goto('/');

  // Navigate via real keyboard Tab until the normal-input is document.activeElement.
  // This exercises :focus-visible (programmatic .focus() does not trigger it in all browsers).
  const MAX_TABS = 30;
  let landed = false;
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press('Tab');
    const isTarget = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el?.dataset['testid'] === 'normal-input';
    });
    if (isTarget) { landed = true; break; }
  }
  expect(landed, 'normal-input never received keyboard focus after 30 Tabs').toBe(true);

  const input = page.getByTestId('normal-input');
  const styles = await input.evaluate((el) => {
    const s = window.getComputedStyle(el);
    return {
      outline: s.outline,
      outlineWidth: s.outlineWidth,
      outlineStyle: s.outlineStyle,
      boxShadow: s.boxShadow,
    };
  });

  // Either outline or box-shadow must be visible
  const hasRing =
    (styles.outlineWidth !== '0px' && styles.outlineStyle !== 'none') ||
    (styles.boxShadow !== '' && styles.boxShadow !== 'none');

  expect(
    hasRing,
    `Expected visible focus ring; got outline="${styles.outline}" boxShadow="${styles.boxShadow}"`,
  ).toBe(true);
});

// ── Hostile-className input still shows focus outline ────────────────────────

test('hostile-className input still shows focus outline on keyboard focus', async ({ page }) => {
  await page.goto('/');

  // Navigate via real keyboard Tab until the hostile-focus-input is document.activeElement.
  // This exercises :focus-visible (programmatic .focus() does not trigger it in all browsers).
  const MAX_TABS = 30;
  let landed = false;
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press('Tab');
    const isTarget = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el?.dataset['testid'] === 'hostile-focus-input';
    });
    if (isTarget) { landed = true; break; }
  }
  expect(landed, 'hostile-focus-input never received keyboard focus after 30 Tabs').toBe(true);

  const input = page.getByTestId('hostile-focus-input');
  const outline = await input.evaluate((el) => {
    const s = window.getComputedStyle(el);
    return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth };
  });

  // The CSS rule `.nui-input:focus-visible { outline: 2px solid ... }` must win.
  expect(
    outline.outlineWidth,
    `Expected outline-width 2px from .nui-input:focus-visible rule; got "${outline.outlineWidth}"`,
  ).not.toBe('0px');

  expect(
    outline.outlineStyle,
    `Expected a visible outline style; got "${outline.outlineStyle}"`,
  ).not.toBe('none');
});
