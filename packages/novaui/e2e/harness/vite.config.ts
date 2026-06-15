import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite config for the e2e test harness app.
 * This is NOT the library build config — it runs a plain SPA
 * so Playwright can drive it.
 */
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    port: 5183,
    strictPort: true,
  },
});
