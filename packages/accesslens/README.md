# AccessLens

An automated web-accessibility auditor. Loads a page in a real browser, runs axe-core plus custom
pure-function rules, and produces a report with severity and remediation guidance.

> **Authorized use only.** AccessLens audits `file:` URLs and loopback hosts by default. Auditing any
> other origin requires **both** `--allow-remote` and `--i-am-authorized`; this is enforced in code
> (including a re-check of the final URL after redirects), not by policy alone.

## What it checks

- **axe-core** — the canonical engine for the categories it covers.
- **Custom pure-function rules** over a DOM snapshot (independently tested, deduped against axe):
  contrast (WCAG ratio with alpha compositing + large-text thresholds), alt text
  (`img`/`input[type=image]`/`area`, decorative-aware), heading order (no-h1 + level skips, including
  `role=heading`), landmark structure (single `main`, uniquely-named regions), and ARIA misuse
  (invalid roles, `aria-hidden` on focusable elements).
- **Keyboard-navigation checklist** — positive-tabindex, unfocusable interactives, skip link
  (auto-checked) plus focus-visibility / keyboard-trap items flagged for manual review.

## CLI

```bash
accesslens <url> [options]
  --format html|pdf|json   Output format (default: html)
  --out <file>             Write to file (required for pdf)
  --no-custom-rules        axe only
  --allow-remote           Allow non-loopback targets (needs --i-am-authorized)
  --i-am-authorized        Attest you are authorized to scan the target
  --fail-on <severity>     Exit non-zero at/above this severity (CI gate)
```

## Library

```ts
import { auditUrl, renderHtmlReport } from '@a11y-portfolio/accesslens';

const result = await auditUrl('file:///path/page.html');
const html = renderHtmlReport(result); // self-contained, accessible, injection-safe
```

## Verify

```bash
pnpm --filter @a11y-portfolio/accesslens test   # pure-rule + real-Chromium integration
pnpm --filter @a11y-portfolio/accesslens build
pnpm --filter @a11y-portfolio/accesslens demo   # audits good.html + bad.html -> examples/
```

The fixtures are the proof: `bad.html` has five planted issues the rules flag exactly; `good.html`
is the clean control that must yield zero findings.
