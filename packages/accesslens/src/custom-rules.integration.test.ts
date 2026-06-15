import { describe, expect, it } from 'vitest';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
import { captureSnapshot } from './snapshot.js';
import { runCustomRules } from './rules/index.js';
import { withPage } from './driver.js';

const FIXTURES_DIR = resolve(import.meta.dirname, 'fixtures');
const BAD_HTML_PATH = resolve(FIXTURES_DIR, 'bad.html');
const GOOD_HTML_PATH = resolve(FIXTURES_DIR, 'good.html');

function chromiumInstalled(): boolean {
  try {
    return existsSync(chromium.executablePath());
  } catch {
    return false;
  }
}

describe('custom rules integration (real Playwright)', () => {
  it(
    'flags planted issues in bad.html',
    { timeout: 60_000 },
    async () => {
      if (!chromiumInstalled()) {
        console.warn('Chromium not installed — skipping integration test.');
        return;
      }

      const url = pathToFileURL(BAD_HTML_PATH).href;
      const findings = await withPage(url, {}, async (page) => {
        const snapshot = await captureSnapshot(page);
        return runCustomRules(snapshot);
      });

      const ruleIds = findings.map((f) => f.ruleId);

      // Planted issue 2: <img> with no alt attribute → rule-img-alt
      expect(ruleIds).toContain('rule-img-alt');
      const altFinding = findings.find((f) => f.ruleId === 'rule-img-alt');
      expect(altFinding?.severity).toBe('critical');
      expect(altFinding?.source).toBe('custom');

      // Planted issue 4: h1 → h4 jump → rule-heading-order (moderate)
      expect(ruleIds).toContain('rule-heading-order');
      const jumpFinding = findings.find(
        (f) => f.ruleId === 'rule-heading-order' && f.severity === 'moderate',
      );
      expect(jumpFinding).toBeDefined();
      expect(jumpFinding?.message).toContain('h4');

      // Planted issue 5: #aaa on #fff → rule-contrast
      expect(ruleIds).toContain('rule-contrast');
      const contrastFinding = findings.find((f) => f.ruleId === 'rule-contrast');
      expect(contrastFinding?.severity).toBe('serious');
      expect(contrastFinding?.source).toBe('custom');

      // All findings must have required fields
      for (const f of findings) {
        expect(f.ruleId).toBeTruthy();
        expect(f.severity).toMatch(/^(critical|serious|moderate|minor)$/);
        expect(f.message).toBeTruthy();
        expect(f.remediation).toBeTruthy();
        expect(Array.isArray(f.targets)).toBe(true);
        expect(f.source).toBe('custom');
      }
    },
  );

  it(
    'yields ZERO custom-rule findings on good.html (false-positive control)',
    { timeout: 60_000 },
    async () => {
      if (!chromiumInstalled()) {
        console.warn('Chromium not installed — skipping integration test.');
        return;
      }

      const url = pathToFileURL(GOOD_HTML_PATH).href;
      const findings = await withPage(url, {}, async (page) => {
        const snapshot = await captureSnapshot(page);
        return runCustomRules(snapshot);
      });

      expect(findings).toHaveLength(0);
    },
  );
});
