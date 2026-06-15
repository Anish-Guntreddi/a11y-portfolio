import { describe, expect, it } from 'vitest';
import { checkAltText } from './altText.js';
import type { DomSnapshot, ImageNode } from '../snapshot.js';

function makeSnapshot(images: ImageNode[]): DomSnapshot {
  return { images, headings: [], texts: [] };
}

function img(overrides: Partial<ImageNode> = {}): ImageNode {
  return {
    selector: 'body > img',
    hasAltAttr: true,
    alt: 'descriptive text',
    role: null,
    ariaHidden: false,
    ...overrides,
  };
}

describe('checkAltText', () => {
  it('returns zero findings for a clean snapshot (false-positive control)', () => {
    const snapshot = makeSnapshot([
      img({ hasAltAttr: true, alt: 'A grey placeholder' }),
      img({ selector: 'body > img:nth-of-type(2)', hasAltAttr: true, alt: '' }), // decorative
    ]);
    expect(checkAltText(snapshot)).toHaveLength(0);
  });

  it('flags an image with no alt attribute', () => {
    const snapshot = makeSnapshot([img({ hasAltAttr: false, alt: null })]);
    const findings = checkAltText(snapshot);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('rule-img-alt');
    expect(findings[0].severity).toBe('critical');
    expect(findings[0].targets).toEqual(['body > img']);
    expect(findings[0].source).toBe('custom');
  });

  it('does NOT flag an image with empty alt="" (decorative)', () => {
    const snapshot = makeSnapshot([img({ hasAltAttr: true, alt: '' })]);
    expect(checkAltText(snapshot)).toHaveLength(0);
  });

  it('does NOT flag an aria-hidden image with no alt', () => {
    const snapshot = makeSnapshot([img({ hasAltAttr: false, alt: null, ariaHidden: true })]);
    expect(checkAltText(snapshot)).toHaveLength(0);
  });

  it('does NOT flag role="presentation" image with no alt', () => {
    const snapshot = makeSnapshot([img({ hasAltAttr: false, alt: null, role: 'presentation' })]);
    expect(checkAltText(snapshot)).toHaveLength(0);
  });

  it('does NOT flag role="none" image with no alt', () => {
    const snapshot = makeSnapshot([img({ hasAltAttr: false, alt: null, role: 'none' })]);
    expect(checkAltText(snapshot)).toHaveLength(0);
  });

  it('flags multiple missing-alt images', () => {
    const snapshot = makeSnapshot([
      img({ selector: 'body > img:nth-of-type(1)', hasAltAttr: false, alt: null }),
      img({ selector: 'body > img:nth-of-type(2)', hasAltAttr: false, alt: null }),
    ]);
    const findings = checkAltText(snapshot);
    expect(findings).toHaveLength(2);
  });

  it('returns empty array for snapshot with no images', () => {
    expect(checkAltText(makeSnapshot([]))).toHaveLength(0);
  });
});
