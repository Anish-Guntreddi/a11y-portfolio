import React, { useId, useRef, useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { useRovingTabindex } from '../../hooks/useRovingTabindex';
import './Menu.css';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MenuItem {
  /** Unique identifier for the item. */
  id: string;
  /** Display label. */
  label: string;
  /** Called when the item is activated (Enter, Space, or click). */
  onSelect: () => void;
  /** When true the item is rendered but skipped by keyboard navigation and not activatable. */
  disabled?: boolean;
}

export interface MenuProps {
  /** Text rendered inside the trigger button. */
  label: string;
  /** Menu items. */
  items: MenuItem[];
  /** Additional className for the outer wrapper. */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Accessible Menu Button following the WAI-ARIA APG "Menu Button" pattern.
 *
 * Keyboard behaviour:
 *   Trigger: Enter / Space / ArrowDown  → open + focus FIRST enabled item
 *            ArrowUp                    → open + focus LAST  enabled item
 *   Menu:    ArrowDown / ArrowUp        → navigate (wrap-around, skip disabled)
 *            Home / End                 → first / last enabled item
 *            Enter / Space              → activate focused item, close, return focus to trigger
 *            Escape                     → close, return focus to trigger
 *            Tab                        → close (focus proceeds naturally via browser)
 *
 * Focus ring on items is guaranteed non-removable via `.nui-menu-item:focus-visible`
 * (a dedicated CSS selector that cannot be overridden by consumer className).
 */
export function Menu({ label, items, className }: MenuProps) {
  const triggerId = useId();
  const menuId = useId();

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Indices of disabled items — these are skipped by roving tabindex.
  const disabledIndices = items.reduce<number[]>((acc, item, i) => {
    if (item.disabled) acc.push(i);
    return acc;
  }, []);

  const { setActiveIndex, getItemProps } = useRovingTabindex({
    count: items.length,
    initialIndex: 0,
    disabledIndices,
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  function firstEnabledIndex(): number {
    for (let i = 0; i < items.length; i++) {
      if (!items[i].disabled) return i;
    }
    return 0;
  }

  function lastEnabledIndex(): number {
    for (let i = items.length - 1; i >= 0; i--) {
      if (!items[i].disabled) return i;
    }
    return items.length - 1;
  }

  const openMenu = useCallback(
    (focusIndex: number) => {
      setOpen(true);
      // setActiveIndex focuses asynchronously via Promise.resolve; that's fine
      // because the menu renders synchronously and refs are populated before
      // the microtask runs (React flushes synchronously in this code path).
      setActiveIndex(focusIndex);
    },
    [setActiveIndex],
  );

  const closeMenu = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) {
      // Return focus to the trigger after the menu unmounts.
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }, []);

  // ── Outside-click / outside-focus handler ────────────────────────────────
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        closeMenu(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open, closeMenu]);

  // ── Trigger keyboard handler ─────────────────────────────────────────────
  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open) {
          closeMenu();
        } else {
          openMenu(firstEnabledIndex());
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        openMenu(firstEnabledIndex());
        break;
      case 'ArrowUp':
        event.preventDefault();
        openMenu(lastEnabledIndex());
        break;
      default:
        break;
    }
  }

  // ── Menu keyboard handler (Escape + Tab) ─────────────────────────────────
  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLUListElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
    } else if (event.key === 'Tab') {
      // Close but let Tab proceed naturally (don't preventDefault).
      closeMenu(false);
    }
    // ArrowDown/Up/Home/End are handled by useRovingTabindex via getItemProps.
  }

  // ── Item activation ───────────────────────────────────────────────────────
  function activateItem(item: MenuItem) {
    if (item.disabled) return;
    item.onSelect();
    closeMenu(true);
  }

  function handleItemKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    item: MenuItem,
    index: number,
  ) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateItem(item);
    }
    // Propagate so the menu's own onKeyDown also fires for Escape/Tab/arrows.
    // The rovingTabindex handler also fires via getItemProps.onKeyDown.
    // We need to call getItemProps().onKeyDown separately when we also want
    // our item handler, but getItemProps already sets onKeyDown on the element.
    // The above Enter/Space handling is merged below via spread order.
    void index; // used by caller
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapperRef} className={clsx('nui-menu', className)}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className="nui-button nui-menu-trigger inline-flex items-center justify-center font-medium rounded-md transition-colors bg-surface text-fg border border-[rgb(var(--color-border))] hover:bg-border/10 active:bg-border/20 h-10 px-4 text-base gap-2"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          if (open) {
            closeMenu();
          } else {
            openMenu(firstEnabledIndex());
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        {label}
        <span className="nui-menu-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {/* Menu list — rendered inline with absolute positioning */}
      {open && (
        <ul
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          className="nui-menu-list"
          onKeyDown={handleMenuKeyDown}
        >
          {items.map((item, index) => {
            const rovingProps = getItemProps(index);
            return (
              <li key={item.id} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="nui-menu-item"
                  aria-disabled={item.disabled ? 'true' : undefined}
                  tabIndex={rovingProps.tabIndex}
                  ref={rovingProps.ref}
                  onKeyDown={(e) => {
                    // Run our activation handler first, then the roving-tabindex handler.
                    handleItemKeyDown(e, item, index);
                    if (e.key !== 'Enter' && e.key !== ' ') {
                      // Let roving tabindex handle arrows / home / end.
                      rovingProps.onKeyDown(e);
                    }
                  }}
                  onClick={() => activateItem(item)}
                  onMouseEnter={() => {
                    if (!item.disabled) {
                      setActiveIndex(index);
                    }
                  }}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
