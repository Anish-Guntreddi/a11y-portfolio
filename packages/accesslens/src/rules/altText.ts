import type { DomSnapshot } from '../snapshot.js';
import type { Finding } from '../types.js';

const EXEMPT_ROLES = new Set(['presentation', 'none']);

/**
 * rule-img-alt: flag <img> elements with NO alt attribute, unless the image is
 * aria-hidden or has role="presentation"/"none".
 *
 * Empty alt="" is VALID (marks the image as decorative) and is NOT flagged.
 */
export function checkAltText(snapshot: DomSnapshot): Finding[] {
  const findings: Finding[] = [];

  for (const img of snapshot.images) {
    if (img.ariaHidden) continue;
    if (img.role !== null && EXEMPT_ROLES.has(img.role)) continue;
    if (img.hasAltAttr) continue; // alt="" is valid — decorative

    findings.push({
      ruleId: 'rule-img-alt',
      severity: 'critical',
      message: 'Image is missing an alt attribute',
      remediation:
        'Add a descriptive alt attribute to convey meaning, or alt="" if the image is decorative.',
      targets: [img.selector],
      source: 'custom',
    });
  }

  return findings;
}
