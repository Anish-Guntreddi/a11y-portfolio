import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getMenuTrigger(page: import('@playwright/test').Page) {
  return page.getByRole('button', { name: /actions/i });
}

async function openMenu(page: import('@playwright/test').Page) {
  const trigger = await getMenuTrigger(page);
  await trigger.click();
  await expect(page.getByRole('menu')).toBeVisible();
  return trigger;
}

// ── Axe: zero violations in both themes ──────────────────────────────────────

test('menu closed — light theme: axe reports zero violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('menu closed — dark theme: axe reports zero violations', async ({ page }) => {
  await page.goto('/?theme=dark');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('menu open — light theme: axe reports zero violations', async ({ page }) => {
  await page.goto('/');
  await openMenu(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('menu open — dark theme: axe reports zero violations', async ({ page }) => {
  await page.goto('/?theme=dark');
  await openMenu(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

// ── Trigger ARIA attributes ───────────────────────────────────────────────────

test('trigger has aria-haspopup="menu" and aria-expanded=false initially', async ({ page }) => {
  await page.goto('/');
  const trigger = await getMenuTrigger(page);
  await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('trigger aria-expanded becomes true when menu opens', async ({ page }) => {
  await page.goto('/');
  const trigger = await openMenu(page);
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
});

// ── Keyboard flow ─────────────────────────────────────────────────────────────

test('full keyboard flow: Tab → ArrowDown opens & focuses first item', async ({ page }) => {
  await page.goto('/');

  // Tab until we reach the "Actions" menu trigger.
  const trigger = await getMenuTrigger(page);
  await trigger.focus();

  // ArrowDown opens the menu and focuses first item.
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menu')).toBeVisible();

  // The first menu item should be focused.
  const firstItem = page.getByRole('menuitem').first();
  await expect(firstItem).toBeFocused();
});

test('ArrowDown navigates to next item', async ({ page }) => {
  await page.goto('/');
  const trigger = await getMenuTrigger(page);
  await trigger.focus();
  await page.keyboard.press('ArrowDown'); // open + focus first
  await page.keyboard.press('ArrowDown'); // move to second

  const menuItems = page.getByRole('menuitem');
  await expect(menuItems.nth(1)).toBeFocused();
});

test('ArrowUp navigates to previous item (wraps from first to last enabled)', async ({ page }) => {
  await page.goto('/');
  const trigger = await getMenuTrigger(page);
  await trigger.focus();
  await page.keyboard.press('ArrowDown'); // open + focus first (index 0)
  await page.keyboard.press('ArrowUp');   // should wrap to last enabled (index 3, Delta)

  // The last non-disabled item is "Delete" (index 3).
  const menuItems = page.getByRole('menuitem');
  await expect(menuItems.nth(3)).toBeFocused();
});

test('ArrowDown wraps from last item back to first', async ({ page }) => {
  await page.goto('/');
  const trigger = await getMenuTrigger(page);
  await trigger.focus();
  await page.keyboard.press('ArrowUp'); // open + focus last enabled (Delta, index 3)
  await page.keyboard.press('ArrowDown'); // should wrap to first (Edit, index 0)

  const menuItems = page.getByRole('menuitem');
  await expect(menuItems.nth(0)).toBeFocused();
});

test('focused item changes are visible (active item assertion)', async ({ page }) => {
  await page.goto('/');
  const trigger = await getMenuTrigger(page);
  await trigger.focus();
  await page.keyboard.press('ArrowDown'); // open, focus first

  // Confirm item 0 is focused.
  const menuItems = page.getByRole('menuitem');
  await expect(menuItems.nth(0)).toBeFocused();

  // Move to second item.
  await page.keyboard.press('ArrowDown');
  await expect(menuItems.nth(1)).toBeFocused();
});

test('Enter activates focused item, menu closes, selected label updates', async ({ page }) => {
  await page.goto('/');
  const trigger = await getMenuTrigger(page);
  await trigger.focus();
  await page.keyboard.press('ArrowDown'); // open + focus first ("Edit")
  await page.keyboard.press('Enter');     // activate "Edit"

  // Menu should be closed.
  await expect(page.getByRole('menu')).not.toBeVisible();

  // Harness shows "Selected: Edit".
  await expect(page.getByTestId('menu-selected')).toHaveText('Selected: Edit');
});

test('focus returns to trigger after Enter activation', async ({ page }) => {
  await page.goto('/');
  const trigger = await getMenuTrigger(page);
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  // Focus must return to the trigger.
  await expect(trigger).toBeFocused();
});

test('Escape from open menu closes and returns focus to trigger', async ({ page }) => {
  await page.goto('/');
  const trigger = await getMenuTrigger(page);
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menu')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

// ── Roving tabindex: exactly one menuitem has tabindex=0 ──────────────────────

test('roving tabindex: exactly one menuitem has tabindex=0 while open', async ({ page }) => {
  await page.goto('/');
  const trigger = await getMenuTrigger(page);
  await trigger.focus();
  await page.keyboard.press('ArrowDown'); // open

  const tabbableCount = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[role="menuitem"]')).filter(
      (el) => el.getAttribute('tabindex') === '0',
    ).length;
  });
  expect(tabbableCount).toBe(1);

  const minusOneCount = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
    return items.filter((el) => el.getAttribute('tabindex') === '-1').length;
  });
  // 4 items total, 1 has tabindex=0, so 3 have -1.
  expect(minusOneCount).toBe(3);
});

test('roving tabindex shifts as user navigates', async ({ page }) => {
  await page.goto('/');
  const trigger = await getMenuTrigger(page);
  await trigger.focus();
  await page.keyboard.press('ArrowDown'); // open + focus 0

  // Initially item 0 is tabbable.
  let tabbableIndex = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
    return items.findIndex((el) => el.getAttribute('tabindex') === '0');
  });
  expect(tabbableIndex).toBe(0);

  await page.keyboard.press('ArrowDown'); // → 1

  tabbableIndex = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
    return items.findIndex((el) => el.getAttribute('tabindex') === '0');
  });
  expect(tabbableIndex).toBe(1);
});

// ── Disabled item is skipped ──────────────────────────────────────────────────

test('disabled item (Archive) is skipped by ArrowDown navigation', async ({ page }) => {
  await page.goto('/');
  const trigger = await getMenuTrigger(page);
  await trigger.focus();
  await page.keyboard.press('ArrowDown'); // open + focus 0 (Edit)
  await page.keyboard.press('ArrowDown'); // → 1 (Duplicate)
  await page.keyboard.press('ArrowDown'); // should skip 2 (Archive, disabled) → 3 (Delete)

  const menuItems = page.getByRole('menuitem');
  // index 3 = Delete (last item).
  await expect(menuItems.nth(3)).toBeFocused();
});

test('clicking a disabled item does not close the menu or select it', async ({ page }) => {
  await page.goto('/');
  await openMenu(page);

  const archiveItem = page.getByRole('menuitem', { name: /archive/i });
  // Force the click because Playwright won't click a disabled button by default —
  // that is exactly the behaviour we're testing (click reaches the element but does nothing).
  await archiveItem.click({ force: true });

  // Menu should still be open (disabled items don't activate).
  await expect(page.getByRole('menu')).toBeVisible();
  // No selection text should have appeared.
  await expect(page.getByTestId('menu-selected')).not.toBeAttached();
});
