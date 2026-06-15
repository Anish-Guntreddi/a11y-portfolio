import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Site accessibility — light theme', () => {
  test('zero axe violations', async ({ page }) => {
    // Disable CSS animations so axe doesn't catch elements mid-opacity-transition
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Force light theme via localStorage before navigation
    await page.addInitScript(() => {
      localStorage.setItem('novaui-theme', 'light');
    });

    await page.goto('/');
    // Wait for fonts and NovaUI components to mount
    await page.waitForSelector('main', { timeout: 10_000 });

    const results = await new AxeBuilder({ page })
      // Exclude the report iframes — they are third-party generated HTML
      // and tested in isolation by AccessLens's own tests.
      .exclude('iframe')
      .analyze();

    expect(
      results.violations,
      `axe violations (light theme):\n${JSON.stringify(results.violations, null, 2)}`
    ).toHaveLength(0);
  });
});

test.describe('Site accessibility — dark theme', () => {
  test('zero axe violations', async ({ page }) => {
    // Disable CSS animations so axe doesn't catch elements mid-opacity-transition
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Force dark theme via localStorage before navigation
    await page.addInitScript(() => {
      localStorage.setItem('novaui-theme', 'dark');
    });

    await page.goto('/');
    await page.waitForSelector('main', { timeout: 10_000 });

    // Verify the dark theme is actually active
    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('dark');

    const results = await new AxeBuilder({ page })
      .exclude('iframe')
      .analyze();

    expect(
      results.violations,
      `axe violations (dark theme):\n${JSON.stringify(results.violations, null, 2)}`
    ).toHaveLength(0);
  });
});

test.describe('Site structure', () => {
  test('has skip link, one h1, and key landmarks', async ({ page }) => {
    await page.goto('/');

    // Skip link must exist and be in the DOM
    const skipLink = page.locator('a.skip-link');
    await expect(skipLink).toHaveCount(1);
    await expect(skipLink).toHaveAttribute('href', '#main-content');

    // Exactly one h1
    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);

    // Landmarks
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);

    // html lang
    const lang = await page.evaluate(() => document.documentElement.lang);
    expect(lang).toBe('en');

    // Iframes have title attributes
    const iframes = page.locator('iframe');
    const count = await iframes.count();
    for (let i = 0; i < count; i++) {
      const title = await iframes.nth(i).getAttribute('title');
      expect(title, `iframe[${i}] missing title`).toBeTruthy();
    }
  });
});
