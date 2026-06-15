import React, { useId, useEffect, useRef, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './Modal.css';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ModalProps {
  /** Controls visibility. When false the portal is not rendered at all. */
  open: boolean;
  /** Called when the user requests close (Esc, close button, or backdrop click). */
  onClose: () => void;
  /** Required — used as the dialog's accessible name via aria-labelledby. */
  title: string;
  /** Optional description text, wired to aria-describedby. */
  description?: string;
  /** Content rendered inside the dialog body. */
  children?: React.ReactNode;
  /**
   * Whether clicking the backdrop triggers onClose.
   * @default true
   */
  closeOnBackdropClick?: boolean;
  /** Ref to the element that should receive focus when the dialog opens. */
  initialFocus?: RefObject<HTMLElement | null>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Accessible modal dialog.
 *
 * - Renders via `createPortal` to `document.body` only when `open` is true.
 * - `role="dialog"`, `aria-modal="true"`, labelled by the rendered title.
 * - Uses `useFocusTrap` to trap and restore focus.
 * - Esc closes; backdrop click closes (configurable); clicks inside do NOT close.
 * - Locks body scroll while open; restores on close.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  closeOnBackdropClick = true,
  initialFocus,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  // Attach the focus trap to the dialog element.
  const dialogRef = useFocusTrap(open, { initialFocus });

  // ── Body scroll lock ─────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // ── Esc key handler ──────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  // ── Backdrop click handler ────────────────────────────────────────────────
  const backdropRef = useRef<HTMLDivElement | null>(null);

  function handleBackdropPointerDown(event: React.MouseEvent<HTMLDivElement>) {
    // Only close when the click target is the backdrop itself, not children.
    if (closeOnBackdropClick && event.target === backdropRef.current) {
      onClose();
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={backdropRef}
      className="nui-modal-backdrop"
      onMouseDown={handleBackdropPointerDown}
      // Prevent the backdrop click handler from triggering via bubbled events
      // when the user clicks inside the dialog.
      aria-hidden={undefined}
    >
      {/* The dialog element — ref wired to useFocusTrap */}
      <div
        ref={dialogRef as React.RefObject<HTMLDivElement>}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="nui-modal-dialog"
        // Stop mouse-down propagation so backdrop handler never fires for
        // clicks that originate inside the dialog.
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="nui-modal-header">
          <h2 id={titleId} className="nui-modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="nui-modal-close"
            aria-label="Close"
            onClick={onClose}
          >
            {/* Simple × icon — plain text, no SVG required */}
            <span aria-hidden="true" style={{ fontSize: '1.25rem', lineHeight: 1 }}>
              ×
            </span>
          </button>
        </div>

        {/* Optional description */}
        {description && (
          <p id={descriptionId} className="nui-modal-description">
            {description}
          </p>
        )}

        {/* Body content */}
        <div className="nui-modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
