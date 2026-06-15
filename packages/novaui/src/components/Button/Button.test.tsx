import React, { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('defaults type to "button"', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('renders with default variant class (primary)', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/bg-primary/);
  });

  // ── Variants & sizes ───────────────────────────────────────────────────────

  it.each([
    ['primary', 'bg-primary'],
    ['secondary', 'bg-surface'],
    ['ghost', 'bg-transparent'],
    ['danger', 'bg-danger'],
  ] as const)('variant "%s" applies correct class', (variant, expectedClass) => {
    render(<Button variant={variant}>Btn</Button>);
    expect(screen.getByRole('button').className).toContain(expectedClass);
  });

  it.each([
    ['sm', 'h-8'],
    ['md', 'h-10'],
    ['lg', 'h-12'],
  ] as const)('size "%s" applies correct height class', (size, expectedClass) => {
    render(<Button size={size}>Btn</Button>);
    expect(screen.getByRole('button').className).toContain(expectedClass);
  });

  // ── Disabled state ─────────────────────────────────────────────────────────

  it('disabled prevents onClick from firing', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  // ── Ref forwarding ─────────────────────────────────────────────────────────

  it('forwards ref to the underlying button element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toBe(screen.getByRole('button'));
  });

  // ── Keyboard activation ────────────────────────────────────────────────────

  it('Enter fires onClick', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Enter</Button>);
    screen.getByRole('button').focus();
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('Space fires onClick', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Space</Button>);
    screen.getByRole('button').focus();
    await user.keyboard('{ }');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // ── Extra props passthrough ────────────────────────────────────────────────

  it('passes through aria-label', () => {
    render(<Button aria-label="Close dialog">×</Button>);
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });

  it('merges custom className', () => {
    render(<Button className="my-custom">Btn</Button>);
    expect(screen.getByRole('button').className).toMatch(/my-custom/);
  });
});
