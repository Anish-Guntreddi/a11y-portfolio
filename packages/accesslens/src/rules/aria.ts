import type { DomSnapshot } from '../snapshot.js';
import type { Finding } from '../types.js';

export function checkAriaValidRole(snapshot: DomSnapshot): Finding[] {
  const ariaElements = snapshot.ariaElements ?? [];
  const findings: Finding[] = [];

  for (const el of ariaElements) {
    if (el.invalidRole && el.role !== null) {
      findings.push({
        ruleId: 'rule-aria-valid-role',
        severity: 'serious',
        message: `Element has invalid ARIA role "${el.role}"`,
        remediation:
          'Use a valid WAI-ARIA role. Refer to https://www.w3.org/TR/wai-aria/#role_definitions for the list of valid roles.',
        targets: [el.selector],
        source: 'custom',
      });
    }
  }

  return findings;
}

export function checkAriaHiddenFocusable(snapshot: DomSnapshot): Finding[] {
  const ariaElements = snapshot.ariaElements ?? [];
  const findings: Finding[] = [];

  for (const el of ariaElements) {
    if (el.ariaHidden && el.focusable) {
      findings.push({
        ruleId: 'rule-aria-hidden-focusable',
        severity: 'serious',
        message: 'Focusable element is hidden from assistive technology via aria-hidden',
        remediation:
          'Remove aria-hidden="true" from focusable elements, or make the element unfocusable with tabindex="-1".',
        targets: [el.selector],
        source: 'custom',
      });
    }
  }

  return findings;
}
