import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FormField } from './FormField';
import { Input } from '../Input/Input';

describe('FormField + Input integration', () => {
  it('associates label with input via htmlFor/id so getByLabelText resolves to input', () => {
    render(
      <FormField label="Email address">
        <Input type="email" />
      </FormField>,
    );
    const input = screen.getByLabelText('Email address');
    expect(input.tagName).toBe('INPUT');
  });

  it('clicking the label moves focus to the input', async () => {
    const user = userEvent.setup();
    render(
      <FormField label="Username">
        <Input />
      </FormField>,
    );
    const label = screen.getByText('Username');
    const input = screen.getByLabelText('Username');
    await user.click(label);
    expect(input).toHaveFocus();
  });

  it('sets aria-invalid="true" and aria-describedby pointing to error when error is provided', () => {
    render(
      <FormField label="Password" error="Password is required">
        <Input type="password" />
      </FormField>,
    );
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const errorEl = screen.getByRole('alert');
    expect(errorEl).toHaveTextContent('Password is required');

    const errorId = errorEl.id;
    expect(input).toHaveAttribute('aria-describedby', expect.stringContaining(errorId));
  });

  it('error element has role="alert"', () => {
    render(
      <FormField label="Name" error="Name is too short">
        <Input />
      </FormField>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Name is too short');
  });

  it('sets aria-describedby to description id when description provided', () => {
    render(
      <FormField label="Bio" description="A short bio about yourself">
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText('Bio');
    const desc = screen.getByText('A short bio about yourself');
    expect(input).toHaveAttribute('aria-describedby', expect.stringContaining(desc.id));
  });

  it('aria-describedby includes both description id and error id in that order', () => {
    render(
      <FormField label="Field" description="Helpful hint" error="Something went wrong">
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText('Field');
    const desc = screen.getByText('Helpful hint');
    const err = screen.getByRole('alert');

    const describedBy = input.getAttribute('aria-describedby') ?? '';
    const descPos = describedBy.indexOf(desc.id);
    const errPos = describedBy.indexOf(err.id);

    // Both ids present
    expect(descPos).toBeGreaterThanOrEqual(0);
    expect(errPos).toBeGreaterThanOrEqual(0);
    // Description id comes before error id
    expect(descPos).toBeLessThan(errPos);
  });

  it('sets aria-required="true" when required is true', () => {
    render(
      <FormField label="Phone" required>
        <Input type="tel" />
      </FormField>,
    );
    // The accessible name must be exactly "Phone" — the aria-hidden required
    // indicator (" *") must not leak into the computed name.
    const input = screen.getByRole('textbox', { name: 'Phone' });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('required indicator is aria-hidden so it does not affect accessible label', () => {
    render(
      <FormField label="Phone" required>
        <Input />
      </FormField>,
    );
    // The accessible name should be "Phone" (aria-hidden span excluded from acc. name)
    const input = screen.getByRole('textbox');
    const labelEl = document.querySelector('label');
    // The label's htmlFor must point to the input
    expect(labelEl?.getAttribute('for')).toBe(input.getAttribute('id'));
    // The visible required indicator must be aria-hidden
    const indicator = document.querySelector('[aria-hidden="true"]');
    expect(indicator).toBeInTheDocument();
    expect(indicator?.textContent).toContain('*');
  });

  it('does not set aria-invalid when no error', () => {
    render(
      <FormField label="Search">
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText('Search');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('does not set aria-describedby when neither description nor error are provided', () => {
    render(
      <FormField label="Simple">
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText('Simple');
    expect(input).not.toHaveAttribute('aria-describedby');
  });
});

describe('Standalone Input (no FormField)', () => {
  it('renders without crashing', () => {
    render(<Input placeholder="standalone" />);
    const input = screen.getByPlaceholderText('standalone');
    expect(input).toBeInTheDocument();
  });

  it('accepts id, aria-describedby, and aria-invalid props directly', () => {
    render(
      <Input
        id="my-input"
        aria-describedby="my-hint"
        aria-invalid={true}
        placeholder="test"
      />,
    );
    const input = screen.getByPlaceholderText('test');
    expect(input).toHaveAttribute('id', 'my-input');
    expect(input).toHaveAttribute('aria-describedby', 'my-hint');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards ref to the underlying input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="ref-test" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('typing updates value via user-event', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input placeholder="type here" onChange={onChange} />);
    const input = screen.getByPlaceholderText('type here');
    await user.type(input, 'hello');
    expect(onChange).toHaveBeenCalled();
    expect((input as HTMLInputElement).value).toBe('hello');
  });
});
