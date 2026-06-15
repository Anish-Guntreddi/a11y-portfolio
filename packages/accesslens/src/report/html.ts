import type { AuditResult, ChecklistItem, Finding, Severity } from '../types.js';

/** Escape characters that have special meaning in HTML. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SEVERITY_ORDER: Severity[] = ['critical', 'serious', 'moderate', 'minor'];

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
};

function renderFinding(f: Finding): string {
  const targets = f.targets.map((t) => `<code>${escapeHtml(t)}</code>`).join(', ');
  const helpLink = f.helpUrl
    ? ` — <a href="${escapeHtml(f.helpUrl)}" rel="noopener noreferrer">Learn more</a>`
    : '';
  const htmlSnippet = f.html
    ? `<div class="html-snippet"><strong>HTML:</strong> <code>${escapeHtml(f.html)}</code></div>`
    : '';
  return `
      <div class="finding">
        <h4 class="finding-rule">
          <span class="badge badge-${escapeHtml(f.severity)}">${escapeHtml(SEVERITY_LABEL[f.severity])}</span>
          <code>${escapeHtml(f.ruleId)}</code>
          <span class="source-tag">[${escapeHtml(f.source)}]</span>${helpLink}
        </h4>
        <p class="finding-message">${escapeHtml(f.message)}</p>
        <p class="finding-remediation"><strong>Remediation:</strong> ${escapeHtml(f.remediation)}</p>
        <div class="finding-targets"><strong>Selector(s):</strong> ${targets || '<em>none</em>'}</div>
        ${htmlSnippet}
      </div>`;
}

function renderChecklistItem(item: ChecklistItem): string {
  const statusClass = `status-${item.status}`;
  const statusText = item.status === 'pass' ? 'Pass' : item.status === 'fail' ? 'Fail' : 'Manual';
  return `
        <li class="checklist-item">
          <span class="checklist-status ${statusClass}">${escapeHtml(statusText)}</span>
          <strong>${escapeHtml(item.title)}</strong>
          ${item.details ? `<span class="checklist-details"> — ${escapeHtml(item.details)}</span>` : ''}
        </li>`;
}

/**
 * Renders a complete, self-contained, accessible HTML accessibility report.
 * All dynamic strings from page-derived data are HTML-escaped.
 */
