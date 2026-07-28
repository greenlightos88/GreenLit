#!/usr/bin/env sh
set -u

MODE="gate"
[ "${1:-}" = "--ci" ] && MODE="ci"

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

SHA=$(git rev-parse HEAD)
SHORT=$(git rev-parse --short HEAD)
SIGNOFF="docs/release/signoff/${SHA}.md"
failed=0

stage() { printf '\n--- %s ---\n' "$1"; }

stage "Static verification"
bun run check || failed=1

stage "Dependency audit"
bun run audit || failed=1

[ "$failed" -eq 0 ] || { echo "BLOCKED: automated gate failed."; exit 1; }

if [ "$MODE" = "ci" ]; then
  echo "STATIC GATE PASSED for $SHORT. Runtime acceptance remains required."
  exit 0
fi

stage "Runtime acceptance evidence"
if [ ! -f "$SIGNOFF" ]; then
  echo "BLOCKED: no sign-off for exact commit $SHA."
  exit 3
fi

required_lines="
- Commit: $SHA
- PR: #
- Environment:
- Executed by:
- Date:
- Last-known-good commit:
"
printf '%s\n' "$required_lines" | while IFS= read -r required; do
  [ -z "$required" ] && continue
  grep -Fq -- "$required" "$SIGNOFF" || { echo "INVALID SIGN-OFF: missing $required"; exit 4; }
done || exit $?

pass_count=$(grep -Ec '^\| (10|[1-9]) \|.*\| PASS \|$' "$SIGNOFF" || true)
if [ "$pass_count" -ne 10 ]; then
  echo "INVALID SIGN-OFF: expected 10 explicit PASS rows, found $pass_count."
  exit 4
fi

if grep -Eq '\| (FAIL|NOT RUN|PENDING) \|' "$SIGNOFF"; then
  echo "INVALID SIGN-OFF: non-passing runtime result present."
  exit 4
fi

echo "RELEASE READY: automated gates and validated runtime evidence pass for $SHORT."
