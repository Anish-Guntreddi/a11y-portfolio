import { describe, expect, it } from 'vitest';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
import { captureSnapshot } from './snapshot.js';
import { runCustomRules } from './rules/index.js';
import { buildKeyboardChecklist } from './keyboard/checklist.js';
import { withPage } from './driver.js';

const FIXTURES_DIR = resolve(import.meta.dirname, 'fixtures');
const LANDMARKS_BAD_PATH = resolve(FIXTURES_DIR, 'landmarks-bad.html');
const LANDMARKS_GOOD_PATH = resolve(FIXTURES_DIR, 'landmarks-good.html');

function chromiumInstalled(): boolean {
  try {
    return existsSync(chromium.executablePath());
  } catch {
    return false;
  }
}

describe('landmarks + aria integration (real Playwright)', () => {
  it(
    'flags planted issues in landmarks-bad.html',
    { timeout: 60_000 },
    async () => {
      if (!chromiumInstalled()) {
        console.warn('Chromium not installed — skipping integration test.');
        return;
      }

      const url = pathToFileURL(LANDMARKS_BAD_PATH).href;

      let checklist: ReturnType<typeof buildKeyboardChecklist> = [];
      const findings = await withPage(url, {}, async (page) => {
        const snapshot = await captureSnapshot(page);
        checklist = buildKeyboardChecklist(snapshot);
        return runCustomRules(snapshot);
      });

      const ruleIds = findings.map((f) => f.ruleId);

      // No <main> element → rule-landmark-main (serious)
      expect(ruleIds).toContain('rule-landmark-main');
      const mainFinding = findings.find((f) => f.ruleId === 'rule-landmark-main');
      expect(mainFinding?.severity).toBe('serious');
      expect(mainFinding?.source).toBe('custom');

      // Two <nav> with no names → rule-landmark-unique-names (moderate)
      expect(ruleIds).toContain('rule-landmark-unique-names');
      const uniqueNamesFinding = findings.find((f) => f.ruleId === 'rule-landmark-unique-names');
      expect(uniqueNamesFinding?.severity).toBe('moderate');
      expect(uniqueNamesFinding?.message).toContain('navigation');

      // role="buton" → rule-aria-valid-role (serious)
      expect(ruleIds).toContain('rule-aria-valid-role');
      const validRoleFinding = findings.find((f) => f.ruleId === 'rule-aria-valid-role');
      expect(validRoleFinding?.severity).toBe('serious');
      expect(validRoleFinding?.message).toContain('buton');

      // aria-hidden on <a href> → rule-aria-hidden-focusable (serious)
      expect(ruleIds).toContain('rule-aria-hidden-focusable');
      const ariaHiddenFinding = findings.find((f) => f.ruleId === 'rule-aria-hidden-focusable');
      expect(ariaHiddenFinding?.severity).toBe('serious');

      // Checklist: no-positive-tabindex should fail (tabindex="3")
      const positiveTabitem = checklist.find((i) => i.id === 'no-positive-tabindex');
      expect(positiveTabitem?.status).toBe('fail');

      // Checklist: skip-link should fail (no skip link)
      const skipLinkItem = checklist.find((i) => i.id === 'skip-link');
      expect(skipLinkItem?.status).toBe('fail');

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
    'yields zero custom-rule findings on landmarks-good.html',
    { timeout: 60_000 },
    async () => {
      if (!chromiumInstalled()) {
        console.warn('Chromium not installed — skipping integration test.');
        return;
      }

      const url = pathToFileURL(LANDMARKS_GOOD_PATH).href;

      let checklist: ReturnType<typeof buildKeyboardChecklist> = [];
      const findings = await withPage(url, {}, async (page) => {
        const snapshot = await captureSnapshot(page);
        checklist = buildKeyboardChecklist(snapshot);
        return runCustomRules(snapshot);
      });

      // None of the new landmark/aria rules should fire
      const newRuleIds = [
        'rule-landmark-main',
        'rule-landmark-unique-names',
        'rule-aria-valid-role',
        'rule-aria-hidden-focusable',
      ];
      for (const ruleId of newRuleIds) {
        expect(findings.find((f) => f.ruleId === ruleId)).toBeUndefined();
      }

      // Checklist: no-positive-tabindex should pass
      const positiveTabItem = checklist.find((i) => i.id === 'no-positive-tabindex');
      expect(positiveTabItem?.status).toBe('pass');

      // Checklist: skip-link should pass
      const skipLinkItem = checklist.find((i) => i.id === 'skip-link');
      expect(skipLinkItem?.status).toBe('pass');

      // Checklist: focus-visible should be manual
      const focusVisibleItem = checklist.find((i) => i.id === 'focus-visible');
      expect(focusVisibleItem?.status).toBe('manual');

      // Checklist: no-keyboard-trap should be manual
      const noTrapItem = checklist.find((i) => i.id === 'no-keyboard-trap');
      expect(noTrapItem?.status).toBe('manual');
    },
  );
});
