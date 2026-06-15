import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function openModal(page: import('@playwright/test').Page) {
  await page.getByTestId('open-dialog-btn').click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

// ── Axe: zero violations in both themes ──────────────────────────────────────

test('modal open — light theme: axe reports zero violations', async ({ page }) => {
  await page.goto('/');
  await openModal(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('modal open — dark theme: axe reports zero violations', async ({ page }) => {
  await page.goto('/?theme=dark');
  await openModal(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

// ── ARIA attributes ───────────────────────────────────────────────────────────

test('dialog has aria-modal="true" and aria-labelledby pointing to title', async ({ page }) => {
  await page.goto('/');
  await openModal(page);

  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAttribute('aria-modal', 'true');

  const labelledBy = await dialog.getAttribute('aria-labelledby');
  expect(labelledBy).toBeTruthy();

  const titleText = await page.evaluate((id: string) => {
    const el = document.getElementById(id);
    return el ? el.textContent : null;
  }, labelledBy!);

  expect(titleText).toBe('Example dialog');
});

// ── Focus: initial focus inside dialog ───────────────────────────────────────

test('opening the dialog moves focus inside it', async ({ page }) => {
  await page.goto('/');
  await openModal(page);

  const isFocusInDialog = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    return dialog ? dialog.contains(document.activeElement) : false;
  });
  expect(isFocusInDialog).toBe(true);
});

// ── Focus trap: Tab cycles within the dialog ──────────────────────────────────

test('focus trap: Tab never leaves the dialog', async ({ page }) => {
  await page.goto('/');
  await openModal(page);

  // Tab 10 times and verify focus never escapes
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    const isFocusInDialog = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return dialog ? dialog.contains(document.activeElement) : false;
    });
    expect(isFocusInDialog, `Focus left the dialog on Tab press ${i + 1}`).toBe(true);
  }
});

test('focus trap: Tab from last focusable wraps to first', async ({ page }) => {
  await page.goto('/');
  await openModal(page);

  // Count focusable elements in the dialog
  const focusableCount = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    if (!dialog) return 0;
    const SELECTOR = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    return dialog.querySelectorAll(SELECTOR).length;
  });

  // Tab through all focusable elements to reach the last one
  for (let i = 0; i < focusableCount - 1; i++) {
    await page.keyboard.press('Tab');
  }

  // Get the last focusable element
  const lastActiveId = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    if (!dialog) return null;
    const SELECTOR = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(SELECTOR));
    return focusable[focusable.length - 1]?.getAttribute('data-testid') ??
      focusable[focusable.length - 1]?.textContent?.trim() ?? null;
  });

  // One more Tab from last should wrap to first
  await page.keyboard.press('Tab');

  const firstFocusableId = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    if (!dialog) return null;
    const SELECTOR = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(SELECTOR));
    return focusable[0]?.getAttribute('data-testid') ??
      focusable[0]?.textContent?.trim() ?? null;
  });

  const currentActive = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el?.getAttribute('data-testid') ?? el?.textContent?.trim() ?? null;
  });

  // After wrapping, the active element should be the first focusable
  expect(currentActive, `Expected focus to wrap to first focusable ("${firstFocusableId}") after Tab from last ("${lastActiveId}")`).toBe(firstFocusableId);
});

test('focus trap: Shift+Tab from first focusable wraps to last', async ({ page }) => {
  await page.goto('/');
  await openModal(page);

  // Focus starts somewhere inside dialog. Shift+Tab from the first element should land on last.
  // First, ensure we're on the first focusable (it should be after open).
  // Move to first focusable by pressing Shift+Tab from wherever we are (wraps to last, then Tab to first)
  await page.keyboard.press('Tab'); // move off initial focus if needed

  // Navigate to first focusable element
  const firstFocusableText = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    if (!dialog) return null;
    const SELECTOR = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(SELECTOR));
    return focusable[0]?.getAttribute('data-testid') ?? focusable[0]?.textContent?.trim() ?? null;
  });

  // Focus the first element directly
  await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    if (!dialog) return;
    const SELECTOR = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(SELECTOR));
    focusable[0]?.focus();
  });

  // Shift+Tab from first should wrap to last
  await page.keyboard.press('Shift+Tab');

  const lastFocusableText = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    if (!dialog) return null;
    const SELECTOR = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(SELECTOR));
    return focusable[focusable.length - 1]?.getAttribute('data-testid') ??
      focusable[focusable.length - 1]?.textContent?.trim() ?? null;
  });

  const currentActive = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el?.getAttribute('data-testid') ?? el?.textContent?.trim() ?? null;
  });

  expect(currentActive, `Expected focus to wrap to last focusable ("${lastFocusableText}") on Shift+Tab from first ("${firstFocusableText}")`).toBe(lastFocusableText);
});

// ── Esc closes and restores focus ─────────────────────────────────────────────

test('Escape closes the modal and returns focus to the trigger button', async ({ page }) => {
  await page.goto('/');
  await openModal(page);

  await expect(page.getByRole('dialog')).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(page.getByRole('dialog')).not.toBeVisible();

  // Focus should return to the trigger button
  const isTriggerFocused = await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="open-dialog-btn"]') as HTMLElement | null;
    return btn ? document.activeElement === btn : false;
  });
  expect(isTriggerFocused, 'Expected focus to return to the trigger button after Escape').toBe(true);
});

// ── Backdrop click closes; dialog content click does not ─────────────────────

test('clicking the backdrop closes the modal', async ({ page }) => {
  await page.goto('/');
  await openModal(page);

  // Click on the backdrop area — outside the dialog box.
  // The backdrop fills the viewport; click near the edge to avoid the dialog.
  await page.mouse.click(5, 5);

  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('clicking inside dialog content does NOT close the modal', async ({ page }) => {
  await page.goto('/');
  await openModal(page);

  // Click the description text (inside the dialog)
  await page.getByText('Fill in the fields below and confirm.').click();

  // Modal should still be open
  await expect(page.getByRole('dialog')).toBeVisible();
});

// ── Background inertness: Tab never reaches background content ─────────────────

test('background content is inert while modal is open: Tab cycles only within dialog', async ({ page }) => {
  await page.goto('/');

  // Record a background button that is reachable before the modal opens.
  const bgButton = page.getByRole('button', { name: /increment counter/i });
  await expect(bgButton).toBeVisible();

  // Open the modal.
  await openModal(page);

  // The background elements should now be inert. Tab 20 times — the background
  // "Increment counter" button should never become activeElement.
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    const activeIsBackground = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active) return false;
      // If active element is inside the dialog, it is NOT a background element.
      const dialog = document.querySelector('[role="dialog"]');
      return dialog ? !dialog.contains(active) : true;
    });
    expect(
      activeIsBackground,
      `Tab press ${i + 1}: focus escaped the dialog into background content`,
    ).toBe(false);
  }
});
