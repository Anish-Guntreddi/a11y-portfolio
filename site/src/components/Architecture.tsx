import React from 'react';

export function Architecture() {
  return (
    <section
      id="architecture"
      aria-labelledby="arch-heading"
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
            04 / Architecture &amp; Process
          </span>
          <h2
            id="arch-heading"
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
            Under the hood
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
            Two complementary tools sharing a design philosophy: correctness is verified, not assumed.
          </p>
        </div>

        {/* Two-column architecture: NovaUI + AccessLens */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem',
          }}
        >
          {/* NovaUI architecture */}
          <div className="arch-cell" style={{ padding: '1.75rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <span
                aria-hidden="true"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.1em',
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                }}
              >
                01
              </span>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--ink)',
                  margin: '0.25rem 0 0 0',
                }}
              >
                NovaUI
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ArchLayer
                label="Behavior hooks"
                items={[
                  'useFocusTrap — bidirectional focus cycling, background inert',
                  'useRovingTabindex — arrow-key navigation, skip disabled',
                ]}
              />
              <ArchLayer
                label="Design tokens"
                items={[
                  'CSS channel triplets (not raw hex) — opacity modifiers work',
                  'data-theme attribute — ThemeProvider sets it on <html>',
                  'Contrast ratios verified: ≥7:1 fg/bg, ≥4.5:1 interactive',
                ]}
              />
              <ArchLayer
                label="Components"
                items={[
                  'Headless logic + opinionated token-driven styles',
                  'Button · FormField · Input · Modal · Menu',
                  'Each ships aria- attributes as non-removable invariants',
                ]}
              />
              <ArchLayer
                label="Verification gates"
                items={[
                  'Vitest unit tests (jsdom)',
                  'Playwright + axe-core — zero violations across components',
                  'Storybook + @storybook/addon-a11y per story',
                ]}
              />
            </div>
          </div>

          {/* AccessLens architecture */}
          <div className="arch-cell" style={{ padding: '1.75rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <span
                aria-hidden="true"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.1em',
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                }}
              >
                02
              </span>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--ink)',
                  margin: '0.25rem 0 0 0',
                }}
              >
                AccessLens
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ArchLayer
                label="Snapshot engine"
                items={[
                  'Pure function: rules(DOMSnapshot) → findings[]',
                  'No global state — deterministic, cacheable, testable',
                  'Playwright drives the browser; axe-core runs in-page',
                ]}
              />
              <ArchLayer
                label="Rule categories"
                items={[
                  'Contrast — WCAG 1.4.3 / 1.4.11',
                  'Alt text — images, SVG, decorative detection',
                  'Heading structure + document landmarks',
                  'ARIA validity, keyboard operability',
                ]}
              />
              <ArchLayer
                label="Report output"
                items={[
                  'HTML report with severity buckets (critical → moderate)',
                  'JSON output for programmatic consumption',
                  'Exit code 1 on violations — blocks CI pipelines',
                ]}
              />
              <ArchLayer
                label="Verification"
                items={[
                  'Integration tests: bad fixture → 5 findings, good → 0',
                  'Custom-rule tests for each rule category',
                  'Security: no eval, no network in rule engine',
                ]}
              />
            </div>
          </div>
        </div>

        {/* Process story: AI-assisted build */}
        <div
          style={{
            borderTop: '1px solid var(--hairline)',
            paddingTop: '2.5rem',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              letterSpacing: '0.1em',
              color: 'var(--muted)',
              textTransform: 'uppercase',
              margin: '0 0 1.5rem 0',
            }}
          >
            Build process — AI-assisted orchestration
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1px',
              background: 'var(--hairline)',
              border: '1px solid var(--hairline)',
              marginBottom: '1.5rem',
            }}
          >
            {[
              {
                agent: 'Opus (orchestrator)',
                role: 'Architected the two-package strategy, defined verification gates, set quality bars, coordinated phases',
                color: 'rgb(var(--color-primary))',
              },
              {
                agent: 'Sonnet (implementor)',
                role: 'Implemented component behavior hooks, rule engine, CLI, report templates, and this portfolio site',
                color: 'var(--ink)',
              },
              {
                agent: 'Haiku (fast passes)',
                role: 'Token generation, repetitive test scaffolding, lint-fix passes, type annotation fills',
                color: 'var(--muted)',
              },
              {
                agent: 'Codex (validator)',
                role: 'Independent post-phase code review — caught invariant gaps and type unsoundness before merge',
                color: 'var(--ink)',
              },
            ].map((stage) => (
              <div
                key={stage.agent}
                style={{
                  padding: '1.25rem',
                  background: 'var(--canvas)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: stage.color,
                    margin: '0 0 0.5rem 0',
                  }}
                >
                  {stage.agent}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    fontWeight: 300,
                    lineHeight: 1.55,
                    color: 'var(--muted)',
                    margin: 0,
                  }}
                >
                  {stage.role}
                </p>
              </div>
            ))}
          </div>

          {/* Phase sequence */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.25rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              color: 'var(--muted)',
            }}
          >
            {[
              'tokens + a11y primitives',
              'behavior hooks',
              'components',
              'audit engine',
              'CLI + reports',
              'portfolio site',
              'security audit',
            ].map((phase, i, arr) => (
              <React.Fragment key={phase}>
                <span
                  style={{
                    padding: '0.25rem 0.5rem',
                    border: '1px solid var(--hairline)',
                    borderRadius: '2px',
                    color: 'var(--ink)',
                    background: 'var(--surface)',
                  }}
                >
                  {phase}
                </span>
                {i < arr.length - 1 && (
                  <span aria-hidden="true" style={{ color: 'rgb(var(--color-primary))' }}>→</span>
                )}
              </React.Fragment>
            ))}
          </div>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              fontWeight: 300,
              lineHeight: 1.65,
              color: 'var(--muted)',
              margin: '1.5rem 0 0 0',
              maxWidth: '48rem',
            }}
          >
            Each phase ended with a Codex validation pass and a security review script before
            merging. The accessibility guarantees in NovaUI and AccessLens are not aspirational —
            they are verified by automated tests that run in CI and block deployment on failure.
          </p>
        </div>
      </div>
    </section>
  );
}

interface ArchLayerProps {
  label: string;
  items: string[];
}

function ArchLayer({ label, items }: ArchLayerProps) {
  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6875rem',
          letterSpacing: '0.08em',
          color: 'rgb(var(--color-primary))',
          textTransform: 'uppercase',
          margin: '0 0 0.375rem 0',
        }}
      >
        {label}
      </p>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        }}
      >
        {items.map((item) => (
          <li
            key={item}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              fontWeight: 300,
              lineHeight: 1.5,
              color: 'var(--muted)',
              paddingLeft: '0.875rem',
              position: 'relative',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                color: 'var(--hairline)',
              }}
            >
              ·
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
