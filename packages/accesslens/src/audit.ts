import { withPage, type WithPageOpts } from './driver.js';
import { runAxe } from './runners/axe.js';
import { captureSnapshot } from './snapshot.js';
import { runCustomRules } from './rules/index.js';
import { makeResult, type AuditResult } from './types.js';

export interface AuditOpts extends WithPageOpts {
  /** Optional clock override for deterministic timestamps in tests. */
  now?: () => string;
  /** Set to false to skip custom rules (default: true). */
  customRules?: boolean;
}

/**
 * Audits a URL for accessibility violations using Playwright + axe-core,
 * plus optional custom pure-function rules run over a DOM snapshot.
 * AuditResult.url is set to the final post-redirect URL, not the input URL.
 */
export async function auditUrl(
  url: string,
  opts: AuditOpts = {},
): Promise<AuditResult> {
  const timestampIso = opts.now ? opts.now() : new Date().toISOString();
  const runCustom = opts.customRules !== false;

  let finalUrl = url;
  const findings = await withPage(url, opts, async (page, resolvedUrl) => {
    finalUrl = resolvedUrl;

    const axeFindings = await runAxe(page);

    if (!runCustom) return axeFindings;

    const snapshot = await captureSnapshot(page);
    const customFindings = runCustomRules(snapshot);

    return [...axeFindings, ...customFindings];
  });

  return makeResult(finalUrl, findings, timestampIso);
}
