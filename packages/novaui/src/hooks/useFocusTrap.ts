import { useRef, useEffect, RefObject } from 'react';

// ── Focusable selector ────────────────────────────────────────────────────────

/**
 * CSS selector that matches elements considered keyboard-focusable by browsers.
 * Covers the full APG-recommended tabbable set.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable]:not([contenteditable="false"])',
  'audio[controls]',
  'video[controls]',
  'details > summary',
  '[tabindex]',
].join(', ');

/**
 * Return focusable elements inside `container` ordered the way the browser tabs:
 *
 *   1. Elements with explicit tabindex > 0, sorted ascending (stable for ties).
 *   2. Elements with tabindex === 0 or no tabindex attribute, in DOM order.
 *
 * Excluded: tabindex="-1", disabled, display:none, visibility:hidden, `hidden` attr.
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const candidates = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => {
    // Exclude explicit tabindex=-1
    if (el.tabIndex < 0) return false;
    // Exclude disabled form elements not already filtered by :not([disabled])
    if ((el as HTMLButtonElement | HTMLInputElement).disabled) return false;
    // Exclude hidden attribute
    if (el.hidden) return false;
    // Exclude visually hidden (display:none or visibility:hidden)
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return true;
  });

  // Partition: positive-tabindex vs natural-order (tabindex 0 / unset)
  const positiveTab: HTMLElement[] = [];
  const naturalOrder: HTMLElement[] = [];

  for (const el of candidates) {
    if (el.tabIndex > 0) {
      positiveTab.push(el);
    } else {
      naturalOrder.push(el);
    }
  }

  // Sort positive-tabindex ascending; Array.sort is stable in modern engines.
  positiveTab.sort((a, b) => a.tabIndex - b.tabIndex);

  return [...positiveTab, ...naturalOrder];
}

/**
 * Returns true when `el` is safe to focus:
 * - Still connected to the document
 * - Is an HTMLElement with a focus method
 * - Not explicitly disabled
 * - Not hidden via the `hidden` attribute
 */
function isFocusable(el: Element | null): el is HTMLElement {
  if (!el) return false;
  if (typeof (el as HTMLElement).focus !== 'function') return false;
  if (typeof document !== 'undefined' && !document.contains(el)) return false;
  if ((el as HTMLButtonElement).disabled) return false;
  if ((el as HTMLElement).hidden) return false;
  return true;
}

/**
 * Make sibling direct-children of `container`'s portal root inert.
 * Returns a cleanup function that restores prior attribute state exactly.
 *
 * This is the M2(b) "background inertness" concern, co-located with focus trap
 * activation so the cleanup runs atomically with focus restore.
 *
 * `portalRoot` is the direct child of `document.body` that wraps this trap.
 * All OTHER direct body children are marked inert + aria-hidden.
 */
function makeBackgroundInert(portalRoot: Element): () => void {
  if (typeof document === 'undefined') return () => {};

  const bodyChildren = Array.from(document.body.children) as HTMLElement[];
  const prior: Array<{
    el: HTMLElement;
    inert: string | null;
    ariaHidden: string | null;
  }> = [];

  for (const el of bodyChildren) {
    if (el === portalRoot) continue;
    prior.push({
      el,
      inert: el.getAttribute('inert'),
      ariaHidden: el.getAttribute('aria-hidden'),
    });
    el.setAttribute('inert', '');
    el.setAttribute('aria-hidden', 'true');
  }

  return () => {
    for (const { el, inert, ariaHidden } of prior) {
      if (inert === null) {
        el.removeAttribute('inert');
      } else {
        el.setAttribute('inert', inert);
      }
      if (ariaHidden === null) {
        el.removeAttribute('aria-hidden');
      } else {
        el.setAttribute('aria-hidden', ariaHidden);
      }
    }
  };
}

// ── Options ───────────────────────────────────────────────────────────────────

