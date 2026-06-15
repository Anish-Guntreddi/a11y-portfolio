import type { DomSnapshot } from '../snapshot.js';
import type { Finding } from '../types.js';
import { contrastRatio, isLargeText } from './contrast-math.js';

/**
 * rule-contrast: for each TextNode, compute the WCAG contrast ratio between
 * the element's foreground colour and its effective background colour.
 *
 * Thresholds (WCAG 2.x level AA):
 *   - Large text (>=24 px, or >=18.66 px bold): minimum 3.0
 *   - Normal text: minimum 4.5
 *
 * Findings are severity 'serious'.
 */
export function checkContrast(snapshot: DomSnapshot): Finding[] {
  const findings: Finding[] = [];

  for (const node of snapshot.texts) {
    let ratio: number;
    try {
      ratio = contrastRatio(node.color, node.backgroundColor);
    } catch {
      // Unparseable colour (e.g. "currentColor") — skip rather than false-positive
      continue;
    }

    const large = isLargeText(node.fontSizePx, node.fontWeightNum);
    const threshold = large ? 3.0 : 4.5;

    if (ratio < threshold) {
      findings.push({
        ruleId: 'rule-contrast',
        severity: 'serious',
        message: `Text has insufficient colour contrast: ${ratio.toFixed(2)}:1 (required ${threshold}:1)`,
        remediation: `Increase contrast to at least ${threshold}:1. Consider darkening the text colour or lightening/darkening the background.`,
        targets: [node.selector],
        source: 'custom',
      });
    }
  }

  return findings;
}
