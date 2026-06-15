import { describe, expect, it } from 'vitest';
import { mapViolation, assertAxeResultShape } from './axe.js';
import { summarize } from '../types.js';

const makeViolation = (
  id: string,
  impact: string | null,
  help = 'Some help text',
  description = 'Descriptive remediation text',
  helpUrl = 'https://dequeuniversity.com/rules/axe/4.10/' + id,
  nodes = [{ target: ['#foo'], html: '<div id="foo"></div>' }],
) => ({ id, impact, help, description, helpUrl, nodes });

describe('mapViolation', () => {
  it('maps critical impact correctly', () => {
    const finding = mapViolation(makeViolation('color-contrast', 'critical'));
    expect(finding.severity).toBe('critical');
    expect(finding.ruleId).toBe('color-contrast');
    expect(finding.source).toBe('axe');
  });

  it('maps serious impact correctly', () => {
    const finding = mapViolation(makeViolation('image-alt', 'serious'));
    expect(finding.severity).toBe('serious');
  });

  it('maps moderate impact correctly', () => {
    const finding = mapViolation(makeViolation('label', 'moderate'));
    expect(finding.severity).toBe('moderate');
  });

  it('maps minor impact correctly', () => {
    const finding = mapViolation(makeViolation('html-has-lang', 'minor'));
    expect(finding.severity).toBe('minor');
  });

  it('defaults to moderate for unknown impact', () => {
    const finding = mapViolation(makeViolation('some-rule', null));
    expect(finding.severity).toBe('moderate');
  });

  it('defaults to moderate for unexpected impact string', () => {
    const finding = mapViolation(makeViolation('some-rule', 'unknown-level'));
    expect(finding.severity).toBe('moderate');
  });

  it('maps message from help field', () => {
    const finding = mapViolation(
      makeViolation('label', 'serious', 'Form elements must have labels'),
    );
    expect(finding.message).toBe('Form elements must have labels');
  });

  it('maps remediation from description field', () => {
    const finding = mapViolation(
      makeViolation('label', 'serious', 'help', 'Ensure every input has a label'),
    );
    expect(finding.remediation).toBe('Ensure every input has a label');
  });

  it('maps helpUrl', () => {
    const finding = mapViolation(
      makeViolation('label', 'serious', 'help', 'desc', 'https://example.com/label'),
    );
    expect(finding.helpUrl).toBe('https://example.com/label');
  });

  it('extracts targets from node.target arrays', () => {
    const violation = makeViolation('label', 'serious', 'help', 'desc', 'url', [
      { target: ['#input1'], html: '<input id="input1">' },
      { target: ['#input2'], html: '<input id="input2">' },
    ]);
    const finding = mapViolation(violation);
    expect(finding.targets).toEqual(['#input1', '#input2']);
  });

  it('extracts html from first node', () => {
    const finding = mapViolation(makeViolation('label', 'serious'));
    expect(finding.html).toBe('<div id="foo"></div>');
  });
});

describe('summarize', () => {
  it('counts findings by severity', () => {
    const findings = [
      mapViolation(makeViolation('r1', 'critical')),
      mapViolation(makeViolation('r2', 'critical')),
      mapViolation(makeViolation('r3', 'serious')),
      mapViolation(makeViolation('r4', 'moderate')),
      mapViolation(makeViolation('r5', 'minor')),
    ];
    const summary = summarize(findings);
    expect(summary.critical).toBe(2);
    expect(summary.serious).toBe(1);
    expect(summary.moderate).toBe(1);
    expect(summary.minor).toBe(1);
    expect(summary.total).toBe(5);
  });

  it('returns zeros for empty findings', () => {
    const summary = summarize([]);
    expect(summary).toEqual({ critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 });
  });
});

describe('assertAxeResultShape', () => {
  it('accepts a valid axe result with an empty violations array', () => {
    expect(() => assertAxeResultShape({ violations: [] })).not.toThrow();
  });

  it('accepts a valid axe result with violations', () => {
    expect(() =>
      assertAxeResultShape({ violations: [{ id: 'color-contrast' }] }),
    ).not.toThrow();
  });

  it('throws when violations is missing (e.g. CSP blocked injection)', () => {
    expect(() => assertAxeResultShape({})).toThrow(/axe-core did not return/);
  });

  it('throws when violations is not an array', () => {
    expect(() => assertAxeResultShape({ violations: 'nope' })).toThrow(
      /axe-core did not return/,
    );
  });

  it('throws for null result', () => {
    expect(() => assertAxeResultShape(null)).toThrow(/axe-core did not return/);
  });

  it('throws for undefined result', () => {
    expect(() => assertAxeResultShape(undefined)).toThrow(/axe-core did not return/);
  });
});

describe('mapViolation html truncation', () => {
  it('passes through html snippets under the 512-char limit unchanged', () => {
    const shortHtml = '<div id="foo"></div>';
    const violation = makeViolation('color-contrast', 'serious', 'help', 'desc', 'url', [
      { target: ['#foo'], html: shortHtml },
    ]);
    expect(mapViolation(violation).html).toBe(shortHtml);
  });

  it('truncates html snippets longer than 512 chars and appends ellipsis', () => {
    const longHtml = 'a'.repeat(600);
    const violation = makeViolation('color-contrast', 'serious', 'help', 'desc', 'url', [
      { target: ['#foo'], html: longHtml },
    ]);
    const result = mapViolation(violation);
    expect(result.html).toHaveLength(513); // 512 chars + '…'
    expect(result.html).toMatch(/…$/);
  });
});
