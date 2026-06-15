import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import './Button.css';

// ── Tiny cn() helper ──────────────────────────────────────────────────────────
/** Merge class names, filtering out falsy values. */
function cn(...classes: Parameters<typeof clsx>): string {
  return clsx(...classes);
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

// ── Styles ────────────────────────────────────────────────────────────────────

/**
 * `nui-button` is always the FIRST class applied — the matching CSS rule in
 * Button.css provides a :focus-visible outline that consumer className cannot
 * remove (it's a dedicated selector, not a Tailwind utility).
 */
const BASE =
  'nui-button ' +
  'inline-flex items-center justify-center font-medium rounded-md transition-colors ' +
  'disabled:pointer-events-none disabled:opacity-50';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-[rgb(var(--color-primary-fg))] hover:bg-primary/90 active:bg-primary/80',
  secondary:
    'bg-surface text-fg border border-[rgb(var(--color-border))] hover:bg-border/10 active:bg-border/20',
  ghost:
    'bg-transparent text-fg hover:bg-muted-fg/10 active:bg-muted-fg/20',
  danger:
    'bg-danger text-[rgb(var(--color-danger-fg))] hover:bg-danger/90 active:bg-danger/80',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-base gap-2',
  lg: 'h-12 px-6 text-lg gap-2.5',
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Accessible button component.
 *
 * - Renders a native `<button>` (never a `<div>` or `<a>`).
 * - Defaults `type` to `"button"` to avoid accidental form submission.
 * - Visible focus ring via `:focus-visible` in Button.css — NOT removable by
 *   consumer `className` because it is a dedicated CSS selector.
 * - Forwards refs so consumers can imperatively focus the element.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    type = 'button',
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(BASE, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)}
      {...props}
    >
      {children}
    </button>
  );
});
