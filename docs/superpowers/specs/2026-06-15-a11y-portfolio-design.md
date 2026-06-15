# a11y-portfolio — Design Spec

**Date:** 2026-06-15
**Status:** Approved

## Goal

A public portfolio monorepo proving accessibility + frontend engineering depth via two
build-ready projects and a showcase site:

1. **NovaUI** — accessible React component library (WAI-ARIA-correct, themed, Storybook-documented).
2. **AccessLens** — automated web-accessibility audit tool (Playwright + axe-core + custom rules).
3. **Showcase site** — high-contrast editorial GitHub Pages site demonstrating both.

"Done" = automated a11y tests pass, components/audit produce correct results on fixtures, security
audit clean, deployed live.

## Repo layout (pnpm workspaces)

```
a11y-portfolio/
├─ packages/novaui/        # component library + Storybook
├─ packages/accesslens/    # auditor (CLI + library)
├─ site/                   # GitHub Pages showcase (Vite + React)
├─ .github/workflows/      # ci.yml (test/a11y/security), pages.yml (deploy)
└─ docs/superpowers/specs/
```

## Stack

TypeScript · React 18 · Vite · Vitest · Playwright + `@axe-core/playwright` · Storybook 8 ·
Tailwind · `axe-core`.

## NovaUI architecture (behavior/a11y separated from styling)

- **Tokens**: CSS variables + Tailwind config; light/dark; contrast asserted in tests.
- **Headless hooks** (pure, unit-tested): `useFocusTrap`, `useRovingTabindex`, `useDismiss`.
- **Components**: `Button`, `Input`/`FormField`, `Modal/Dialog` (focus trap + restore, Esc),
  `Menu/Dropdown` (WAI-ARIA menu pattern, arrow keys).
- **Storybook**: documents props, variants, a11y guarantees; theme switcher.

### Verification gates
axe passes on every story; Playwright verifies tab/arrow/Esc + focus trap/restore per component;
theme switch keeps contrast (asserted); renders in both themes.

## AccessLens architecture (pure rules over DOM snapshot)

- **Driver**: Playwright loads page → DOM snapshot.
- **Rule runners** (pure functions, unit-tested on fixtures): contrast ratio, alt-text presence,
  heading order, landmark/ARIA usage.
- **axe-core** integration for the broader rule set.
- **Findings model**: severity + remediation tip.
- **Report renderer**: HTML + PDF (Playwright print). **CLI** entry.
- **Keyboard-nav checklist**: tab order, focus visibility, traps.

### Verification gates
Fixtures with known issues assert exact findings; clean fixture yields none (false-positive
control); running against a deliberately-inaccessible sample flags planted problems; report renders.
Claims scoped to "automated checks," never "WCAG certified."

## Showcase site

High-contrast editorial; custom components via `frontend-design` + `ui-ux-pro-max` skills. Sections:
hero, NovaUI live gallery (light/dark), AccessLens before/after demo, architecture writeup, links.
GitHub Pages via Actions. axe-clean on its own pages.

## Working model (token optimization + external validation)

- **Opus orchestrates**: plan, interfaces, gates, integration.
- **Delegate** scoped implementation to **Sonnet**/**Haiku** subagents (Agent tool, model override),
  parallel where independent.
- **Codex validates** each phase independently (not self-review). Phase done only when gates green +
  Codex signs off.

## Per-phase security audit

After every phase: Semgrep + `pnpm audit` + targeted checks (no secrets, no unsanitized
`dangerouslySetInnerHTML`, Playwright sandboxed/authorized-use). Phase not done until clean. Framed
as "automated security audit passes," not absolute security.

## Phases

0. Scaffold monorepo + CI + security baseline
1–5. NovaUI: tokens/theme → Button → Input/FormField → Modal → Menu → Storybook
6–9. AccessLens: driver+axe+fixtures → custom rules → ARIA/keyboard → report+CLI+demo
10. Showcase site + Pages deploy
11. Final audit, READMEs, publish public repo, report

Each phase ends: gates green → Codex review → security audit clean.
