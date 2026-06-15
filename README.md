# a11y-portfolio

**Accessibility treated as a correctness requirement — backed by automated tests, not assertions.**

A TypeScript monorepo with two production-grade projects and an editorial showcase site:

| Package | What it is |
|---|---|
| [`packages/novaui`](packages/novaui) | **NovaUI** — an accessible React component library (WAI-ARIA-correct Button, Input/FormField, Modal, Menu), themeable via design tokens, documented in Storybook, verified by axe + Playwright in light **and** dark themes. |
| [`packages/accesslens`](packages/accesslens) | **AccessLens** — an automated web-accessibility auditor (Playwright + axe-core + custom pure-function rules for contrast / alt / heading order / landmarks / ARIA), a keyboard-navigation checklist, and HTML/PDF/JSON reports with a CI-friendly CLI. |
| [`site`](site) | The showcase site (high-contrast editorial, GitHub Pages) — renders the **real** NovaUI components live and embeds **real** AccessLens reports. |

> **Live site:** https://anish-guntreddi.github.io/a11y-portfolio/

## Why this exists

Accessibility is frequently overlooked, so demonstrated competence here is a strong, memorable
differentiator. Every accessibility claim in this repo is backed by an automated test or audit
artifact — axe-core runs in a real browser, keyboard flows are driven by Playwright, focus traps and
roving tabindex are asserted, and the auditor is validated against fixtures with *known* issues plus
a clean control (false-positive guard).

## Quick start

```bash
pnpm install
pnpm exec playwright install chromium

pnpm -r typecheck        # all packages
pnpm -r test             # unit + integration (real Chromium)
pnpm --filter @a11y-portfolio/novaui test:e2e   # axe + keyboard, light & dark
pnpm lint
pnpm security            # prod-dep audit + secret scan + no-raw-HTML check
```

Run the pieces:

```bash
pnpm --filter @a11y-portfolio/novaui storybook        # component docs + a11y panel
pnpm --filter @a11y-portfolio/accesslens demo         # generates example reports
pnpm --filter @a11y-portfolio/site dev                # the showcase site
```

Audit any local page you own:

```bash
node packages/accesslens/dist/cli.js "file:///path/to/page.html" --format html --out report.html
# remote targets require explicit authorization:
#   --allow-remote --i-am-authorized
```

## Verification gates (what "done" means)

- **NovaUI:** axe-core reports **zero violations on every Storybook story and every component, in both
  light and dark themes**; Playwright asserts tab/arrow/Esc, focus trap + restore, roving tabindex,
  and that a hostile `className` cannot remove the focus ring.
- **AccessLens:** rules assert the **exact** findings on fixtures with planted issues, and **zero**
  findings on a clean control; a real-Chromium integration run corroborates them; HTML output is
  escaped against injection.
- **CI:** lint + typecheck + unit + e2e/axe + build, plus a security job (Semgrep SAST + dependency
  audit). Accessibility claims are scoped to what tooling verifies — "automated checks," never
  "WCAG certified."

## How it was built

This repo was built with an **orchestrator/worker model**: a planning agent (Claude Opus 4.8)
decomposed the work into phases and delegated each implementation task to worker agents, used
**Codex as an independent reviewer/validator** (rather than self-reviewing), and ran an **automated
security audit after every phase**. The full per-phase commit history reflects that loop:
implement → verify gates → independent review → security audit → commit.

## License

MIT
