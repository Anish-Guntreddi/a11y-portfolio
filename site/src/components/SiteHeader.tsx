import React from 'react';
import { ThemeToggle } from './ThemeToggle';

export function SiteHeader() {
  return (
    <header
      aria-label="Site header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--canvas)',
        borderBottom: '1px solid var(--hairline)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transition: 'background var(--transition-slow), border-color var(--transition-slow)',
      }}
    >
      <div
        style={{
          maxWidth: '72rem',
          margin: '0 auto',
          padding: '0 2rem',
          height: '3.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Wordmark — skip-link target + focus-ring motif on hover */}
        <a
          href="#main-content"
          aria-label="A11y Portfolio — go to main content"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.125rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)';
          }}
        >
          {/* Focus-ring motif icon */}
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: '1rem',
              height: '1rem',
              border: '1.5px solid var(--accent)',
              outline: '1.5px solid var(--accent)',
              outlineOffset: '2px',
              borderRadius: '2px',
              flexShrink: 0,
            }}
          />
          <span>a11y portfolio</span>
        </a>

        {/* Nav + toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <nav aria-label="Section navigation">
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                gap: '1.25rem',
              }}
            >
              {[
                { label: 'NovaUI', href: '#novaui' },
                { label: 'AccessLens', href: '#accesslens' },
                { label: 'Process', href: '#architecture' },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6875rem',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                      textDecoration: 'none',
                      transition: 'color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)';
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
