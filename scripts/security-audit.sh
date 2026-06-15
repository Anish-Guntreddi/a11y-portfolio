#!/usr/bin/env bash
# Local security audit — run after every phase.
# Blocking: prod-dependency vulnerabilities and committed secrets.
# Reporting: dev-dependency advisories and Semgrep findings.
set -uo pipefail
cd "$(dirname "$0")/.."

fail=0

echo "==> [BLOCKING] Shipping-dependency audit (pnpm audit --prod)"
if ! pnpm audit --prod --audit-level low; then
  echo "!! Production dependency vulnerability found."
  fail=1
fi

echo "==> [REPORT] Full dependency audit (dev included)"
pnpm audit || true

echo "==> [BLOCKING] Secret scan"
if git grep -nIE '(gho_|ghp_|sk-[A-Za-z0-9]{20}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)' -- ':!pnpm-lock.yaml' ':!scripts/security-audit.sh' ':!SECURITY.md' 2>/dev/null; then
  echo "!! Possible committed secret found."
  fail=1
else
  echo "No secrets detected."
fi

echo "==> [BLOCKING] Unsanitized dangerouslySetInnerHTML"
if git grep -nI 'dangerouslySetInnerHTML' -- 'packages' 'site' 2>/dev/null | grep -v 'DOMPurify\|sanitize'; then
  echo "!! dangerouslySetInnerHTML without sanitization."
  fail=1
else
  echo "None found."
fi

echo "==> [REPORT] Semgrep (if installed)"
if command -v semgrep >/dev/null 2>&1; then
  semgrep --config p/typescript --config p/react --config p/owasp-top-ten \
    --error --quiet packages site 2>/dev/null || echo "(semgrep reported findings — review above)"
else
  echo "semgrep CLI not found locally; CI runs it."
fi

if [ "$fail" -ne 0 ]; then
  echo "==> SECURITY AUDIT FAILED"
  exit 1
fi
echo "==> SECURITY AUDIT PASSED (blocking checks clean)"
