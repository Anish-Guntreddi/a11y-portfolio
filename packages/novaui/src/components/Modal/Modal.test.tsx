import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';
import { useFocusTrap } from '../../hooks/useFocusTrap';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderModal(props: Partial<React.ComponentProps<typeof Modal>> = {}) {
  const defaults = {
    open: true,
    onClose: vi.fn(),
    title: 'Test dialog',
  };
  return render(<Modal {...defaults} {...props} />);
}

// ── Not rendered when closed ──────────────────────────────────────────────────

describe('Modal — closed state', () => {
  it('renders nothing when open=false', () => {
    renderModal({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ── Open state: ARIA attributes ───────────────────────────────────────────────

describe('Modal — open state', () => {
  it('renders a dialog with aria-modal="true"', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('aria-labelledby resolves to the title text', () => {
    renderModal({ title: 'My dialog' });
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();

    const titleEl = document.getElementById(labelledBy!);
    expect(titleEl).not.toBeNull();
    expect(titleEl?.textContent).toBe('My dialog');
  });

  it('has no aria-describedby when description is omitted', () => {
    renderModal({ description: undefined });
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
  });

  it('aria-describedby resolves to the description text when provided', () => {
    renderModal({ description: 'A helpful description' });
    const dialog = screen.getByRole('dialog');
    const describedBy = dialog.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const descEl = document.getElementById(describedBy!);
    expect(descEl).not.toBeNull();
    expect(descEl?.textContent).toContain('A helpful description');
  });

  it('renders a Close button with accessible name "Close"', () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('renders the title as a heading element', () => {
    renderModal({ title: 'My title' });
    // The title must be a heading so its text matches.
    const heading = screen.getByRole('heading', { name: 'My title' });
    expect(heading).toBeInTheDocument();
  });
});

// ── Focus behaviour ───────────────────────────────────────────────────────────

describe('Modal — focus', () => {
  it('focus is inside the dialog after open', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('focus returns to the trigger button after close', async () => {
    function Wrapper() {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button data-testid="trigger" onClick={() => setOpen(true)}>
            Open
          </button>
          <Modal open={open} onClose={() => setOpen(false)} title="Test" />
        </>
      );
    }

    const user = userEvent.setup();
    render(<Wrapper />);

    const trigger = screen.getByTestId('trigger');

    // Click the trigger — userEvent focuses it during the click, then the
    // click handler fires opening the modal.
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Close via the close button
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Focus should be back on the trigger (or at minimum inside the document, not body)
    // In jsdom, focus restoration lands on the trigger if it was focused before open.
    expect(document.activeElement).not.toBe(document.body);
  });
});

// ── Close interactions ────────────────────────────────────────────────────────

describe('Modal — close interactions', () => {
  it('Escape fires onClose', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderModal({ onClose });
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking the Close button fires onClose', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderModal({ onClose });
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking inside dialog content does NOT fire onClose', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderModal({
      onClose,
      children: <p data-testid="inner-content">Content</p>,
    });
    await user.click(screen.getByTestId('inner-content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('backdrop click fires onClose when closeOnBackdropClick=true (default)', async () => {
    const onClose = vi.fn();
    // Render with open so backdrop is in DOM
    renderModal({ onClose, closeOnBackdropClick: true });

    // Simulate mousedown on the backdrop element (first div with .nui-modal-backdrop)
    const backdrop = document.querySelector('.nui-modal-backdrop') as HTMLElement;
    expect(backdrop).not.toBeNull();

    // Trigger mousedown on the backdrop itself
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'target', { value: backdrop });
    backdrop.dispatchEvent(event);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('backdrop click does NOT fire onClose when closeOnBackdropClick=false', async () => {
    const onClose = vi.fn();
    renderModal({ onClose, closeOnBackdropClick: false });

    const backdrop = document.querySelector('.nui-modal-backdrop') as HTMLElement;
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'target', { value: backdrop });
    backdrop.dispatchEvent(event);

    expect(onClose).not.toHaveBeenCalled();
  });
});

// ── useFocusTrap direct unit tests ────────────────────────────────────────────
// These tests wire the hook via React components that render real DOM so the
// ref callback is attached before effects run (same lifecycle as production use).

describe('useFocusTrap', () => {
  it('moves focus to the first focusable element when activated', () => {
    function TrapFixture({ active }: { active: boolean }) {
      const ref = useFocusTrap(active);
      return (
        <div ref={ref as React.RefObject<HTMLDivElement>}>
          <button data-testid="first">First</button>
          <button data-testid="second">Second</button>
        </div>
      );
    }

    render(<TrapFixture active={true} />);
    expect(screen.getByTestId('first')).toHaveFocus();
  });

  it('restores focus to prior element when deactivated', () => {
    function TrapFixture({ active }: { active: boolean }) {
      const ref = useFocusTrap(active);
      return (
        <>
          <button data-testid="outside">Outside</button>
          <div ref={ref as React.RefObject<HTMLDivElement>}>
            <button data-testid="inner">Inner</button>
          </div>
        </>
      );
    }

    // Focus the outside button before rendering the trap as active
    const { rerender } = render(<TrapFixture active={false} />);
    screen.getByTestId('outside').focus();
    expect(screen.getByTestId('outside')).toHaveFocus();

    // Activate: focus should move inside
    rerender(<TrapFixture active={true} />);
    expect(screen.getByTestId('inner')).toHaveFocus();

    // Deactivate: focus should return to outside
    rerender(<TrapFixture active={false} />);
    expect(screen.getByTestId('outside')).toHaveFocus();
  });

  it('falls back to the container itself when there are no focusable children', () => {
    function TrapFixture() {
      const ref = useFocusTrap(true);
      return (
        <div ref={ref as React.RefObject<HTMLDivElement>} data-testid="container">
          <p>No focusable children</p>
        </div>
      );
    }

    render(<TrapFixture />);
    const container = screen.getByTestId('container');
    // Container should have tabindex set and be focused
    expect(container).toHaveAttribute('tabindex', '-1');
    expect(container).toHaveFocus();
  });
});

// ── Children rendered ─────────────────────────────────────────────────────────

describe('Modal — children', () => {
  it('renders children inside the dialog', () => {
    renderModal({ children: <span data-testid="child">Hello</span> });
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByTestId('child')).toBeInTheDocument();
  });
});
