# Security Policy & Posture

This repository runs an automated security audit after every development phase:

- **Semgrep** static analysis (`p/typescript`, `p/react`, `p/owasp-top-ten`, `p/secrets`).
- **Dependency audit** (`pnpm audit`).
- **Targeted checks**: no committed secrets (grep heuristic backstop + Semgrep `p/secrets`);
  no raw HTML injection (enforced by the `react/no-danger` ESLint rule at AST level).

## Authorized-use enforcement (AccessLens)

AccessLens is an authorized-use tool. It enforces this in code rather than by policy alone: the
CLI accepts `file:` URLs and loopback hosts (`localhost`, `127.0.0.1`, `[::1]`) by default and
**refuses any other origin** unless the operator passes `--allow-remote` together with an explicit
`--i-am-authorized` attestation flag. This prevents accidental scanning of third-party sites.

## Shipping-code policy (blocking)

`pnpm audit --prod` MUST report **no known vulnerabilities**. Anything that would ship in the
published `@a11y-portfolio/novaui` package or the static showcase bundle blocks the phase.

Current status: **clean**.

## Dev-tooling advisories (accepted, non-blocking)

`pnpm audit` (including devDependencies) currently surfaces advisories in the local build/test
toolchain. They are accepted because:

| Advisory | Package | Why accepted |
|---|---|---|
| Dev server request reflection | `esbuild` | Dev-server only; binds to `localhost`; not shipped. |
| Optimized-deps path traversal | `vite` | Dev-server only; latest 5.x patch already installed; fix needs a major bump constrained by Storybook 8.6. |
| UI server arbitrary file read | `vitest` | Only when `vitest --ui` is exposed; we never run the UI server, CI included. |
| Deno binary integrity | `esbuild` | Node-only usage here; Deno code path unused. |
| Buffer bounds (`uuid` v3/v5/v6) | `uuid` (via Storybook) | Transitive, pinned by Storybook 8.6; build-time only. |

**Mitigations:** never run `vite`/`storybook`/`vitest` dev servers on untrusted networks; never
expose `vitest --ui`; CI runs only headless `build`/`test`, not dev servers. These will be cleared
when Storybook ships a release compatible with patched Vite/Vitest majors.

## Reporting

Open a private security advisory on the GitHub repository for any vulnerability.
