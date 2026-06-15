import React, { useState } from 'react';
import {
  Button,
  Input,
  FormField,
  Modal,
  Menu,
  type MenuItem,
} from '@a11y-portfolio/novaui';

export function Gallery() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const menuItems: MenuItem[] = [
    { id: 'edit', label: 'Edit', onSelect: () => setSelectedItem('Edit') },
    { id: 'duplicate', label: 'Duplicate', onSelect: () => setSelectedItem('Duplicate') },
    { id: 'archive', label: 'Archive (disabled)', onSelect: () => {}, disabled: true },
    { id: 'delete', label: 'Delete', onSelect: () => setSelectedItem('Delete') },
  ];

  return (
    <section
      id="novaui"
      aria-labelledby="novaui-heading"
      style={{
        paddingTop: '5rem',
        paddingBottom: '5rem',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <div
        style={{
          maxWidth: '72rem',
          margin: '0 auto',
          padding: '0 2rem',
        }}
      >
        {/* Section header */}
        <div style={{ marginBottom: '3rem' }}>
          <span className="section-number" style={{ display: 'block', marginBottom: '0.75rem' }}>
            02 / Component Gallery
          </span>
          <h2
            id="novaui-heading"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              color: 'var(--ink)',
              margin: '0 0 1rem 0',
            }}
          >
            NovaUI
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              fontWeight: 300,
              lineHeight: 1.65,
              color: 'var(--muted)',
              margin: 0,
              maxWidth: '42rem',
            }}
          >
            Live components imported directly from{' '}
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875em',
                color: 'rgb(var(--color-primary))',
                background: 'rgba(29,78,216,0.08)',
                padding: '0.1em 0.35em',
                borderRadius: '3px',
              }}
            >
              @a11y-portfolio/novaui
            </code>
            . Themed by the toggle above. Every component is keyboard-complete and ARIA-correct.
          </p>
        </div>

        {/* Grid of spec cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Button variants */}
          <article className="spec-card" aria-label="Button component spec">
            <div style={{ padding: '1.5rem' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  color: 'rgb(var(--color-primary))',
                  textTransform: 'uppercase',
                  margin: '0 0 1.25rem 0',
                }}
              >
                Button — all variants
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.625rem',
                  alignItems: 'center',
                }}
              >
                <Button variant="primary" size="md">Primary</Button>
                <Button variant="secondary" size="md">Secondary</Button>
                <Button variant="ghost" size="md">Ghost</Button>
                <Button variant="danger" size="md">Danger</Button>
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="lg">Large</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </div>
            <div className="spec-caption" style={{ padding: '0.875rem 1.5rem' }}>
              <p style={{ margin: '0 0 0.25rem 0' }}>
                <span style={{ color: 'rgb(var(--color-primary))' }}>role:</span> button (native){' '}
                <span style={{ color: 'rgb(var(--color-primary))', marginLeft: '0.75rem' }}>keys:</span> Enter · Space
              </p>
              <p style={{ margin: 0 }}>
                <span style={{ color: 'rgb(var(--color-primary))' }}>focus:</span> :focus-visible ring, non-removable via CSS selector lock
              </p>
            </div>
          </article>

          {/* Input + FormField with error */}
          <article className="spec-card" aria-label="Input and FormField component spec">
            <div style={{ padding: '1.5rem' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  color: 'rgb(var(--color-primary))',
                  textTransform: 'uppercase',
                  margin: '0 0 1.25rem 0',
                }}
              >
                Input + FormField — error state
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <FormField
                  label="Email address"
                  description="We will never share your email."
                  error="Please enter a valid email address."
                  required
                >
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    defaultValue="not-an-email"
                  />
                </FormField>
                <FormField label="Username">
                  <Input placeholder="anish_g" />
                </FormField>
              </div>
            </div>
            <div className="spec-caption" style={{ padding: '0.875rem 1.5rem' }}>
              <p style={{ margin: '0 0 0.25rem 0' }}>
                <span style={{ color: 'rgb(var(--color-primary))' }}>aria:</span> aria-invalid · aria-describedby (error+desc merged) · aria-required
              </p>
              <p style={{ margin: 0 }}>
                <span style={{ color: 'rgb(var(--color-primary))' }}>label:</span> htmlFor wired via context — no consumer plumbing needed
              </p>
            </div>
          </article>

          {/* Modal */}
          <article className="spec-card" aria-label="Modal component spec">
            <div style={{ padding: '1.5rem' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  color: 'rgb(var(--color-primary))',
                  textTransform: 'uppercase',
                  margin: '0 0 1.25rem 0',
                }}
              >
                Modal — focus trap + inert bg
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Button variant="secondary" onClick={() => setModalOpen(true)}>
                  Open modal dialog
                </Button>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    fontWeight: 300,
                    color: 'var(--muted)',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  Focus is trapped inside. Background becomes inert. Esc closes and restores focus to the trigger.
                </p>
              </div>

              <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Keyboard accessibility demo"
                description="Tab through the controls below — focus stays inside this dialog."
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
                  <FormField label="Component name">
                    <Input placeholder="e.g. NovaUI Button" />
                  </FormField>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={() => setModalOpen(false)}>Confirm</Button>
                  </div>
                </div>
              </Modal>
            </div>
            <div className="spec-caption" style={{ padding: '0.875rem 1.5rem' }}>
              <p style={{ margin: '0 0 0.25rem 0' }}>
                <span style={{ color: 'rgb(var(--color-primary))' }}>role:</span> dialog · aria-modal · aria-labelledby · aria-describedby
              </p>
              <p style={{ margin: 0 }}>
                <span style={{ color: 'rgb(var(--color-primary))' }}>keys:</span> Tab · Shift+Tab (trapped) · Escape (close)
              </p>
            </div>
          </article>

          {/* Menu */}
          <article className="spec-card" aria-label="Menu component spec">
            <div style={{ padding: '1.5rem' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  color: 'rgb(var(--color-primary))',
                  textTransform: 'uppercase',
                  margin: '0 0 1.25rem 0',
                }}
              >
                Menu — roving tabindex + disabled
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Menu label="Actions" items={menuItems} />
                {selectedItem && (
                  <p
                    role="status"
                    aria-live="polite"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: 'rgb(var(--color-primary))',
                      margin: 0,
                    }}
                  >
                    Selected: {selectedItem}
                  </p>
                )}
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    fontWeight: 300,
                    color: 'var(--muted)',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  Arrow keys navigate; disabled item is skipped. Outside click or Escape closes.
                </p>
              </div>
            </div>
            <div className="spec-caption" style={{ padding: '0.875rem 1.5rem' }}>
              <p style={{ margin: '0 0 0.25rem 0' }}>
                <span style={{ color: 'rgb(var(--color-primary))' }}>role:</span> menu · menuitem · aria-haspopup · aria-expanded · aria-disabled
              </p>
              <p style={{ margin: 0 }}>
                <span style={{ color: 'rgb(var(--color-primary))' }}>keys:</span> Enter/Space/↓ (open) · ↑↓ (navigate) · Home/End · Escape
              </p>
            </div>
          </article>
        </div>

        {/* Token footnote */}
        <div
          style={{
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--hairline)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--muted)',
            lineHeight: 1.6,
          }}
        >
          <span style={{ color: 'rgb(var(--color-primary))', marginRight: '0.5rem' }}>tokens.css</span>
          CSS custom property channels (not raw hex values) for opacity-modifier support ·
          Light <span style={{ color: 'rgb(var(--color-primary))' }}>#1D4ED8</span> / Dark{' '}
          <span style={{ color: 'rgb(var(--color-primary))' }}>#60A5FA</span> — both ≥4.5:1 on their backgrounds
        </div>
      </div>
    </section>
  );
}
