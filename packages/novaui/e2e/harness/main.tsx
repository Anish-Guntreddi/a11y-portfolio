import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, FormField, Input, Modal, ThemeProvider } from '../../src/index';
import type { ButtonVariant, ButtonSize } from '../../src/index';

/** Read `?theme=dark` from the URL for automated dark-theme e2e. */
function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const param = new URLSearchParams(window.location.search).get('theme');
  return param === 'dark' ? 'dark' : 'light';
}

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];

function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <section aria-labelledby="modal-demo-heading" data-testid="modal-section">
      <h2 id="modal-demo-heading">Modal / Dialog</h2>
      <Button
        data-testid="open-dialog-btn"
        onClick={() => setOpen(true)}
      >
        Open dialog
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Example dialog"
        description="Fill in the fields below and confirm."
      >
        <FormField label="Your name">
          <Input data-testid="modal-input" placeholder="Jane Doe" />
        </FormField>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>
            Confirm
          </Button>
        </div>
      </Modal>
    </section>
  );
}

function App() {
  const [count, setCount] = useState(0);

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        color: 'var(--color-fg)',
        minHeight: '100vh',
        padding: '2rem',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <main>
        <h1>NovaUI Component Harness</h1>

        {/* Modal demo section */}
        <ModalDemo />

        {/* Counter section — used by activation e2e tests */}
        <section aria-labelledby="counter-heading">
          <h2 id="counter-heading">Activation test</h2>
          <p>clicks: {count}</p>
          <Button
            aria-label="Increment counter"
            onClick={() => setCount((n) => n + 1)}
          >
            Increment
          </Button>
        </section>

        {/* All variants */}
        <section aria-labelledby="variants-heading">
          <h2 id="variants-heading">Variants</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {VARIANTS.map((variant) => (
              <Button key={variant} variant={variant} aria-label={`${variant} button`}>
                {variant.charAt(0).toUpperCase() + variant.slice(1)}
              </Button>
            ))}
          </div>
        </section>

        {/* All sizes */}
        <section aria-labelledby="sizes-heading">
          <h2 id="sizes-heading">Sizes</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {SIZES.map((size) => (
              <Button key={size} size={size} aria-label={`${size} size button`}>
                Size {size.toUpperCase()}
              </Button>
            ))}
          </div>
        </section>

        {/* Disabled state */}
        <section aria-labelledby="disabled-heading">
          <h2 id="disabled-heading">Disabled</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {VARIANTS.map((variant) => (
              <Button
                key={variant}
                variant={variant}
                disabled
                aria-label={`disabled ${variant} button`}
              >
                {variant.charAt(0).toUpperCase() + variant.slice(1)} (disabled)
              </Button>
            ))}
          </div>
        </section>

        {/* Hostile-className button — tests that focus ring cannot be overridden */}
        <section aria-labelledby="hostile-heading">
          <h2 id="hostile-heading">Focus ring resilience</h2>
          <Button
            data-testid="hostile-focus-btn"
            aria-label="hostile focus button"
            className="outline-none focus-visible:outline-none"
          >
            Hostile className
          </Button>
        </section>

        {/* Input / FormField section */}
        <section aria-labelledby="inputs-heading" data-testid="inputs-section">
          <h2 id="inputs-heading">Input &amp; FormField</h2>

          {/* Normal field with label + description */}
          <FormField label="Full name" description="Enter your first and last name">
            <Input placeholder="Jane Doe" data-testid="normal-input" />
          </FormField>

          {/* Error field */}
          <FormField label="Email address" error="Please enter a valid email">
            <Input
              type="email"
              placeholder="you@example.com"
              data-testid="error-input"
            />
          </FormField>

          {/* Required field */}
          <FormField label="Username" required>
            <Input placeholder="your_handle" data-testid="required-input" />
          </FormField>

          {/* Hostile-className input — focus outline must still appear */}
          <FormField label="Hostile input">
            <Input
              data-testid="hostile-focus-input"
              className="outline-none focus-visible:outline-none"
              placeholder="hostile"
            />
          </FormField>
        </section>
      </main>
    </div>
  );
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root element');

createRoot(rootEl).render(
  <React.StrictMode>
    <ThemeProvider initialTheme={getInitialTheme()}>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