export function renderHtmlReport(result: AuditResult): string {
  const { url, timestampIso, findings, summary, keyboardChecklist } = result;

  // Group findings by severity
  const bySeverity: Record<Severity, Finding[]> = {
    critical: [],
    serious: [],
    moderate: [],
    minor: [],
  };
  for (const f of findings) {
    bySeverity[f.severity].push(f);
  }

  const findingsHtml = SEVERITY_ORDER.map((sev) => {
    const group = bySeverity[sev];
    if (group.length === 0) return '';
    return `
    <section aria-labelledby="sev-${sev}">
      <h3 id="sev-${sev}">${escapeHtml(SEVERITY_LABEL[sev])} (${group.length})</h3>
      ${group.map(renderFinding).join('')}
    </section>`;
  }).join('');

  const noFindingsHtml =
    findings.length === 0
      ? '<p class="no-findings">No accessibility violations detected.</p>'
      : '';

  const checklistHtml =
    keyboardChecklist.length > 0
      ? `<ul class="checklist">${keyboardChecklist.map(renderChecklistItem).join('')}</ul>`
      : '<p>No keyboard checklist items.</p>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AccessLens Report — ${escapeHtml(url)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      background: #f5f5f5;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    header {
      background: #1a1a2e;
      color: #ffffff;
      padding: 1.5rem 2rem;
    }
    header h1 { margin: 0 0 0.5rem; font-size: 1.6rem; }
    header p { margin: 0.25rem 0; font-size: 0.9rem; color: #d0d0e0; }
    main { max-width: 900px; margin: 2rem auto; padding: 0 1.5rem 3rem; }
    h2 { font-size: 1.3rem; border-bottom: 2px solid #1a1a2e; padding-bottom: 0.3rem; color: #1a1a2e; }
    h3 { font-size: 1.1rem; margin-top: 1.5rem; color: #2c2c2c; }
    h4.finding-rule { font-size: 1rem; margin: 0 0 0.4rem; display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 1rem;
      margin: 1rem 0 2rem;
    }
    .summary-card {
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 1rem;
      text-align: center;
    }
    .summary-card .count { font-size: 2rem; font-weight: 700; display: block; }
    .summary-card .label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: #444; }
    .count-critical { color: #b30000; }
    .count-serious  { color: #cc5500; }
    .count-moderate { color: #806000; }
    .count-minor    { color: #2c6e2c; }
    .count-total    { color: #1a1a2e; }
    .finding {
      background: #fff;
      border: 1px solid #ddd;
      border-left: 4px solid #999;
      border-radius: 4px;
      padding: 1rem 1.2rem;
      margin-bottom: 1rem;
    }
    .finding-message { margin: 0.3rem 0; }
    .finding-remediation { margin: 0.3rem 0; }
    .finding-targets { margin: 0.3rem 0; font-size: 0.9rem; }
    .html-snippet { margin: 0.4rem 0; font-size: 0.85rem; word-break: break-all; }
    .badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 3px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #fff;
    }
    .badge-critical { background: #b30000; }
    .badge-serious  { background: #cc5500; }
    .badge-moderate { background: #806000; }
    .badge-minor    { background: #2c6e2c; }
    .source-tag { font-size: 0.8rem; color: #555; font-weight: normal; }
    code { background: #f0f0f0; padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.88em; }
    a { color: #0055b3; }
    a:hover { text-decoration: none; }
    .no-findings { color: #2c6e2c; font-weight: 600; }
    .checklist { list-style: none; padding: 0; margin: 0; }
    .checklist-item {
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
      padding: 0.6rem 0.8rem;
      border-bottom: 1px solid #eee;
      background: #fff;
    }
    .checklist-item:first-child { border-top: 1px solid #eee; }
    .checklist-status {
      display: inline-block;
      min-width: 4.5rem;
      padding: 0.1rem 0.4rem;
      border-radius: 3px;
      font-size: 0.78rem;
      font-weight: 700;
      text-align: center;
      text-transform: uppercase;
    }
    .status-pass   { background: #d4edda; color: #155724; }
    .status-fail   { background: #f8d7da; color: #721c24; }
    .status-manual { background: #fff3cd; color: #856404; }
    .checklist-details { font-size: 0.88rem; color: #444; }
  </style>
</head>
<body>
  <header>
    <h1>AccessLens Accessibility Report</h1>
    <p><strong>URL:</strong> ${escapeHtml(url)}</p>
    <p><strong>Audited:</strong> ${escapeHtml(timestampIso)}</p>
  </header>
  <main>
    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading">Summary</h2>
      <div class="summary-grid" role="list" aria-label="Finding counts by severity">
        <div class="summary-card" role="listitem">
          <span class="count count-critical" aria-label="Critical: ${summary.critical}">${summary.critical}</span>
          <span class="label">Critical</span>
        </div>
        <div class="summary-card" role="listitem">
          <span class="count count-serious" aria-label="Serious: ${summary.serious}">${summary.serious}</span>
          <span class="label">Serious</span>
        </div>
        <div class="summary-card" role="listitem">
          <span class="count count-moderate" aria-label="Moderate: ${summary.moderate}">${summary.moderate}</span>
          <span class="label">Moderate</span>
        </div>
        <div class="summary-card" role="listitem">
          <span class="count count-minor" aria-label="Minor: ${summary.minor}">${summary.minor}</span>
          <span class="label">Minor</span>
        </div>
        <div class="summary-card" role="listitem">
          <span class="count count-total" aria-label="Total: ${summary.total}">${summary.total}</span>
          <span class="label">Total</span>
        </div>
      </div>
    </section>

    <section aria-labelledby="findings-heading">
      <h2 id="findings-heading">Findings</h2>
      ${noFindingsHtml}
      ${findingsHtml}
    </section>

    <section aria-labelledby="checklist-heading">
      <h2 id="checklist-heading">Keyboard Navigation Checklist</h2>
      ${checklistHtml}
    </section>
  </main>
</body>
</html>`;
}
