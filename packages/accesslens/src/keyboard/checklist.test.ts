import { describe, expect, it } from 'vitest';
import { buildKeyboardChecklist } from './checklist.js';
import type { DomSnapshot, InteractiveNode, AriaNode } from '../snapshot.js';

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

function interactiveEl(overrides: Partial<InteractiveNode> = {}): InteractiveNode {
  return {
    selector: 'body > button',
    tag: 'button',
    tabindex: null,
    role: 'button',
    accessibleName: 'Click me',
    ...overrides,
  };
}

function ariaEl(overrides: Partial<AriaNode> = {}): AriaNode {
  return {
    selector: 'body > div',
    role: 'button',
    ariaHidden: false,
    focusable: true,
    tabindex: null,
    invalidRole: false,
    ...overrides,
  };
}

describe('buildKeyboardChecklist', () => {
  it('returns 5 items always', () => {
    const checklist = buildKeyboardChecklist(makeSnapshot());
    expect(checklist).toHaveLength(5);
  });

  describe('no-positive-tabindex', () => {
    it('passes when no elements have positive tabindex', () => {
      const snapshot = makeSnapshot({
        interactiveElements: [interactiveEl({ tabindex: null })],
        ariaElements: [ariaEl({ tabindex: 0 })],
      });
      const item = buildKeyboardChecklist(snapshot).find((i) => i.id === 'no-positive-tabindex');
      expect(item?.status).toBe('pass');
    });

    it('fails when an interactive element has tabindex > 0', () => {
      const snapshot = makeSnapshot({
        interactiveElements: [interactiveEl({ tabindex: 3 })],
      });
      const item = buildKeyboardChecklist(snapshot).find((i) => i.id === 'no-positive-tabindex');
      expect(item?.status).toBe('fail');
      expect(item?.details).toContain('body > button');
    });

    it('fails when an aria element has tabindex > 0', () => {
      const snapshot = makeSnapshot({
        ariaElements: [ariaEl({ tabindex: 1 })],
      });
      const item = buildKeyboardChecklist(snapshot).find((i) => i.id === 'no-positive-tabindex');
      expect(item?.status).toBe('fail');
    });

    it('passes when tabindex is 0', () => {
      const snapshot = makeSnapshot({
        interactiveElements: [interactiveEl({ tabindex: 0 })],
      });
      const item = buildKeyboardChecklist(snapshot).find((i) => i.id === 'no-positive-tabindex');
      expect(item?.status).toBe('pass');
    });
  });

  describe('interactive-focusable', () => {
    it('passes when no interactive elements have tabindex=-1', () => {
      const snapshot = makeSnapshot({
        interactiveElements: [interactiveEl({ tabindex: null })],
      });
      const item = buildKeyboardChecklist(snapshot).find((i) => i.id === 'interactive-focusable');
      expect(item?.status).toBe('pass');
    });

    it('fails when an interactive element has tabindex=-1', () => {
      const snapshot = makeSnapshot({
        interactiveElements: [interactiveEl({ tabindex: -1 })],
      });
      const item = buildKeyboardChecklist(snapshot).find((i) => i.id === 'interactive-focusable');
      expect(item?.status).toBe('fail');
      expect(item?.details).toContain('body > button');
    });
  });

  describe('skip-link', () => {
    it('passes when skipLink is true', () => {
      const snapshot = makeSnapshot({ skipLink: true });
      const item = buildKeyboardChecklist(snapshot).find((i) => i.id === 'skip-link');
      expect(item?.status).toBe('pass');
    });

    it('fails when skipLink is false', () => {
      const snapshot = makeSnapshot({ skipLink: false });
      const item = buildKeyboardChecklist(snapshot).find((i) => i.id === 'skip-link');
      expect(item?.status).toBe('fail');
      expect(item?.details).toContain('skip-to-content');
    });

    it('fails when skipLink is undefined', () => {
      const snapshot = makeSnapshot({ skipLink: undefined });
      const item = buildKeyboardChecklist(snapshot).find((i) => i.id === 'skip-link');
      expect(item?.status).toBe('fail');
    });
  });

  describe('focus-visible', () => {
    it('is always manual', () => {
      const item = buildKeyboardChecklist(makeSnapshot()).find((i) => i.id === 'focus-visible');
      expect(item?.status).toBe('manual');
      expect(item?.details).toContain('Tab key');
    });
  });

  describe('no-keyboard-trap', () => {
    it('is always manual', () => {
      const item = buildKeyboardChecklist(makeSnapshot()).find((i) => i.id === 'no-keyboard-trap');
      expect(item?.status).toBe('manual');
      expect(item?.details).toContain('Shift+Tab');
    });
  });
});
