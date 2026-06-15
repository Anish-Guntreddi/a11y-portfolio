import { describe, expect, it } from 'vitest';
import { checkLandmarkMain, checkLandmarkUniqueNames } from './landmarks.js';
import type { DomSnapshot, LandmarkNode } from '../snapshot.js';

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

function landmark(
  role: string,
  selector: string,
  accessibleName: string | null = null,
): LandmarkNode {
  return { role, tag: role === 'navigation' ? 'nav' : role, accessibleName, selector };
}

describe('checkLandmarkMain', () => {
  it('returns serious finding when no main landmark exists', () => {
    const snapshot = makeSnapshot({ landmarks: [] });
    const findings = checkLandmarkMain(snapshot);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('rule-landmark-main');
    expect(findings[0].severity).toBe('serious');
    expect(findings[0].targets).toEqual(['body']);
    expect(findings[0].source).toBe('custom');
  });

  it('returns no finding when exactly one main landmark exists', () => {
    const snapshot = makeSnapshot({
      landmarks: [landmark('main', 'body > main')],
    });
    expect(checkLandmarkMain(snapshot)).toHaveLength(0);
  });

  it('returns moderate finding when two main landmarks exist', () => {
    const snapshot = makeSnapshot({
      landmarks: [
        landmark('main', 'body > main:nth-of-type(1)'),
        landmark('main', 'body > main:nth-of-type(2)'),
      ],
    });
    const findings = checkLandmarkMain(snapshot);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('rule-landmark-main');
    expect(findings[0].severity).toBe('moderate');
    expect(findings[0].message).toContain('2');
    expect(findings[0].targets).toHaveLength(2);
  });

  it('uses snapshot.landmarks ?? [] when landmarks is undefined', () => {
    const snapshot = makeSnapshot({ landmarks: undefined });
    const findings = checkLandmarkMain(snapshot);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('serious');
  });
});

describe('checkLandmarkUniqueNames', () => {
  it('returns no finding for a single nav (no duplication)', () => {
    const snapshot = makeSnapshot({
      landmarks: [landmark('navigation', 'body > nav', 'Main navigation')],
    });
    expect(checkLandmarkUniqueNames(snapshot)).toHaveLength(0);
  });

  it('returns no finding when two navs have distinct names', () => {
    const snapshot = makeSnapshot({
      landmarks: [
        landmark('navigation', 'body > nav:nth-of-type(1)', 'Main navigation'),
        landmark('navigation', 'body > nav:nth-of-type(2)', 'Secondary navigation'),
      ],
    });
    expect(checkLandmarkUniqueNames(snapshot)).toHaveLength(0);
  });

  it('returns finding when two navs have the same name', () => {
    const snapshot = makeSnapshot({
      landmarks: [
        landmark('navigation', 'body > nav:nth-of-type(1)', 'Navigation'),
        landmark('navigation', 'body > nav:nth-of-type(2)', 'Navigation'),
      ],
    });
    const findings = checkLandmarkUniqueNames(snapshot);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('rule-landmark-unique-names');
    expect(findings[0].severity).toBe('moderate');
    expect(findings[0].targets).toHaveLength(2);
  });

  it('returns finding when two navs have null accessible names', () => {
    const snapshot = makeSnapshot({
      landmarks: [
        landmark('navigation', 'body > nav:nth-of-type(1)', null),
        landmark('navigation', 'body > nav:nth-of-type(2)', null),
      ],
    });
    const findings = checkLandmarkUniqueNames(snapshot);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('rule-landmark-unique-names');
    expect(findings[0].message).toContain('navigation');
  });

  it('returns no finding when landmarks have different roles', () => {
    const snapshot = makeSnapshot({
      landmarks: [
        landmark('navigation', 'body > nav', null),
        landmark('main', 'body > main', null),
      ],
    });
    expect(checkLandmarkUniqueNames(snapshot)).toHaveLength(0);
  });

  it('returns findings for multiple role groups with name issues', () => {
    const snapshot = makeSnapshot({
      landmarks: [
        landmark('navigation', 'body > nav:nth-of-type(1)', null),
        landmark('navigation', 'body > nav:nth-of-type(2)', null),
        landmark('complementary', 'body > aside:nth-of-type(1)', 'Sidebar'),
        landmark('complementary', 'body > aside:nth-of-type(2)', 'Sidebar'),
      ],
    });
    const findings = checkLandmarkUniqueNames(snapshot);
    expect(findings).toHaveLength(2);
  });
});
