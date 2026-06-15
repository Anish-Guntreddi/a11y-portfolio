import { useCallback, useRef, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseRovingTabindexOptions {
  /**
   * Total number of items managed.
   */
  count: number;
  /**
   * Initially active index. Defaults to 0.
   */
  initialIndex?: number;
  /**
   * Array of disabled indices — these are skipped during navigation.
   */
  disabledIndices?: number[];
}

export interface UseRovingTabindexReturn {
  /**
   * The currently active (tabbable) index.
   */
  activeIndex: number;
  /**
   * Set the active index imperatively (e.g. on mouse enter or programmatic focus).
   */
  setActiveIndex: (index: number) => void;
  /**
   * Returns props to spread onto each item element.
   * Pass the item's index.
   */
  getItemProps: (index: number) => {
    tabIndex: 0 | -1;
    ref: (el: HTMLElement | null) => void;
    onKeyDown: (event: React.KeyboardEvent) => void;
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * `useRovingTabindex(options)`
 *
 * Manages roving tabindex over an ordered list of items:
 * - Exactly ONE item has `tabIndex=0` at a time (the active item).
 * - All other items get `tabIndex=-1`.
 * - ArrowDown / ArrowUp move the active index with wrap-around.
 * - Home / End jump to first / last enabled item.
 * - Navigation automatically calls `.focus()` on the newly active element.
 * - Disabled indices are skipped.
 *
 * Generic / SSR-safe: no DOM access during render.
 */
export function useRovingTabindex({
  count,
  initialIndex = 0,
  disabledIndices = [],
}: UseRovingTabindexOptions): UseRovingTabindexReturn {
  // Refs array — populated by the ref callback returned in getItemProps.
  const itemRefs = useRef<Array<HTMLElement | null>>([]);

  const [activeIndex, setActiveIndexState] = useState<number>(initialIndex);

  // Find the next enabled index, wrapping around.
  const findNext = useCallback(
    (from: number, direction: 1 | -1): number => {
      let idx = from;
      for (let i = 0; i < count; i++) {
        idx = (idx + direction + count) % count;
        if (!disabledIndices.includes(idx)) return idx;
      }
      // All items are disabled — return the starting index unchanged.
      return from;
    },
    [count, disabledIndices],
  );

  const findFirst = useCallback((): number => {
    for (let i = 0; i < count; i++) {
      if (!disabledIndices.includes(i)) return i;
    }
    return 0;
  }, [count, disabledIndices]);

  const findLast = useCallback((): number => {
    for (let i = count - 1; i >= 0; i--) {
      if (!disabledIndices.includes(i)) return i;
    }
    return count - 1;
  }, [count, disabledIndices]);

  const focusItem = useCallback((index: number) => {
    if (typeof document === 'undefined') return;
    itemRefs.current[index]?.focus();
  }, []);

  const setActiveIndex = useCallback(
    (index: number) => {
      setActiveIndexState(index);
      // Focus is called in a microtask so state has settled.
      Promise.resolve().then(() => focusItem(index));
    },
    [focusItem],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      let next: number | null = null;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          next = findNext(activeIndex, 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          next = findNext(activeIndex, -1);
          break;
        case 'Home':
          event.preventDefault();
          next = findFirst();
          break;
        case 'End':
          event.preventDefault();
          next = findLast();
          break;
        default:
          return;
      }

      if (next !== null && next !== activeIndex) {
        setActiveIndexState(next);
        focusItem(next);
      }
    },
    [activeIndex, findNext, findFirst, findLast, focusItem],
  );

  const getItemProps = useCallback(
    (index: number) => ({
      tabIndex: (index === activeIndex ? 0 : -1) as 0 | -1,
      ref: (el: HTMLElement | null) => {
        itemRefs.current[index] = el;
      },
      onKeyDown: handleKeyDown,
    }),
    [activeIndex, handleKeyDown],
  );

  return { activeIndex, setActiveIndex, getItemProps };
}
