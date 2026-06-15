export type Severity = 'critical' | 'serious' | 'moderate' | 'minor';

export interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  remediation: string;
  targets: string[];
  helpUrl?: string;
  html?: string;
  source: 'axe' | 'custom';
}

export interface AuditSummary {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  total: number;
}

export interface AuditResult {
  url: string;
  timestampIso: string;
  findings: Finding[];
  summary: AuditSummary;
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
): AuditResult {
  return { url, timestampIso, findings, summary: summarize(findings) };
}
