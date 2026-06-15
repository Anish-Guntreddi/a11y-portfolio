import { useRef, useEffect, RefObject } from 'react';

// ── Focusable selector ────────────────────────────────────────────────────────

/**
 * CSS selector that matches elements considered keyboard-focusable.
 * We query live each time Tab is pressed so dynamically added/removed
 * elements are always accounted for.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary',
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => {
    // Exclude hidden elements
    if (el.hidden) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

// ── Options ───────────────────────────────────────────────────────────────────

export interface UseFocusTrapOptions {
  /** Ref to the element that should receive initial focus when `active` becomes true. */
  initialFocus?: RefObject<HTMLElement | null>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * `useFocusTrap(active, options?)`
 *
 * Returns a ref to attach to the container element.  When `active` is true:
 * - Records `document.activeElement` so it can be restored on deactivation.
 * - Moves focus into the container (to `initialFocus` → first focusable → container).
 * - Traps Tab/Shift+Tab so focus cannot leave the container.
 *
 * When `active` becomes false (or the component unmounts):
 * - Restores focus to the previously recorded element if it still exists.
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

  // ── Activate: record prior focus, move focus into container ──────────────
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Record the currently focused element before stealing focus.
    restoreRef.current = document.activeElement;

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

    // Restore focus when this effect is cleaned up (active → false, or unmount).
    return () => {
      if (typeof document === 'undefined') return;
      const toRestore = restoreRef.current as HTMLElement | null;
      if (toRestore && typeof toRestore.focus === 'function' && document.contains(toRestore)) {
        toRestore.focus();
      }
      restoreRef.current = null;
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

  return containerRef as RefObject<HTMLElement | null>;
}
