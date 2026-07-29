#!/bin/sh
set -eu

required_files="
CLAUDE.md
CONSTITUTION.md
KERNEL.md
CANON.md
INTELLIGENCE.md
COMPILER.md
docs/ARCHITECTURE.md
docs/governance/PROJECT_STATUS.md
docs/governance/CURRENT_MILESTONE.md
docs/governance/CLAUDE_OPERATING_CONTRACT.md
docs/governance/ENGINEERING_PLAYBOOK.md
docs/governance/SESSION_REPORT_TEMPLATE.md
.greenlight/ORGANIZATION.md
.greenlight/EXECUTION_MODEL.md
.greenlight/protocols/DELEGATION.md
.greenlight/protocols/VERIFICATION.md
.greenlight/protocols/CONTEXT_BUDGET.md
.github/pull_request_template.md
"

missing=0
for file in $required_files; do
  if [ ! -f "$file" ]; then
    echo "Missing required governance file: $file" >&2
    missing=1
  fi
done

if [ "$missing" -ne 0 ]; then
  exit 1
fi

require_text() {
  file="$1"
  text="$2"
  if ! grep -Fq "$text" "$file"; then
    echo "Governance contract drift: '$file' must contain '$text'" >&2
    exit 1
  fi
}

require_text CLAUDE.md "Before editing code"
require_text CLAUDE.md "Produce the mandatory session report"
require_text CLAUDE.md "Never use chat memory to override repository truth."
require_text docs/governance/CLAUDE_OPERATING_CONTRACT.md "Use the least expensive model that can complete the work reliably."
require_text docs/governance/CLAUDE_OPERATING_CONTRACT.md "Never merge automatically."
require_text .greenlight/EXECUTION_MODEL.md "Do not delegate when coordination costs exceed the work"
require_text .github/pull_request_template.md "Governance Evidence"
require_text .github/pull_request_template.md "Verification Evidence"

echo "Governance guard passed."
