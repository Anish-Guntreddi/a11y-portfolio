import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Menu } from './Menu';
import { useRovingTabindex } from '../../hooks/useRovingTabindex';
import { renderHook, act } from '@testing-library/react';

// ── Test data ─────────────────────────────────────────────────────────────────

function makeItems(overrides?: Partial<{ disabledIndex: number }>) {
  const disabledIndex = overrides?.disabledIndex ?? 2;
  return [
    { id: 'item-a', label: 'Alpha', onSelect: vi.fn() },
    { id: 'item-b', label: 'Beta', onSelect: vi.fn() },
    { id: 'item-c', label: 'Gamma', onSelect: vi.fn(), disabled: disabledIndex === 2 },
    { id: 'item-d', label: 'Delta', onSelect: vi.fn() },
  ];
}

// ── ARIA attributes ───────────────────────────────────────────────────────────

describe('Menu — trigger ARIA attributes', () => {
  it('has aria-haspopup="menu" on the trigger', () => {
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    const trigger = screen.getByRole('button', { name: /options/i });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('aria-expanded is false when closed', () => {
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    const trigger = screen.getByRole('button', { name: /options/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('aria-expanded is true when open', async () => {
    const user = userEvent.setup();
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    const trigger = screen.getByRole('button', { name: /options/i });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('aria-expanded toggles closed after second click', async () => {
    const user = userEvent.setup();
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    const trigger = screen.getByRole('button', { name: /options/i });
    await user.click(trigger);
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

// ── Menu open renders correct ARIA roles ──────────────────────────────────────

describe('Menu — open renders role="menu" and role="menuitem"', () => {
  it('renders role="menu" when open', async () => {
    const user = userEvent.setup();
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    await user.click(screen.getByRole('button', { name: /options/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('renders one role="menuitem" per item', async () => {
    const user = userEvent.setup();
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    await user.click(screen.getByRole('button', { name: /options/i }));
    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems).toHaveLength(items.length);
  });

  it('does not render role="menu" when closed', () => {
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

// ── Roving tabindex ───────────────────────────────────────────────────────────

describe('Menu — roving tabindex: exactly one item has tabindex=0', () => {
  it('exactly one menuitem has tabIndex=0 when open', async () => {
    const user = userEvent.setup();
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    await user.click(screen.getByRole('button', { name: /options/i }));

    const menuItems = screen.getAllByRole('menuitem');
    const tabbable = menuItems.filter((el) => el.getAttribute('tabindex') === '0');
    expect(tabbable).toHaveLength(1);

    const minusOne = menuItems.filter((el) => el.getAttribute('tabindex') === '-1');
    expect(minusOne).toHaveLength(items.length - 1);
  });

  it('first enabled item gets tabindex=0 on ArrowDown open', async () => {
    const user = userEvent.setup();
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    const trigger = screen.getByRole('button', { name: /options/i });
    trigger.focus();
    await user.keyboard('{ArrowDown}');

    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems[0]).toHaveAttribute('tabindex', '0');
  });

  it('last enabled item gets tabindex=0 on ArrowUp open', async () => {
    const user = userEvent.setup();
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    const trigger = screen.getByRole('button', { name: /options/i });
    trigger.focus();
    await user.keyboard('{ArrowUp}');

    // Last enabled item is index 3 (Delta), since index 2 is disabled.
    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems[3]).toHaveAttribute('tabindex', '0');
  });
});

// ── Keyboard navigation ───────────────────────────────────────────────────────

describe('Menu — keyboard navigation', () => {
  async function openWithArrowDown() {
    const user = userEvent.setup();
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    const trigger = screen.getByRole('button', { name: /options/i });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    return { user, items };
  }

  it('ArrowDown moves focus to next item', async () => {
    const { user } = await openWithArrowDown();
    await user.keyboard('{ArrowDown}');
    const menuItems = screen.getAllByRole('menuitem');
    expect(document.activeElement).toBe(menuItems[1]);
  });

  it('ArrowDown skips disabled items', async () => {
    const { user } = await openWithArrowDown();
    // Start at index 0, go down twice: should skip index 2 (disabled) and land on index 3.
    await user.keyboard('{ArrowDown}'); // → 1
    await user.keyboard('{ArrowDown}'); // → skip 2 (disabled) → 3
    const menuItems = screen.getAllByRole('menuitem');
    expect(document.activeElement).toBe(menuItems[3]);
  });

  it('ArrowUp wraps from first to last enabled item', async () => {
    const { user } = await openWithArrowDown();
    // Focus is on index 0; ArrowUp should wrap to last enabled = index 3.
    await user.keyboard('{ArrowUp}');
    const menuItems = screen.getAllByRole('menuitem');
    expect(document.activeElement).toBe(menuItems[3]);
  });

  it('ArrowDown wraps from last to first item', async () => {
    const user = userEvent.setup();
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    const trigger = screen.getByRole('button', { name: /options/i });
    trigger.focus();
    // Open on last item.
    await user.keyboard('{ArrowUp}');
    // Wrap down.
    await user.keyboard('{ArrowDown}');
    const menuItems = screen.getAllByRole('menuitem');
    expect(document.activeElement).toBe(menuItems[0]);
  });

  it('Home jumps to first enabled item', async () => {
    const { user } = await openWithArrowDown();
    await user.keyboard('{ArrowDown}'); // move away from 0
    await user.keyboard('{Home}');
    const menuItems = screen.getAllByRole('menuitem');
    expect(document.activeElement).toBe(menuItems[0]);
  });

  it('End jumps to last enabled item', async () => {
    const { user } = await openWithArrowDown();
    await user.keyboard('{End}');
    const menuItems = screen.getAllByRole('menuitem');
    expect(document.activeElement).toBe(menuItems[3]);
  });
});

// ── Enter / Space activation ──────────────────────────────────────────────────

describe('Menu — Enter/Space activates item and closes', () => {
  it('Enter fires onSelect and closes the menu', async () => {
    const user = userEvent.setup();
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    const trigger = screen.getByRole('button', { name: /options/i });
    trigger.focus();
    await user.keyboard('{ArrowDown}'); // open, focus first
    await user.keyboard('{Enter}');

    expect(items[0].onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('Space fires onSelect and closes the menu', async () => {
    const user = userEvent.setup();
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    const trigger = screen.getByRole('button', { name: /options/i });
    trigger.focus();
    await user.keyboard('{ArrowDown}'); // open, focus first
    await user.keyboard(' ');

    expect(items[0].onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('clicking an item fires onSelect and closes the menu', async () => {
    const user = userEvent.setup();
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    await user.click(screen.getByRole('button', { name: /options/i }));
    const menuItems = screen.getAllByRole('menuitem');
    await user.click(menuItems[1]);

    expect(items[1].onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

// ── Disabled items ────────────────────────────────────────────────────────────

describe('Menu — disabled items are not activatable', () => {
  it('disabled item does not fire onSelect on Enter', async () => {
    const user = userEvent.setup();
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    const trigger = screen.getByRole('button', { name: /options/i });
    trigger.focus();
    await user.keyboard('{ArrowDown}'); // open at index 0
    await user.keyboard('{ArrowDown}'); // → 1
    // index 2 is disabled; arrow navigation skips it so we should not be able to
    // manually navigate to it without forcing focus.
    // Force focus on the disabled item and press Enter.
    const menuItems = screen.getAllByRole('menuitem');
    menuItems[2].focus();
    await user.keyboard('{Enter}');

    expect(items[2].onSelect).not.toHaveBeenCalled();
    // Menu should NOT close because the item was disabled.
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('clicking a disabled item does not fire onSelect', async () => {
    const user = userEvent.setup();
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    await user.click(screen.getByRole('button', { name: /options/i }));
    const menuItems = screen.getAllByRole('menuitem');
    await user.click(menuItems[2]);

    expect(items[2].onSelect).not.toHaveBeenCalled();
  });
});

// ── Escape closes and returns focus ──────────────────────────────────────────

describe('Menu — Escape closes and returns focus to trigger', () => {
  it('Escape closes the menu', async () => {
    const user = userEvent.setup();
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    const trigger = screen.getByRole('button', { name: /options/i });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('Escape returns focus to the trigger button', async () => {
    const user = userEvent.setup();
    const items = makeItems();
    render(<Menu label="Options" items={items} />);
    const trigger = screen.getByRole('button', { name: /options/i });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Escape}');

    // After escape, focus should return to the trigger.
    // requestAnimationFrame is not available in jsdom; we call focus synchronously.
    // The closeMenu function uses requestAnimationFrame, so we flush it:
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });
});

// ── useRovingTabindex direct unit tests ───────────────────────────────────────

describe('useRovingTabindex', () => {
  it('starts with initialIndex as active', () => {
    const { result } = renderHook(() =>
      useRovingTabindex({ count: 4, initialIndex: 0 }),
    );
    expect(result.current.activeIndex).toBe(0);
  });

  it('getItemProps returns tabIndex=0 for active item, -1 for others', () => {
    const { result } = renderHook(() =>
      useRovingTabindex({ count: 3, initialIndex: 1 }),
    );
    expect(result.current.getItemProps(0).tabIndex).toBe(-1);
    expect(result.current.getItemProps(1).tabIndex).toBe(0);
    expect(result.current.getItemProps(2).tabIndex).toBe(-1);
  });

  it('setActiveIndex updates activeIndex', () => {
    const { result } = renderHook(() =>
      useRovingTabindex({ count: 4, initialIndex: 0 }),
    );
    act(() => {
      result.current.setActiveIndex(2);
    });
    expect(result.current.activeIndex).toBe(2);
  });

  it('ArrowDown moves to next index', () => {
    const { result } = renderHook(() =>
      useRovingTabindex({ count: 4, initialIndex: 0 }),
    );
    const mockEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.getItemProps(0).onKeyDown(mockEvent);
    });
    expect(result.current.activeIndex).toBe(1);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('ArrowUp moves to previous index', () => {
    const { result } = renderHook(() =>
      useRovingTabindex({ count: 4, initialIndex: 2 }),
    );
    const mockEvent = {
      key: 'ArrowUp',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.getItemProps(2).onKeyDown(mockEvent);
    });
    expect(result.current.activeIndex).toBe(1);
  });

  it('ArrowDown wraps from last to first', () => {
    const { result } = renderHook(() =>
      useRovingTabindex({ count: 3, initialIndex: 2 }),
    );
    const mockEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.getItemProps(2).onKeyDown(mockEvent);
    });
    expect(result.current.activeIndex).toBe(0);
  });

  it('ArrowUp wraps from first to last', () => {
    const { result } = renderHook(() =>
      useRovingTabindex({ count: 3, initialIndex: 0 }),
    );
    const mockEvent = {
      key: 'ArrowUp',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.getItemProps(0).onKeyDown(mockEvent);
    });
    expect(result.current.activeIndex).toBe(2);
  });

  it('Home jumps to first index', () => {
    const { result } = renderHook(() =>
      useRovingTabindex({ count: 4, initialIndex: 3 }),
    );
    const mockEvent = {
      key: 'Home',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.getItemProps(3).onKeyDown(mockEvent);
    });
    expect(result.current.activeIndex).toBe(0);
  });

  it('End jumps to last index', () => {
    const { result } = renderHook(() =>
      useRovingTabindex({ count: 4, initialIndex: 0 }),
    );
    const mockEvent = {
      key: 'End',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.getItemProps(0).onKeyDown(mockEvent);
    });
    expect(result.current.activeIndex).toBe(3);
  });

  it('skips disabled indices on ArrowDown', () => {
    const { result } = renderHook(() =>
      useRovingTabindex({ count: 4, initialIndex: 0, disabledIndices: [1] }),
    );
    const mockEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.getItemProps(0).onKeyDown(mockEvent);
    });
    // index 1 is disabled so it jumps to 2
    expect(result.current.activeIndex).toBe(2);
  });

  it('skips disabled indices on ArrowUp', () => {
    const { result } = renderHook(() =>
      useRovingTabindex({ count: 4, initialIndex: 3, disabledIndices: [2] }),
    );
    const mockEvent = {
      key: 'ArrowUp',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.getItemProps(3).onKeyDown(mockEvent);
    });
    // index 2 is disabled so it jumps to 1
    expect(result.current.activeIndex).toBe(1);
  });
});
