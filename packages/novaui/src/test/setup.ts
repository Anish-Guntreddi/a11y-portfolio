import '@testing-library/jest-dom';

// jsdom 25 does not implement PointerEvent; polyfill it so tests for
// onPointerDown handlers (e.g. Modal backdrop) work correctly.
if (typeof PointerEvent === 'undefined') {
  // Minimal polyfill: PointerEvent extends MouseEvent with pointer-specific props.
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    isPrimary: boolean;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 1;
      this.pointerType = params.pointerType ?? 'mouse';
      this.isPrimary = params.isPrimary ?? true;
    }
  }
  // @ts-expect-error — intentionally assigning to a read-only global
  globalThis.PointerEvent = PointerEventPolyfill;
}
