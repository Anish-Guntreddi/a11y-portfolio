import { describe, expect, it } from 'vitest';
import { checkContrast } from './contrast.js';
import type { DomSnapshot, TextNode } from '../snapshot.js';

function makeSnapshot(texts: TextNode[]): DomSnapshot {
  return { images: [], headings: [], texts };
}

function node(overrides: Partial<TextNode> = {}): TextNode {
  return {
    selector: 'body > p',
    text: 'Some text',
    color: 'rgb(34,34,34)',           // #222 — high contrast on white
    backgroundColor: 'rgb(255,255,255)',
    fontSizePx: 16,
    fontWeightNum: 400,
    ...overrides,
  };
}

describe('checkContrast', () => {
  it('returns zero findings for a clean snapshot (false-positive control)', () => {
    // #222 on #fff ≈ 16:1 → passes
    const snapshot = makeSnapshot([node()]);
    expect(checkContrast(snapshot)).toHaveLength(0);
  });

  it('returns zero findings for empty texts', () => {
    expect(checkContrast(makeSnapshot([]))).toHaveLength(0);
  });

  it('flags #aaa on #fff (≈2.32:1, normal 16px — threshold 4.5)', () => {
    const snapshot = makeSnapshot([
      node({ color: 'rgb(170,170,170)', backgroundColor: 'rgb(255,255,255)', fontSizePx: 16 }),
    ]);
    const findings = checkContrast(snapshot);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('rule-contrast');
    expect(findings[0].severity).toBe('serious');
    expect(findings[0].source).toBe('custom');
    expect(findings[0].message).toContain('2.');  // ratio in message
  });

  it('does NOT flag #aaa on #fff as large text (threshold 3.0 — 2.32 still fails)', () => {
    // Large text threshold is 3.0 — #aaa on #fff at ~2.32 still fails even for large text
    const snapshot = makeSnapshot([
      node({
        color: 'rgb(170,170,170)',
        backgroundColor: 'rgb(255,255,255)',
        fontSizePx: 24,
        fontWeightNum: 400,
      }),
    ]);
    expect(checkContrast(snapshot)).toHaveLength(1);
  });

  it('does NOT flag a colour that passes the large-text threshold (3.0)', () => {
    // rgb(128,128,128) on white ≈ 3.95:1 — passes large text (≥3.0), fails normal (4.5)
    const snapshot = makeSnapshot([
      node({
        color: 'rgb(128,128,128)',
        backgroundColor: 'rgb(255,255,255)',
        fontSizePx: 24,    // large text
        fontWeightNum: 400,
      }),
    ]);
    // 3.95 >= 3.0 → no finding
    expect(checkContrast(snapshot)).toHaveLength(0);
  });

  it('flags the same colour for normal text (threshold 4.5)', () => {
    // rgb(128,128,128) on white ≈ 3.95 < 4.5 → flagged for 16px normal text
    const snapshot = makeSnapshot([
      node({
        color: 'rgb(128,128,128)',
        backgroundColor: 'rgb(255,255,255)',
        fontSizePx: 16,
        fontWeightNum: 400,
      }),
    ]);
    expect(checkContrast(snapshot)).toHaveLength(1);
  });

  it('includes the measured ratio in the finding message', () => {
    const snapshot = makeSnapshot([
      node({ color: 'rgb(170,170,170)', backgroundColor: 'rgb(255,255,255)' }),
    ]);
    const [f] = checkContrast(snapshot);
    expect(f.message).toMatch(/\d+\.\d+:1/);
  });

  it('skips nodes with unparseable colour values', () => {
    const snapshot = makeSnapshot([node({ color: 'currentColor' })]);
    expect(checkContrast(snapshot)).toHaveLength(0);
  });

  it('bold 18.66px is treated as large text (threshold 3.0)', () => {
    // rgb(128,128,128) on white ≈ 3.95:1 — passes large text (3.0) but fails normal (4.5)
    const snapshot = makeSnapshot([
      node({
        color: 'rgb(128,128,128)',
        backgroundColor: 'rgb(255,255,255)',
        fontSizePx: 18.66,
        fontWeightNum: 700,
      }),
    ]);
    expect(checkContrast(snapshot)).toHaveLength(0);
  });
});
