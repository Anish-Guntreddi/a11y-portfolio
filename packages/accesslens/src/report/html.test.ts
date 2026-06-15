import { describe, expect, it } from 'vitest';
import { renderHtmlReport, escapeHtml } from './html.js';
import type { AuditResult, ChecklistItem, Finding } from '../types.js';

function makeResult(overrides: Partial<AuditResult> = {}): AuditResult {
  const findings: Finding[] = [
    {
      ruleId: 'image-alt',
      severity: 'critical',
      message: 'Image is missing an alt attribute.',
      remediation: 'Add a descriptive alt attribute to the img element.',
      targets: ['img:nth-child(1)'],
      source: 'axe',
      helpUrl: 'https://example.com/image-alt',
    },
    {
      ruleId: 'color-contrast',
      severity: 'serious',
      message: 'Text has insufficient contrast ratio of 2.32:1.',
      remediation: 'Use a darker foreground color to meet a 4.5:1 ratio.',
      targets: ['.low-contrast'],
      source: 'axe',
    },
    {
      ruleId: 'rule-heading',
      severity: 'moderate',
      message: 'Heading order skips a level.',
      remediation: 'Do not skip heading levels.',
      targets: ['h4'],
      source: 'custom',
    },
    {
      ruleId: 'rule-minor',
      severity: 'minor',
      message: 'Minor issue detected.',
      remediation: 'Fix it.',
      targets: [],
      source: 'custom',
    },
  ];
  const checklist: ChecklistItem[] = [
    { id: 'focus-visible', title: 'Focus is visible', status: 'pass', details: 'All interactive elements show focus indicators.' },
    { id: 'tab-order', title: 'Tab order is logical', status: 'manual', details: 'Inspect manually.' },
    { id: 'keyboard-trap', title: 'No keyboard trap', status: 'fail', details: 'Focus was trapped in a modal.' },
  ];
  return {
    url: 'https://example.com/',
    timestampIso: '2026-06-15T12:00:00.000Z',
    findings,
    summary: { critical: 1, serious: 1, moderate: 1, minor: 1, total: 4 },
    keyboardChecklist: checklist,
    ...overrides,
  };
}

describe('renderHtmlReport', () => {
  it('produces a complete HTML document with lang="en" and a single h1', () => {
    const html = renderHtmlReport(makeResult());
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    // One h1
    const h1Matches = html.match(/<h1[^>]*>/g) ?? [];
    expect(h1Matches).toHaveLength(1);
  });

  it('includes the audited URL and timestamp in the header', () => {
    const html = renderHtmlReport(makeResult());
    expect(html).toContain('https://example.com/');
    expect(html).toContain('2026-06-15T12:00:00.000Z');
  });

  it('shows summary counts for each severity and total', () => {
    const html = renderHtmlReport(makeResult());
    // The counts appear in the summary section
    expect(html).toContain('>1<'); // critical count
    expect(html).toContain('>4<'); // total count
  });

  it('contains finding messages and remediations', () => {
    const html = renderHtmlReport(makeResult());
    expect(html).toContain('Image is missing an alt attribute.');
    expect(html).toContain('Add a descriptive alt attribute to the img element.');
    expect(html).toContain('Text has insufficient contrast ratio of 2.32:1.');
    expect(html).toContain('Heading order skips a level.');
    expect(html).toContain('Minor issue detected.');
  });

  it('shows all four severity labels', () => {
    const html = renderHtmlReport(makeResult());
    expect(html).toContain('Critical');
    expect(html).toContain('Serious');
    expect(html).toContain('Moderate');
    expect(html).toContain('Minor');
  });

  it('shows rule IDs and source tags', () => {
    const html = renderHtmlReport(makeResult());
    expect(html).toContain('image-alt');
    expect(html).toContain('color-contrast');
    expect(html).toContain('[axe]');
    expect(html).toContain('[custom]');
  });

  it('renders a helpUrl as an anchor link', () => {
    const html = renderHtmlReport(makeResult());
    expect(html).toContain('href="https://example.com/image-alt"');
    expect(html).toContain('Learn more');
  });

  it('renders checklist items with pass/fail/manual labels', () => {
    const html = renderHtmlReport(makeResult());
    expect(html).toContain('Focus is visible');
    expect(html).toContain('Tab order is logical');
    expect(html).toContain('No keyboard trap');
    expect(html).toContain('Pass');
    expect(html).toContain('Fail');
    expect(html).toContain('Manual');
  });

  it('shows "No accessibility violations detected." when findings is empty', () => {
    const html = renderHtmlReport(
      makeResult({ findings: [], summary: { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 } }),
    );
    expect(html).toContain('No accessibility violations detected.');
  });

  it('SECURITY: HTML-escapes a finding message containing <script>', () => {
    const xssResult = makeResult({
      findings: [
        {
          ruleId: 'evil-rule',
          severity: 'critical',
          message: '<script>alert("xss")</script>',
          remediation: 'Fix <b>this</b>',
          targets: ['<img onerror="x">'],
          source: 'axe',
        },
      ],
      summary: { critical: 1, serious: 0, moderate: 0, minor: 0, total: 1 },
    });
    const html = renderHtmlReport(xssResult);

    // Raw script tag from data must NOT appear
    expect(html).not.toContain('<script>alert');
    // Escaped form must appear
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;/script&gt;');

    // Remediation with <b> must be escaped too
    expect(html).toContain('Fix &lt;b&gt;this&lt;/b&gt;');

    // Target with injection must be escaped
    expect(html).toContain('&lt;img onerror=');
  });

  it('SECURITY: HTML-escapes a checklist detail containing &', () => {
    const result = makeResult({
      keyboardChecklist: [
        { id: 'x', title: 'Check A & B', status: 'pass', details: 'Tested <manually>' },
      ],
    });
    const html = renderHtmlReport(result);
    expect(html).toContain('Check A &amp; B');
    expect(html).toContain('Tested &lt;manually&gt;');
  });
});

describe('escapeHtml', () => {
  it('escapes all five special HTML characters', () => {
    expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
  it('returns an unmodified string when no special chars are present', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});
