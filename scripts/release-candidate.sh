#!/usr/bin/env sh
# GreenLit Release Candidate pipeline (reusable).
#
# Encodes the permanent release path as an executable gate rather than a manual
# document:
#
#   Developer -> Static Verification -> CI -> Runtime Acceptance -> Release Steward -> Merge
#
# This script owns the automatable stages (Static Verification, CI) and reports
# the human/live stages (Runtime Acceptance, Release Steward sign-off) honestly.
# It never represents an un-run runtime acceptance as passing.
#
# Stages:
#   1. Static Verification  : bun run check  (typecheck, test, lint, guard, build)
#   2. Dependency Audit      : bun run audit
#   3. Runtime Acceptance    : requires a recorded sign-off for the exact commit
#                              (docs/release/signoff/<sha>.md, or
#                              RELEASE_RUNTIME_SIGNOFF=<sha> matching HEAD).
#                              See docs/release/RUNTIME_ACCEPTANCE_CHECKLIST.md.
#
# Modes:
#   (default) release gate : all stages; "RELEASE READY" only with runtime
#                            sign-off, otherwise exits 3 (runtime pending).
#   --ci                   : Static Verification + Audit only; runtime acceptance
#                            is reported as a downstream manual gate. Exit is
#                            driven by static + audit alone. Use in CI, which
#                            cannot run the authenticated browser workflow.
#
# Exit codes: 0 ready / gate satisfied for the mode; 1 static or audit failed;
#             3 static+audit passed but runtime acceptance is not signed off.
set -u

MODE="gate"
if [ "${1:-}" = "--ci" ]; then MODE="ci"; fi

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
SHORT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
SIGNOFF_FILE="docs/release/signoff/${SHA}.md"

line() { echo "------------------------------------------------------------"; }
stage() { echo; line; echo "STAGE: $1"; line; }

fail_static=0

stage "1/3 Static Verification — bun run check"
if bun run check; then
  static_ok=1
else
  static_ok=0
  fail_static=1
fi

stage "2/3 Dependency Audit — bun run audit"
if bun run audit; then
  audit_ok=1
else
  audit_ok=0
  fail_static=1
fi

stage "3/3 Runtime Acceptance"
runtime_ok=0
if [ -f "$SIGNOFF_FILE" ]; then
  echo "Sign-off found: $SIGNOFF_FILE"
  runtime_ok=1
elif [ "${RELEASE_RUNTIME_SIGNOFF:-}" = "$SHA" ]; then
  echo "Sign-off provided via RELEASE_RUNTIME_SIGNOFF for $SHORT"
  runtime_ok=1
else
  echo "No runtime acceptance sign-off for commit $SHORT."
  echo "Execute docs/release/RUNTIME_ACCEPTANCE_CHECKLIST.md against a real"
  echo "authenticated environment, then record the result at:"
  echo "  $SIGNOFF_FILE"
fi

stage "Release readiness summary ($SHORT, mode=$MODE)"
printf '  Static Verification : %s\n' "$([ "${static_ok:-0}" -eq 1 ] && echo PASS || echo FAIL)"
printf '  Dependency Audit    : %s\n' "$([ "${audit_ok:-0}" -eq 1 ] && echo PASS || echo FAIL)"
printf '  Runtime Acceptance  : %s\n' "$([ "$runtime_ok" -eq 1 ] && echo SIGNED-OFF || echo PENDING)"
line

if [ "$fail_static" -eq 1 ]; then
  echo "VERDICT: BLOCKED — static verification or audit failed."
  exit 1
fi

if [ "$MODE" = "ci" ]; then
  echo "VERDICT: STATIC GATE PASSED."
  echo "Runtime Acceptance and Release Steward sign-off remain required before merge."
  exit 0
fi

if [ "$runtime_ok" -eq 1 ]; then
  echo "VERDICT: RELEASE READY — static, audit, and runtime acceptance satisfied."
  echo "Release Steward makes the final merge recommendation."
  exit 0
fi

echo "VERDICT: RUNTIME ACCEPTANCE PENDING — not release ready."
exit 3
