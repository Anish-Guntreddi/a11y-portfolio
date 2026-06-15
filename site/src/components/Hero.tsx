import React from 'react';
import { ThemeToggle } from './ThemeToggle';

export function Hero() {
  return (
    <section
      aria-label="Introduction"
      style={{
        paddingTop: '6rem',
        paddingBottom: '6rem',
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
        {/* Section number */}
        <div className="animate-fade-up" style={{ marginBottom: '3rem' }}>
          <span className="section-number">01 / Introduction</span>
        </div>

        {/* Focus-ring motif decoration — the design anchor */}
        <div
          className="animate-fade-up-delay-1"
          aria-hidden="true"
          style={{
            display: 'inline-block',
            border: '2px solid var(--accent)',
            outline: '2px solid var(--accent)',
            outlineOffset: '4px',
            borderRadius: '2px',
            padding: '0.25rem 0.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem',
            letterSpacing: '0.15em',
            color: 'rgb(var(--color-primary))',
            marginBottom: '2rem',
            textTransform: 'uppercase',
          }}
        >
          :focus-visible
        </div>

        {/* Masthead */}
        <h1
          className="animate-fade-up-delay-2"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3rem, 8vw, 7rem)',
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            color: 'var(--ink)',
            margin: '0 0 2rem 0',
            fontOpticalSizing: 'auto',
          }}
        >
          Accessibility
          <br />
          <span style={{ color: 'rgb(var(--color-primary))' }}>as correctness.</span>
        </h1>

        {/* Subhead */}
        <div
          className="animate-fade-up-delay-3"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '2rem',
            maxWidth: '52rem',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              fontWeight: 300,
              lineHeight: 1.65,
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            Two production-grade tools that treat keyboard navigation, ARIA semantics,
            and contrast ratios as first-class requirements — not retrofit.
          </p>
        </div>

        {/* Project cards */}
        <div
          className="animate-fade-up-delay-4"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginTop: '4rem',
          }}
        >
          <ProjectCard
            number="01"
            name="NovaUI"
            tagline="Headless accessible component library"
            desc="Button, Input, Modal, Menu — each built on behavior hooks with design tokens, shipping zero-abstraction keyboard patterns and ARIA guarantees."
            accent="#1D4ED8"
          />
          <ProjectCard
            number="02"
            name="AccessLens"
            tagline="Static accessibility auditor"
            desc="Pure-rules-over-DOM-snapshot engine powered by axe-core. CLI that runs in CI and generates reports with actionable findings mapped to WCAG 2.2."
            accent="#1D4ED8"
          />
        </div>

        {/* Focus ring explanation */}
        <div
          style={{
            marginTop: '4rem',
            paddingTop: '2rem',
            borderTop: '1px solid var(--hairline)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1.5rem',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              flexShrink: 0,
              width: '2rem',
              height: '2rem',
              border: '2px solid var(--accent)',
              outline: '2px solid var(--accent)',
              outlineOffset: '4px',
              borderRadius: '2px',
              marginTop: '0.125rem',
            }}
          />
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              lineHeight: 1.6,
              color: 'var(--muted)',
              margin: 0,
              maxWidth: '40rem',
            }}
          >
            The 2px accent outline with offset — the keyboard focus ring — is used throughout this
            portfolio as a design motif. Accessibility made visible and beautiful.
            Toggle theme above to see it adapt across light and dark palettes.
          </p>
          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </section>
  );
}

interface ProjectCardProps {
  number: string;
  name: string;
  tagline: string;
  desc: string;
  accent: string;
}

function ProjectCard({ number, name, tagline, desc }: ProjectCardProps) {
  return (
    <div
      className="ring-card"
      style={{ padding: '1.5rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem',
            color: 'var(--muted)',
            letterSpacing: '0.1em',
          }}
        >
          {number}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.375rem',
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
          }}
        >
          {name}
        </span>
      </div>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6875rem',
          color: 'rgb(var(--color-primary))',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          margin: '0 0 0.75rem 0',
        }}
      >
        {tagline}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.9375rem',
          fontWeight: 300,
          lineHeight: 1.6,
          color: 'var(--muted)',
          margin: 0,
        }}
      >
        {desc}
      </p>
    </div>
  );
}
