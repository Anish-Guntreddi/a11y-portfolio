import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Playwright config for the automated Storybook a11y gate.
 *
 * Prerequisites:
 *   pnpm --filter @a11y-portfolio/novaui build-storybook
 *
 * Usage:
 *   pnpm --filter @a11y-portfolio/novaui test-storybook
 *
 * The config serves storybook-static/ via `npx serve` and runs
 * e2e/storybook-a11y.spec.ts against it.
 */
export default defineConfig({
  testDir: path.resolve(here, 'e2e'),
  testMatch: '**/storybook-a11y.spec.ts',
  webServer: {
    // python3's http.server is always available and (unlike `npx serve`, whose
    // cleanUrls rewriting drops `.html`) serves `iframe.html?id=...` verbatim.
    command: 'python3 -m http.server 6007 --directory storybook-static',
    url: 'http://localhost:6007/iframe.html',
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
    cwd: here,
  },
  use: {
    baseURL: 'http://localhost:6007',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
