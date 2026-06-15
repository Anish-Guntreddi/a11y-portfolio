# NovaUI

An accessible React component library where accessibility is a tested guarantee, not a label.

## Components

| Component | Accessibility guarantees (all asserted by tests) |
|---|---|
| `Button` | Native `<button>`, 4 variants × 3 sizes, `forwardRef`, `type="button"` default, **non-removable** `:focus-visible` outline (a hostile `className` can't strip it). |
| `Input` + `FormField` | `useId`-wired label / description / error, `role="alert"` errors, `aria-describedby` referencing only existing nodes, `aria-invalid`/`aria-required`; consumer ARIA props are **merged**, not clobbered. |
| `Modal` | `role="dialog"` + `aria-modal`, focus trap with browser-faithful tab order, focus **restore** to opener (safe if it's gone), background **inert** while open, Esc + pointer-backdrop dismiss, body scroll lock. |
| `Menu` | WAI-ARIA Menu Button pattern: `aria-haspopup`/`expanded`/`controls`, roving tabindex (exactly one tabbable item), Enter/Space/Down→first, Up→last, Esc→close+return focus, Tab→close, disabled-item skipping. |

Behavior is separated from styling: headless hooks (`useFocusTrap`, `useRovingTabindex`) hold the
logic; styling is driven by CSS-variable **design tokens** with a WCAG-AA light/dark palette and a
pure `contrastRatio` utility.

## Usage

```tsx
import { ThemeProvider, Button, FormField, Input, Modal, Menu } from '@a11y-portfolio/novaui';
import '@a11y-portfolio/novaui/style.css';

<ThemeProvider>
  <Button variant="primary">Save</Button>
</ThemeProvider>;
```

## Verify

```bash
pnpm --filter @a11y-portfolio/novaui test         # unit (Vitest + Testing Library)
pnpm --filter @a11y-portfolio/novaui test:e2e     # Playwright + axe, light & dark themes
pnpm --filter @a11y-portfolio/novaui build-storybook && \
  pnpm --filter @a11y-portfolio/novaui test-storybook   # axe on every story
pnpm --filter @a11y-portfolio/novaui storybook    # interactive docs
```

The e2e suite asserts axe **zero-violations in both themes**, real keyboard flows, focus trap +
restore, roving tabindex, and that the theme switch preserves contrast.
