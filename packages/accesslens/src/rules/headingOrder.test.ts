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

  describe('ARIA headings (role="heading" + aria-level)', () => {
    it('no-h1 is detected when only an ARIA h1 is absent and native headings start at h2', () => {
      // Simulates a snapshot where headings include an ARIA-heading at level 2 but no h1
      const headings: HeadingNode[] = [
        { level: 2, text: 'Section', selector: 'body > div:nth-of-type(1)' },
      ];
      const findings = checkHeadingOrder(makeSnapshot(headings));
      expect(findings.some((f) => f.severity === 'serious' && f.message.includes('no h1'))).toBe(true);
    });

    it('ARIA heading at level 1 satisfies the no-h1 check', () => {
      // An element with role="heading" aria-level="1" captured as level:1 in the snapshot
      const headings: HeadingNode[] = [
        { level: 1, text: 'ARIA Heading', selector: 'body > div:nth-of-type(1)' },
        { level: 2, text: 'Section', selector: 'body > div:nth-of-type(2)' },
      ];
      const findings = checkHeadingOrder(makeSnapshot(headings));
      expect(findings.filter((f) => f.severity === 'serious')).toHaveLength(0);
    });

    it('level jump is detected using ARIA headings in document order', () => {
      // ARIA h1 followed by ARIA h3 — jump of 2
      const headings: HeadingNode[] = [
        { level: 1, text: 'Top', selector: 'body > div:nth-of-type(1)' },
        { level: 3, text: 'Sub', selector: 'body > div:nth-of-type(2)' },
      ];
      const findings = checkHeadingOrder(makeSnapshot(headings));
      const jump = findings.find((f) => f.severity === 'moderate');
      expect(jump).toBeDefined();
      expect(jump?.message).toContain('h3');
    });
  });
});
