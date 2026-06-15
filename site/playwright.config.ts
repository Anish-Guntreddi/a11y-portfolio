import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  testDir: resolve(__dirname, 'e2e'),
  timeout: 60_000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    // Settle entrance animations instantly so axe evaluates the final, visible
    // state deterministically (not a transient mid-animation frame).
    reducedMotion: 'reduce',
  },
  webServer: {
    command: 'pnpm preview --port 4173',
    port: 4173,
    reuseExistingServer: false,
    timeout: 30_000,
    cwd: resolve(__dirname),
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
