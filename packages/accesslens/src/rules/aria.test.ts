import { describe, expect, it } from 'vitest';
import { checkAriaValidRole, checkAriaHiddenFocusable } from './aria.js';
import type { DomSnapshot, AriaNode } from '../snapshot.js';

function makeSnapshot(overrides: Partial<DomSnapshot> = {}): DomSnapshot {
  return {
    images: [],
    headings: [],
    texts: [],
    landmarks: [],
    ariaElements: [],
    interactiveElements: [],
    skipLink: false,
    ...overrides,
  };
}

function ariaEl(overrides: Partial<AriaNode> = {}): AriaNode {
  return {
    selector: 'body > span',
    role: 'button',
    ariaHidden: false,
    focusable: false,
    tabindex: null,
    invalidRole: false,
    ...overrides,
  };
}

describe('checkAriaValidRole', () => {
  it('returns no finding when all roles are valid', () => {
    const snapshot = makeSnapshot({
      ariaElements: [ariaEl({ role: 'button', invalidRole: false })],
    });
    expect(checkAriaValidRole(snapshot)).toHaveLength(0);
  });

  it('returns no finding when element has no role', () => {
    const snapshot = makeSnapshot({
      ariaElements: [ariaEl({ role: null, invalidRole: false })],
    });
    expect(checkAriaValidRole(snapshot)).toHaveLength(0);
  });

  it('returns serious finding for invalid role', () => {
    const snapshot = makeSnapshot({
      ariaElements: [ariaEl({ role: 'buton', invalidRole: true })],
    });
    const findings = checkAriaValidRole(snapshot);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('rule-aria-valid-role');
    expect(findings[0].severity).toBe('serious');
    expect(findings[0].message).toContain('buton');
    expect(findings[0].targets).toEqual(['body > span']);
    expect(findings[0].source).toBe('custom');
  });

  it('returns one finding per invalid role element', () => {
    const snapshot = makeSnapshot({
      ariaElements: [
        ariaEl({ selector: 'body > span:nth-of-type(1)', role: 'buton', invalidRole: true }),
        ariaEl({ selector: 'body > span:nth-of-type(2)', role: 'linck', invalidRole: true }),
        ariaEl({ selector: 'body > div', role: 'link', invalidRole: false }),
      ],
    });
    expect(checkAriaValidRole(snapshot)).toHaveLength(2);
  });

  it('returns no findings when ariaElements is empty', () => {
    expect(checkAriaValidRole(makeSnapshot({ ariaElements: [] }))).toHaveLength(0);
  });

  it('uses ariaElements ?? [] when undefined', () => {
    expect(checkAriaValidRole(makeSnapshot({ ariaElements: undefined }))).toHaveLength(0);
  });
});

describe('checkAriaHiddenFocusable', () => {
  it('returns no finding when aria-hidden element is not focusable', () => {
    const snapshot = makeSnapshot({
      ariaElements: [ariaEl({ ariaHidden: true, focusable: false })],
    });
    expect(checkAriaHiddenFocusable(snapshot)).toHaveLength(0);
  });

  it('returns no finding when focusable element is not aria-hidden', () => {
    const snapshot = makeSnapshot({
      ariaElements: [ariaEl({ ariaHidden: false, focusable: true })],
    });
    expect(checkAriaHiddenFocusable(snapshot)).toHaveLength(0);
  });

  it('returns serious finding when aria-hidden element is focusable', () => {
    const snapshot = makeSnapshot({
      ariaElements: [ariaEl({ ariaHidden: true, focusable: true })],
    });
    const findings = checkAriaHiddenFocusable(snapshot);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('rule-aria-hidden-focusable');
    expect(findings[0].severity).toBe('serious');
    expect(findings[0].targets).toEqual(['body > span']);
    expect(findings[0].source).toBe('custom');
  });

  it('returns one finding per offending element', () => {
    const snapshot = makeSnapshot({
      ariaElements: [
        ariaEl({ selector: 'body > a', ariaHidden: true, focusable: true }),
        ariaEl({ selector: 'body > button', ariaHidden: true, focusable: true }),
        ariaEl({ selector: 'body > span', ariaHidden: true, focusable: false }),
      ],
    });
    expect(checkAriaHiddenFocusable(snapshot)).toHaveLength(2);
  });

  it('returns no findings when ariaElements is empty', () => {
    expect(checkAriaHiddenFocusable(makeSnapshot({ ariaElements: [] }))).toHaveLength(0);
  });

  it('uses ariaElements ?? [] when undefined', () => {
    expect(checkAriaHiddenFocusable(makeSnapshot({ ariaElements: undefined }))).toHaveLength(0);
  });
});