export interface UseFocusTrapOptions {
  /** Ref to the element that should receive initial focus when `active` becomes true. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Fallback element to focus if the stored opener is no longer focusable on deactivation. */
  restoreFallback?: RefObject<HTMLElement | null>;
  /**
   * When true (default false), marks all sibling direct children of `document.body`
   * as `inert` + `aria-hidden` while the trap is active. The inertness is removed
   * in the same cleanup step as focus restore, so the opener is always reachable.
   *
   * Set this to true when the trap container is a portal rendered into `document.body`.
   */
  makeBackgroundInert?: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * `useFocusTrap(active, options?)`
 *
 * Returns a ref to attach to the container element. When `active` is true:
 * - Records `document.activeElement` so it can be restored on deactivation.
 * - Moves focus into the container (to `initialFocus` → first tabbable → container).
 * - Traps Tab/Shift+Tab so focus cannot leave the container.
 * - Guards against non-Tab focus escapes (AT / programmatic) via `focusin` capture.
 * - Optionally marks background body siblings as `inert` + `aria-hidden` (M2b).
 *
 * The tabbable order matches browser behaviour: tabindex > 0 first (ascending),
 * then tabindex === 0 / unset in DOM order.
 *
 * When `active` becomes false (or the component unmounts):
 * - Removes background inertness (if enabled) BEFORE restoring focus, so the
 *   opener is reachable when `.focus()` is called.
 * - Restores focus to the previously recorded element if it is still connected
 *   and focusable; otherwise falls back to `document.body`.
 *
 * SSR-safe: no `window`/`document` access during render.
 */
export function useFocusTrap(
  active: boolean,
  options?: UseFocusTrapOptions,
): RefObject<HTMLElement | null> {
  const containerRef = useRef<HTMLElement | null>(null);
  // Holds the element to return focus to when the trap deactivates.
  const restoreRef = useRef<Element | null>(null);
  // Flag set to true during focus restore so the focusin guard ignores the event.
  const isRestoringRef = useRef(false);

  // ── Activate: record prior focus, move focus into container ──────────────
  //   Also handles M2(b) background inertness when `options.makeBackgroundInert` is set.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Record the currently focused element before stealing focus.
    restoreRef.current = document.activeElement;

    // M2(b): Make background body siblings inert.
    // We find the portal root by walking up from the container to the direct
    // body child. For portals, the container is inside the backdrop, which IS
    // the direct body child.
    let restoreInertness: (() => void) | null = null;
    if (options?.makeBackgroundInert) {
      // Walk up from container to find the direct child of body.
      let portalRoot: Element = container;
      while (portalRoot.parentElement && portalRoot.parentElement !== document.body) {
        portalRoot = portalRoot.parentElement;
      }
      restoreInertness = makeBackgroundInert(portalRoot);
    }

    // Determine where initial focus should land.
    const initialEl = options?.initialFocus?.current;
    if (initialEl && container.contains(initialEl)) {
      initialEl.focus();
    } else {
      const focusable = getFocusableElements(container);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        // No focusable children — focus the container itself as fallback.
        if (!container.hasAttribute('tabindex')) {
          container.setAttribute('tabindex', '-1');
        }
        container.focus();
      }
    }

    // M3 — Restore focus to the recorded opener (verified safe) or fall back.
    return () => {
      if (typeof document === 'undefined') return;

      const toRestore = restoreRef.current as HTMLElement | null;
      restoreRef.current = null;

      // M2(b): Remove background inertness BEFORE restoring focus so the
      // opener element is reachable when .focus() is called.
      restoreInertness?.();

      // Signal the focusin guard to ignore the upcoming focus event.
      isRestoringRef.current = true;

      if (isFocusable(toRestore)) {
        toRestore.focus();
      } else {
        // Opener is gone / detached / disabled — use provided fallback or body.
        const fallback = options?.restoreFallback?.current;
        if (fallback && isFocusable(fallback)) {
          fallback.focus();
        } else {
          (document.body as HTMLElement).focus();
        }
      }

      // Reset the guard flag after the current event loop tick.
      // Using setTimeout(0) ensures any synchronous focusin handlers have fired.
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // ── Tab trap ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements(container!);

      if (focusable.length === 0) {
        // Nothing to cycle — keep focus on container, prevent leaving.
        event.preventDefault();
        container!.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        // Shift+Tab from first → wrap to last
        if (document.activeElement === first || !container!.contains(document.activeElement)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        // Tab from last → wrap to first
        if (document.activeElement === last || !container!.contains(document.activeElement)) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active]);

  // ── M2(a): focusin containment guard ──────────────────────────────────────
  // Catches non-Tab focus escapes (programmatic / AT / script) and pulls focus back.
  // Uses `isRestoringRef` to suppress the guard during the deliberate restore on close.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    function handleFocusIn(event: FocusEvent) {
      // Ignore the focusin fired by our own restore-on-close.
      if (isRestoringRef.current) return;
      if (!container!.contains(event.target as Node)) {
        // Focus moved outside the trap — pull it back to first tabbable or container.
        const focusable = getFocusableElements(container!);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          container!.focus();
        }
      }
    }

    document.addEventListener('focusin', handleFocusIn, true);
    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
    };
  }, [active]);

  return containerRef as RefObject<HTMLElement | null>;
}
