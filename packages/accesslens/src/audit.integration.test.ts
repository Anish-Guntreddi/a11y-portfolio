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

/** Helper: count findings with a given ruleId. */
function countById(findings: { ruleId: string }[], ruleId: string): number {
  return findings.filter((f) => f.ruleId === ruleId).length;
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

  it(
    'dedup: auditUrl does not double-count contrast/alt/heading issues on bad.html',
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

      // Each overlapping category (contrast, alt-text, heading-structure) must
      // appear AT MOST ONCE per target — no same-category finding duplicated.
      const categories = new Map<string, Set<string>>();
      for (const f of result.findings) {
        if (!f.category) continue;
        if (!categories.has(f.category)) categories.set(f.category, new Set());
        const firstTarget = f.targets[0] ?? '__page__';
        const key = firstTarget.trim().toLowerCase();
        const seen = categories.get(f.category)!;
        expect(seen.has(key), `Duplicate (${f.category}, ${key}) found in deduped output`).toBe(false);
        seen.add(key);
      }

      // The custom rule-contrast and rule-img-alt should NOT appear since axe
      // covers those on bad.html (they were deduped).
      expect(countById(result.findings, 'rule-contrast')).toBe(0);
      expect(countById(result.findings, 'rule-img-alt')).toBe(0);

      // The axe versions SHOULD appear.
      expect(countById(result.findings, 'color-contrast')).toBeGreaterThanOrEqual(1);
      expect(countById(result.findings, 'image-alt')).toBeGreaterThanOrEqual(1);

      // Summary total must equal the actual findings count (no double-count).
      const { critical, serious, moderate, minor, total } = result.summary;
      expect(critical + serious + moderate + minor).toBe(total);
      expect(total).toBe(result.findings.length);
    },
  );
});
