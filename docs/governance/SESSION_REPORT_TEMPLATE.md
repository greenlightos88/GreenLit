# Mandatory Session Report

Claude must produce this report before editing code. The report is evidence that the current repository state—not chat memory—governs the task.

## Objective

State the creator's requested outcome in one sentence.

## Governing documents read

List the exact repository files consulted. Include `CLAUDE.md`, project status, current milestone, the operating contract, and only the product or architecture documents relevant to the task.

## Repository evidence inspected

List the relevant source files, tests, issue, pull request, branch, and recent implementation evidence inspected before planning.

## Applicable constraints

State the product invariants, security boundaries, architecture rules, model-routing rules, and milestone limits that constrain the work.

## Execution decision

State:

- whether delegation is justified;
- which specialist roles are required;
- why the selected model depth is sufficient;
- how context will be bounded;
- who performs independent verification.

Do not invent agents merely to appear thorough. Use the smallest capable team.

## Planned write set

List the exact paths or bounded path groups expected to change. State any high-risk paths that are explicitly prohibited.

## Verification plan

List the exact automated checks and live workflow transitions that will prove completion. Authentication, authorization, persistence, reload, and immutable-history checks must be named when applicable.

## Out of scope

State what will intentionally not change.

## Stop conditions

Stop and escalate rather than improvise when repository authority conflicts, required evidence is unavailable, scope expands materially, a security boundary is unclear, or verification cannot be completed honestly.
