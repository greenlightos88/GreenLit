#!/usr/bin/env sh
# Source-scoped prohibition (repository rule):
# The frontend must reference Convex functions through the generated typed `api`
# (convex/_generated/api) — never via untyped `makeFunctionReference` or
# `anyApi`. This keeps every frontend Convex call end-to-end typed.
#
# Scope: src/ only. Test harnesses under tests/ are intentionally exempt, since
# they may construct references without the generated client.
set -eu

matches=$(grep -rEn "makeFunctionReference|anyApi" src 2>/dev/null || true)
if [ -n "$matches" ]; then
  echo "ERROR: untyped Convex references are banned in src/." >&2
  echo "Use the generated typed 'api' from convex/_generated/api instead:" >&2
  echo "$matches" >&2
  exit 1
fi
echo "OK: no untyped Convex references in src/."
