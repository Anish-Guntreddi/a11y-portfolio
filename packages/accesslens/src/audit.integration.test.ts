import { describe, expect, it } from 'vitest';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
import { auditUrl } from './audit.js';

const FIXTURES_DIR = resolve(import.meta.dirname, 'fixtures');
const BAD_HTML_PATH = resolve(FIXTURES_DIR, 'bad.html');
const GOOD_HTML_PATH = resolve(FIXTURES_DIR, 'good.html');

/**
 * Returns true if the Playwright-managed Chromium executable is present on disk.
 * Uses Playwright's own executablePath() — no shell invocation needed.
 */
function chromiumInstalled(): boolean {
  try {
    const execPath = chromium.executablePath();
    return existsSync(execPath);
  } catch {
    return false;
  }
}

describe('auditUrl integration (real Playwright + axe-core)', () => {
  it(
    'detects expected violations on bad.html',
    { timeout: 60_000 },
    async () => {
      if (!chromiumInstalled()) {
        console.warn(
          'Chromium not installed — run `pnpm exec playwright install chromium` then re-run tests.',
        );
        return;
      }

      const url = pathToFileURL(BAD_HTML_PATH).href;
      const result = await auditUrl(url);

      expect(result.url).toBe(url);
      expect(result.timestampIso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(result.summary.total).toBeGreaterThan(0);

      const ruleIds = result.findings.map((f) => f.ruleId);

      // These four rules are reliably triggered by our planted issues
      expect(ruleIds).toContain('image-alt');
      expect(ruleIds).toContain('label');
      expect(ruleIds).toContain('html-has-lang');
      expect(ruleIds).toContain('color-contrast');

      // All findings must have required fields
      for (const f of result.findings) {
        expect(f.ruleId).toBeTruthy();
        expect(f.severity).toMatch(/^(critical|serious|moderate|minor)$/);
        expect(f.message).toBeTruthy();
        expect(f.remediation).toBeTruthy();
        expect(Array.isArray(f.targets)).toBe(true);
        expect(f.source).toMatch(/^(axe|custom)$/);
      }

      // Summary counts must add up to total
      const { critical, serious, moderate, minor, total } = result.summary;
      expect(critical + serious + moderate + minor).toBe(total);
    },
  );

  it(
    'reports ZERO violations on good.html (false-positive control)',
    { timeout: 60_000 },
    async () => {
      if (!chromiumInstalled()) {
        console.warn(
          'Chromium not installed — run `pnpm exec playwright install chromium` then re-run tests.',
        );
        return;
      }

      const url = pathToFileURL(GOOD_HTML_PATH).href;
      const result = await auditUrl(url);

      expect(result.summary.total).toBe(0);
      expect(result.findings).toHaveLength(0);
    },
  );
});
