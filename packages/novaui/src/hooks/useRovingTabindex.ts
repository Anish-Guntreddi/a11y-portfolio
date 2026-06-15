import { useCallback, useRef, useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseRovingTabindexOptions {
  /**
   * Total number of items managed.
   */
  count: number;
  /**
   * Initially active index. Defaults to 0.
   * If this index is disabled, the hook advances to the next enabled item.
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
 * N1: `initialIndex` is clamped to the first enabled item if it resolves to a
 * disabled index. When `count` or `disabledIndices` change, the active index
 * is re-validated so tabindex=0 always sits on a valid, enabled, in-range item.
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

  // N1: Compute first enabled index at init time, respecting initialIndex.
  function resolveInitialIndex(
    preferred: number,
    total: number,
    disabled: number[],
  ): number {
    // Try the preferred index first if it's enabled and in range.
    if (preferred >= 0 && preferred < total && !disabled.includes(preferred)) {
      return preferred;
    }
    // Walk forward from preferred to find first enabled item.
    for (let i = 0; i < total; i++) {
      const idx = (preferred + i) % total;
      if (!disabled.includes(idx)) return idx;
    }
    // All disabled — return preferred clamped to range.
    return Math.min(preferred, total - 1);
  }

  const [activeIndex, setActiveIndexState] = useState<number>(() =>
    resolveInitialIndex(initialIndex, count, disabledIndices),
  );

  // N1: Re-clamp active index whenever count or disabledIndices change.
  useEffect(() => {
    setActiveIndexState((prev) => {
      // If previous index is still valid and enabled, keep it.
      if (prev >= 0 && prev < count && !disabledIndices.includes(prev)) {
        return prev;
      }
      // Otherwise, find the nearest valid enabled index.
      return resolveInitialIndex(prev, count, disabledIndices);
    });
  // We intentionally stringify disabledIndices for stable comparison
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, JSON.stringify(disabledIndices)]);

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

  // Track a "cancelled" flag so that if the component unmounts before the
  // microtask fires, we don't focus a detached node.
  const cancelledRef = useRef(false);

  const setActiveIndex = useCallback(
    (index: number) => {
      setActiveIndexState(index);
      // Focus is called in a microtask so state has settled.
      // We guard against calling focus on a detached element (e.g. after unmount).
      Promise.resolve().then(() => {
        if (cancelledRef.current) return;
        const el = itemRefs.current[index];
        if (el && (typeof document === 'undefined' || document.contains(el))) {
          el.focus();
        }
      });
    },
    [],
  );

  // Clear the cancel flag reset on unmount so pending microtasks don't focus.
  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

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
