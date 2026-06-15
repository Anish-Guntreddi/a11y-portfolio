import React from 'react';

export function AuditDemo() {
  return (
    <section
      id="accesslens"
      aria-labelledby="accesslens-heading"
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
            03 / Audit Demo
          </span>
          <h2
            id="accesslens-heading"
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
            AccessLens
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
            A CLI auditor that runs axe-core over a DOM snapshot and generates actionable HTML reports.
            Before / after comparison below uses real generated output.
          </p>
        </div>

        {/* CLI terminal block */}
        <div style={{ marginBottom: '3rem' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              letterSpacing: '0.1em',
              color: 'var(--muted)',
              textTransform: 'uppercase',
              margin: '0 0 0.625rem 0',
            }}
          >
            CLI invocation
          </p>
          <div className="terminal" role="region" aria-label="Terminal: AccessLens CLI example">
            <div>
              <span className="prompt">$ </span>
              <span className="cmd">accesslens audit --url http://localhost:3000/bad.html --output report.html</span>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <span className="comment"># Checking: contrast · alt text · headings · landmarks · ARIA · keyboard</span>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <span className="output-error">✖ 5 violations found</span>
            </div>
            <div style={{ paddingLeft: '1.5rem' }}>
              <span className="comment">critical   image-alt           1 element missing alt attribute</span>
            </div>
            <div style={{ paddingLeft: '1.5rem' }}>
              <span className="comment">critical   color-contrast       2 elements below 4.5:1 ratio</span>
            </div>
            <div style={{ paddingLeft: '1.5rem' }}>
              <span className="comment">serious    landmark-one-main    page has no &lt;main&gt; landmark</span>
            </div>
            <div style={{ paddingLeft: '1.5rem' }}>
              <span className="comment">serious    label                form input has no accessible label</span>
            </div>
            <div style={{ paddingLeft: '1.5rem' }}>
              <span className="comment">moderate   heading-order        heading levels skipped (h1 → h4)</span>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <span className="comment"># Report written to report.html</span>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <span className="prompt">$ </span>
              <span className="cmd">accesslens audit --url http://localhost:3000/good.html --output report.html</span>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <span className="output-success">✔ 0 violations — all checks passed</span>
            </div>
          </div>
        </div>

        {/* Before / After iframe panes */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem',
          }}
        >
          {/* Bad report */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                marginBottom: '0.625rem',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--danger)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.08em',
                  color: 'var(--danger)',
                  textTransform: 'uppercase',
                }}
              >
                Before — 5 violations
              </span>
            </div>
            <div className="report-pane" style={{ height: '480px' }}>
              <iframe
                src="./reports/bad-report.html"
                title="AccessLens audit report: bad.html — 5 accessibility violations"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'block',
                }}
                loading="lazy"
              />
            </div>
          </div>

          {/* Good report */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                marginBottom: '0.625rem',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--color-success-text)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.08em',
                  color: 'var(--color-success-text)',
                  textTransform: 'uppercase',
                }}
              >
                After — 0 violations
              </span>
            </div>
            <div className="report-pane" style={{ height: '480px' }}>
              <iframe
                src="./reports/good-report.html"
                title="AccessLens audit report: good.html — 0 accessibility violations, all checks passed"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'block',
                }}
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* What it checks */}
        <div
          style={{
            paddingTop: '2.5rem',
            borderTop: '1px solid var(--hairline)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              letterSpacing: '0.1em',
              color: 'var(--muted)',
              textTransform: 'uppercase',
              margin: '0 0 1.25rem 0',
            }}
          >
            What it checks
          </p>
          <ul
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
          >
            {[
              { id: 'contrast', label: 'Color contrast', detail: '≥4.5:1 for text' },
              { id: 'alt', label: 'Alt text', detail: 'images + SVG' },
              { id: 'headings', label: 'Heading order', detail: 'no skipped levels' },
              { id: 'landmarks', label: 'Landmarks', detail: 'main, nav, header, footer' },
              { id: 'aria', label: 'ARIA semantics', detail: 'valid roles & attributes' },
              { id: 'keyboard', label: 'Keyboard nav', detail: 'focusable, no traps' },
            ].map((check) => (
              <li key={check.id}>
                <div
                  className="arch-cell"
                  style={{ padding: '0.875rem 1rem' }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      color: 'var(--ink)',
                      display: 'block',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {check.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6875rem',
                      color: 'var(--muted)',
                    }}
                  >
                    {check.detail}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Keyboard nav checklist */}
        <div
          style={{
            marginTop: '2.5rem',
            padding: '1.5rem',
            border: '1px solid var(--hairline)',
            background: 'var(--surface)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              letterSpacing: '0.1em',
              color: 'rgb(var(--color-primary))',
              textTransform: 'uppercase',
              margin: '0 0 1rem 0',
            }}
          >
            Keyboard nav checklist
          </p>
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
              'Every interactive element reachable via Tab',
              'No keyboard traps (except intentional modal dialogs)',
              'Focus order follows visual/logical reading order',
              'Focus indicator visible with ≥3:1 contrast',
              'Custom widgets implement ARIA keyboard patterns (arrow keys, Home/End)',
              'Skip-navigation link available at the top of the page',
            ].map((item, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  fontWeight: 300,
                  color: 'var(--ink)',
                  lineHeight: 1.5,
                }}
              >
                <CheckIcon />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, marginTop: '0.125rem', color: 'rgb(var(--color-primary))' }}
    >
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <polyline
        points="5,8 7,10.5 11,5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
