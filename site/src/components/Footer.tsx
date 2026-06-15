import React from 'react';

export function Footer() {
  return (
    <footer
      aria-label="Site footer"
      style={{
        paddingTop: '3rem',
        paddingBottom: '3rem',
        borderTop: '1px solid var(--hairline)',
      }}
    >
      <div
        style={{
          maxWidth: '72rem',
          margin: '0 auto',
          padding: '0 2rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2rem',
            alignItems: 'start',
          }}
        >
          {/* Wordmark + stack */}
          <div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--ink)',
                margin: '0 0 0.5rem 0',
              }}
            >
              Anish Guntreddi
            </p>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                lineHeight: 1.7,
                color: 'var(--muted)',
                margin: 0,
              }}
            >
              Built with TypeScript · React · Vite
              <br />
              Playwright · axe-core
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Footer links">
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              {[
                {
                  label: 'GitHub — a11y-portfolio',
                  href: 'https://github.com/Anish-Guntreddi/a11y-portfolio',
                  external: true,
                },
                {
                  label: 'Storybook',
                  href: './storybook/',
                  external: false,
                },
                {
                  label: 'anishguntreddi@gmail.com',
                  href: 'mailto:anishguntreddi@gmail.com',
                  external: false,
                },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    {...(link.external
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.9375rem',
                      fontWeight: 400,
                      color: 'var(--ink)',
                      textDecoration: 'none',
                      borderBottom: '1px solid var(--hairline)',
                      paddingBottom: '1px',
                      transition: 'border-color 150ms ease, color 150ms ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      el.style.color = 'var(--accent)';
                      el.style.borderBottomColor = 'var(--accent)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      el.style.color = 'var(--ink)';
                      el.style.borderBottomColor = 'var(--hairline)';
                    }}
                  >
                    {link.label}
                    {link.external && (
                      <ExternalLinkIcon />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Motif reminder */}
          <div>
            <div
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.625rem',
                marginBottom: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  border: '2px solid var(--accent)',
                  outline: '2px solid var(--accent)',
                  outlineOffset: '3px',
                  borderRadius: '2px',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6875rem',
                  color: 'rgb(var(--color-primary))',
                  letterSpacing: '0.08em',
                }}
              >
                :focus-visible
              </span>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                lineHeight: 1.65,
                color: 'var(--muted)',
                margin: 0,
              }}
            >
              Accessibility is not an afterthought.
              <br />
              It is a correctness requirement.
            </p>
          </div>
        </div>

        {/* Bottom rule */}
        <div
          style={{
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--hairline)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              color: 'var(--muted)',
              margin: 0,
            }}
          >
            &copy; {new Date().getFullYear()} Anish Guntreddi
          </p>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              color: 'var(--muted)',
              margin: 0,
            }}
          >
            WCAG 2.2 AA compliant · axe-core verified
          </p>
        </div>
      </div>
    </footer>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7" />
      <path d="M8 1h3v3" />
      <line x1="11" y1="1" x2="5" y2="7" />
    </svg>
  );
}
