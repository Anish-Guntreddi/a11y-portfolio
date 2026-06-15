export type Severity = 'critical' | 'serious' | 'moderate' | 'minor';

/**
 * Optional semantic category used to identify overlapping axe / custom findings
 * so they can be deduped by (category, normalizedTarget).
 *
 * Rules that share a category:
 *   contrast         — axe `color-contrast`         / custom `rule-contrast`
 *   alt-text         — axe `image-alt`               / custom `rule-img-alt`
 *   heading-structure— axe `heading-order`+`page-has-heading-one` / custom `rule-heading-order`
 */
export type FindingCategory = 'contrast' | 'alt-text' | 'heading-structure' | string;

/** Map a ruleId to its dedup category. Returns undefined for non-overlapping rules. */
export function ruleCategory(ruleId: string): FindingCategory | undefined {
  switch (ruleId) {
    case 'color-contrast':
    case 'rule-contrast':
      return 'contrast';
    case 'image-alt':
    case 'rule-img-alt':
      return 'alt-text';
    case 'heading-order':
    case 'page-has-heading-one':
    case 'rule-heading-order':
      return 'heading-structure';
    default:
      return undefined;
  }
}

export interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  remediation: string;
  targets: string[];
  helpUrl?: string;
  html?: string;
  source: 'axe' | 'custom';
  /** Semantic category for dedup across axe vs custom findings. */
  category?: FindingCategory;
}

export interface AuditSummary {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  total: number;
}

export interface ChecklistItem {
  id: string;
  title: string;
  status: 'pass' | 'fail' | 'manual';
  details: string;
}

export type KeyboardChecklist = ChecklistItem[];

export interface AuditResult {
  url: string;
  timestampIso: string;
  findings: Finding[];
  summary: AuditSummary;
  keyboardChecklist: ChecklistItem[];
}

export function summarize(findings: Finding[]): AuditSummary {
  const summary: AuditSummary = { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 };
  for (const f of findings) {
    summary[f.severity]++;
    summary.total++;
  }
  return summary;
}

export function makeResult(
  url: string,
  findings: Finding[],
  timestampIso: string,
  keyboardChecklist: ChecklistItem[] = [],
): AuditResult {
  return { url, timestampIso, findings, summary: summarize(findings), keyboardChecklist };
}
