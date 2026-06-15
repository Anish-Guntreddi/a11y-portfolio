import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // Exclude the harness source files from test discovery
  testMatch: '**/*.spec.ts',
  webServer: {
    command: 'pnpm exec vite e2e/harness --config e2e/harness/vite.config.ts --port 5183 --strictPort',
    url: 'http://localhost:5183',
    reuseExistingServer: !process.env['CI'],
    timeout: 30_000,
  },
  use: {
    baseURL: 'http://localhost:5183',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
