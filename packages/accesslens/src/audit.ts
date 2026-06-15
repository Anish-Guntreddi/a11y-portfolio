import { withPage, type WithPageOpts } from './driver.js';
import { runAxe } from './runners/axe.js';
import { captureSnapshot } from './snapshot.js';
import { runCustomRules } from './rules/index.js';
import { makeResult, ruleCategory, type AuditResult, type ChecklistItem, type Finding } from './types.js';
import { buildKeyboardChecklist } from './keyboard/checklist.js';

export interface AuditOpts extends WithPageOpts {
  /** Optional clock override for deterministic timestamps in tests. */
  now?: () => string;
  /** Set to false to skip custom rules (default: true). */
  customRules?: boolean;
}

/**
 * Merge axe findings with custom findings, suppressing overlap so no issue is
 * counted twice.
 *
 * axe-core is the canonical engine for the categories it covers
 * (contrast / alt-text / heading-structure — see `ruleCategory`). Because axe
 * runs those rules comprehensively on every audit, any custom finding that
 * carries one of those categories is redundant with axe and is dropped here.
 * Cross-engine per-element dedup is unreliable (axe and the snapshot rules emit
 * different CSS selectors for the same node), so suppression is by category, not
 * by selector.
 *
 * Custom rules with NO overlap category (landmarks, aria-hidden-focusable,
 * invalid-role, …) are unique to AccessLens and are always kept. The custom
 * contrast/alt/heading rules remain independently exercised at the snapshot
 * level (`runCustomRules`) and in their own unit tests; they are simply not
 * double-reported alongside axe.
 *
 * axe findings are annotated with their category for downstream grouping.
 */
function dedupeFindings(axeFindings: Finding[], customFindings: Finding[]): Finding[] {
  const annotatedAxe = axeFindings.map((f) => {
    const category = ruleCategory(f.ruleId);
    return category ? { ...f, category } : f;
  });

  // Drop custom findings whose category is one axe already covers.
  const keptCustom = customFindings.filter((f) => ruleCategory(f.ruleId) === undefined);

  return [...annotatedAxe, ...keptCustom];
}

/**
 * Audits a URL for accessibility violations using Playwright + axe-core,
 * plus optional custom pure-function rules run over a DOM snapshot.
 * AuditResult.url is set to the final post-redirect URL, not the input URL.
 *
 * When both axe and custom rules fire for the same (category, target), the
 * axe finding is kept and the custom duplicate is dropped so issues are not
 * double-counted in the summary.
 */
export async function auditUrl(
  url: string,
  opts: AuditOpts = {},
): Promise<AuditResult> {
  const timestampIso = opts.now ? opts.now() : new Date().toISOString();
  const runCustom = opts.customRules !== false;

  let finalUrl = url;
  let keyboardChecklist: ChecklistItem[] = [];

  const findings = await withPage(url, opts, async (page, resolvedUrl) => {
    finalUrl = resolvedUrl;

    const axeFindings = await runAxe(page);

    if (!runCustom) return axeFindings;

    const snapshot = await captureSnapshot(page);
    keyboardChecklist = buildKeyboardChecklist(snapshot);
    const customFindings = runCustomRules(snapshot);

    return dedupeFindings(axeFindings, customFindings);
  });

  return makeResult(finalUrl, findings, timestampIso, keyboardChecklist);
}
