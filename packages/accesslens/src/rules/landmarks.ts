import type { DomSnapshot } from '../snapshot.js';
import type { Finding } from '../types.js';

export function checkLandmarkMain(snapshot: DomSnapshot): Finding[] {
  const landmarks = snapshot.landmarks ?? [];
  const mains = landmarks.filter((l) => l.role === 'main');
  const count = mains.length;

  if (count === 0) {
    return [
      {
        ruleId: 'rule-landmark-main',
        severity: 'serious',
        message: 'Page has no main landmark',
        remediation:
          'Add a <main> element (or role="main") to identify the primary content region.',
        targets: ['body'],
        source: 'custom',
      },
    ];
  }

  if (count > 1) {
    return [
      {
        ruleId: 'rule-landmark-main',
        severity: 'moderate',
        message: `Page has multiple main landmarks (found ${count})`,
        remediation: 'A page should have exactly one main landmark.',
        targets: mains.map((m) => m.selector),
        source: 'custom',
      },
    ];
  }

  return [];
}

export function checkLandmarkUniqueNames(snapshot: DomSnapshot): Finding[] {
  const landmarks = snapshot.landmarks ?? [];
  const findings: Finding[] = [];

  // Group by role
  const byRole = new Map<string, typeof landmarks>();
  for (const lm of landmarks) {
    const group = byRole.get(lm.role) ?? [];
    group.push(lm);
    byRole.set(lm.role, group);
  }

  for (const [role, group] of byRole) {
    if (group.length < 2) continue;

    // Check if all have distinct non-null, non-empty names
    const names = group.map((lm) => lm.accessibleName ?? '');
    const hasNullOrEmpty = names.some((n) => !n);
    const hasDuplicate = new Set(names).size < names.length;

    if (hasNullOrEmpty || hasDuplicate) {
      findings.push({
        ruleId: 'rule-landmark-unique-names',
        severity: 'moderate',
        message: `Multiple "${role}" landmarks must each have a unique accessible name`,
        remediation:
          `Add distinct aria-label or aria-labelledby attributes to each "${role}" landmark.`,
        targets: group.map((lm) => lm.selector),
        source: 'custom',
      });
    }
  }

  return findings;
}
