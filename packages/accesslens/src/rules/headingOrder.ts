import type { DomSnapshot } from '../snapshot.js';
import type { Finding } from '../types.js';

/**
 * rule-heading-order: detect two kinds of heading structure problems:
 *  (a) No h1 present on the page → severity serious
 *  (b) A heading level that jumps by more than 1 from the previous heading
 *      (e.g. h1 → h3) → severity moderate
 */
export function checkHeadingOrder(snapshot: DomSnapshot): Finding[] {
  const findings: Finding[] = [];
  const { headings } = snapshot;

  // (a) No h1 present
  if (!headings.some((h) => h.level === 1)) {
    findings.push({
      ruleId: 'rule-heading-order',
      severity: 'serious',
      message: 'Page has no h1 heading',
      remediation: 'Add a single h1 heading that describes the page topic.',
      targets: ['body'],
      source: 'custom',
    });
  }

  // (b) Level jumps > 1
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];
    if (curr.level - prev.level > 1) {
      findings.push({
        ruleId: 'rule-heading-order',
        severity: 'moderate',
        message: `Heading level skips from h${prev.level} to h${curr.level} — levels must not be skipped`,
        remediation: `Use h${prev.level + 1} instead of h${curr.level} here, or restructure the heading hierarchy so no levels are skipped.`,
        targets: [curr.selector],
        source: 'custom',
      });
    }
  }

  return findings;
}
