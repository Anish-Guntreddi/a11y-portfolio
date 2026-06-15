import { withPage, type WithPageOpts } from './driver.js';
import { runAxe } from './runners/axe.js';
import { makeResult, type AuditResult } from './types.js';

export interface AuditOpts extends WithPageOpts {
  /** Optional clock override for deterministic timestamps in tests. */
  now?: () => string;
}

/**
 * Audits a URL for accessibility violations using Playwright + axe-core.
 * AuditResult.url is set to the final post-redirect URL, not the input URL.
 */
export async function auditUrl(
  url: string,
  opts: AuditOpts = {},
): Promise<AuditResult> {
  const timestampIso = opts.now ? opts.now() : new Date().toISOString();

  let finalUrl = url;
  const findings = await withPage(url, opts, (page, resolvedUrl) => {
    finalUrl = resolvedUrl;
    return runAxe(page);
  });

  return makeResult(finalUrl, findings, timestampIso);
}
