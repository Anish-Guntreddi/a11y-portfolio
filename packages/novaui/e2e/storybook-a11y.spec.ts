/**
 * Automated per-story a11y gate.
 *
 * This spec:
 * 1. Reads storybook-static/index.json to enumerate all stories.
 * 2. Loads each story iframe from the static build.
 * 3. Runs @axe-core/playwright and asserts ZERO violations.
 * 4. Also tests the dark-theme query param: loads a story with ?globals=theme:dark
 *    and asserts data-theme="dark" is applied AND axe is still clean.
 *
 * The spec is driven against a pre-built storybook-static/ directory.
 * The webServer in playwright.storybook.config.ts serves it via `npx serve`.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));

// ── Load story list ───────────────────────────────────────────────────────────

interface StorybookIndexEntry {
  type: string;
  id: string;
  title: string;
  name: string;
}

interface StorybookIndex {
  entries: Record<string, StorybookIndexEntry>;
}

function loadStories(): StorybookIndexEntry[] {
  const indexPath = path.resolve(here, '../storybook-static/index.json');
  if (!fs.existsSync(indexPath)) {
    throw new Error(
      `storybook-static/index.json not found at ${indexPath}. ` +
        'Run `pnpm --filter @a11y-portfolio/novaui build-storybook` first.',
    );
  }
  const index: StorybookIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  // Only run axe on actual stories (not docs pages).
  return Object.values(index.entries).filter(
    (e) => e.type === 'story',
  );
}

// ── Story a11y tests ──────────────────────────────────────────────────────────

const stories = loadStories();

for (const story of stories) {
  test(`a11y: ${story.title} / ${story.name}`, async ({ page }) => {
    // Load the story iframe (static serving from storybook-static/).
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
    // Wait for the story to render — look for the root div.
    await page.waitForSelector('#storybook-root', { timeout: 10_000 });

    const results = await new AxeBuilder({ page })
      .include('#storybook-root')
      .analyze();

    expect(
      results.violations,
      `Story "${story.title}/${story.name}" has axe violations:\n` +
        results.violations
          .map((v) => `  [${v.id}] ${v.description} (${v.nodes.length} node(s))`)
          .join('\n'),
    ).toEqual([]);
  });
}

// ── Theme switch test ─────────────────────────────────────────────────────────

test('dark theme: data-theme="dark" is applied and axe is clean', async ({ page }) => {
  // Use the Button/Primary story with the dark global override.
  await page.goto('/iframe.html?id=components-button--primary&viewMode=story&globals=theme:dark');
  await page.waitForSelector('#storybook-root', { timeout: 10_000 });

  // The decorator sets data-theme on the wrapper div inside #storybook-root.
  const dataDark = await page.evaluate(() => {
    const root = document.querySelector('#storybook-root');
    if (!root) return null;
    // Our decorator renders a div with data-theme directly inside storybook-root.
    const themed = root.querySelector('[data-theme="dark"]');
    return themed ? themed.getAttribute('data-theme') : null;
  });

  expect(dataDark, 'Expected data-theme="dark" to be set on the decorator wrapper').toBe('dark');

  const results = await new AxeBuilder({ page })
    .include('#storybook-root')
    .analyze();

  expect(
    results.violations,
    `Dark-theme Button/Primary story has axe violations:\n` +
      results.violations
        .map((v) => `  [${v.id}] ${v.description}`)
        .join('\n'),
  ).toEqual([]);
});
