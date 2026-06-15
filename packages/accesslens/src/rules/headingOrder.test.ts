import { describe, expect, it } from 'vitest';
import { checkHeadingOrder } from './headingOrder.js';
import type { DomSnapshot, HeadingNode } from '../snapshot.js';

function makeSnapshot(headings: HeadingNode[]): DomSnapshot {
  return { images: [], headings, texts: [] };
}

function h(level: 1 | 2 | 3 | 4 | 5 | 6, selector = `body > h${level}`): HeadingNode {
  return { level, text: `Heading ${level}`, selector };
}

describe('checkHeadingOrder', () => {
  it('returns zero findings for a clean hierarchy (false-positive control)', () => {
    const snapshot = makeSnapshot([h(1), h(2), h(3), h(2), h(3)]);
    expect(checkHeadingOrder(snapshot)).toHaveLength(0);
  });

  it('returns zero findings for a single h1', () => {
    expect(checkHeadingOrder(makeSnapshot([h(1)]))).toHaveLength(0);
  });

  it('flags missing h1 (no headings at all)', () => {
    const findings = checkHeadingOrder(makeSnapshot([]));
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('rule-heading-order');
    expect(findings[0].severity).toBe('serious');
    expect(findings[0].targets).toEqual(['body']);
    expect(findings[0].source).toBe('custom');
  });

  it('flags missing h1 when only h2 and h3 present', () => {
    const findings = checkHeadingOrder(makeSnapshot([h(2), h(3)]));
    expect(findings.some((f) => f.severity === 'serious')).toBe(true);
    expect(findings.some((f) => f.message.includes('no h1'))).toBe(true);
  });

  it('flags h1 → h3 skip (jump of 2)', () => {
    const h3 = { level: 3 as const, text: 'Sub', selector: 'body > h3' };
    const findings = checkHeadingOrder(makeSnapshot([h(1), h3]));
    const jumpFindings = findings.filter((f) => f.severity === 'moderate');
    expect(jumpFindings).toHaveLength(1);
    expect(jumpFindings[0].ruleId).toBe('rule-heading-order');
    expect(jumpFindings[0].targets).toEqual(['body > h3']);
  });

  it('flags h1 → h4 skip (planted bad.html scenario)', () => {
    const h4 = { level: 4 as const, text: 'Sub-section', selector: 'body > h4' };
    const findings = checkHeadingOrder(makeSnapshot([h(1), h4]));
    const jump = findings.find((f) => f.severity === 'moderate');
    expect(jump).toBeDefined();
    expect(jump?.message).toContain('h1');
    expect(jump?.message).toContain('h4');
  });

  it('does NOT flag h1 → h2 (jump of 1)', () => {
    const findings = checkHeadingOrder(makeSnapshot([h(1), h(2)]));
    expect(findings.filter((f) => f.severity === 'moderate')).toHaveLength(0);
  });

  it('flags multiple jumps', () => {
    const headings: HeadingNode[] = [
      h(1),
      { level: 3, text: 'Skip', selector: 'body > h3' },
      { level: 5, text: 'Skip again', selector: 'body > h5' },
    ];
    const findings = checkHeadingOrder(makeSnapshot(headings)).filter(
      (f) => f.severity === 'moderate',
    );
    expect(findings).toHaveLength(2);
  });

  it('does not flag going down (h3 → h2 is valid)', () => {
    const findings = checkHeadingOrder(makeSnapshot([h(1), h(3), h(2)]));
    // Only the h1→h3 jump should be flagged, not h3→h2
    const moderate = findings.filter((f) => f.severity === 'moderate');
    expect(moderate).toHaveLength(1);
  });
});
