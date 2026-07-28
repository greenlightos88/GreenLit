# GreenLit — Claude Repository Entry Point

This file is the mandatory starting point for every Claude Code session operating in this repository.

## Authority order

When instructions conflict, apply this order:

1. The creator's explicit current instruction.
2. Repository truth and invariants in `CONSTITUTION.md`, `KERNEL.md`, `CANON.md`, `INTELLIGENCE.md`, `COMPILER.md`, and `docs/ARCHITECTURE.md`.
3. The active objective in `docs/governance/CURRENT_MILESTONE.md`.
4. The operating rules in `docs/governance/CLAUDE_OPERATING_CONTRACT.md`.
5. The procedures in `docs/governance/ENGINEERING_PLAYBOOK.md`.
6. Existing implementation patterns, tests, and source code.

Never use chat memory, persistent memory, or prior summaries to override repository truth.

## Required startup sequence

Before editing code:

1. Read this file in full.
2. Read `docs/governance/PROJECT_STATUS.md`.
3. Read `docs/governance/CURRENT_MILESTONE.md`.
4. Identify the minimum governing product documents required for the task.
5. Read `docs/governance/CLAUDE_OPERATING_CONTRACT.md`.
6. Consult only the relevant sections of `docs/governance/ENGINEERING_PLAYBOOK.md`.
7. Inspect the actual code, tests, open issue, active branch, and active pull request before forming conclusions.
8. Search existing decisions and implementation before proposing a new abstraction.
9. Produce a bounded implementation plan with explicit verification.
10. Implement only the approved milestone scope.
11. Run all applicable verification before reporting completion.

## Context discipline

Treat context as a finite engineering resource.

- Retrieve before reasoning. Search the repository instead of relying on recollection.
- Read the smallest authoritative source that can answer the current question.
- Do not load entire directories, long documents, test logs, or generated output when a targeted search or bounded excerpt is sufficient.
- Summarize large findings once, preserve exact paths and evidence, and avoid repeating unchanged material.
- Keep discovery, implementation, verification, and reporting separate.
- Do not carry completed exploratory material into later phases when a concise verified summary is sufficient.
- Start a fresh session after a major phase when the current context is dominated by completed work, large tool output, or unrelated history.

## Delegation discipline

Use subagents to protect the main orchestration context when work is independently separable.

Good delegation targets include repository discovery, bounded architecture audits, test-log analysis, frontend implementation, backend implementation, and documentation review.

Every delegated result must return:

- concise findings;
- exact files and symbols inspected or changed;
- evidence and verification performed;
- unresolved uncertainty and risks;
- no claim of overall completion.

The lead agent owns scope, architecture, integration, conflict resolution, and final verification. Do not create an uncontrolled agent swarm.

## Memory policy

Persistent memory is an index, not authority.

- Use memory to locate prior work, rationale, conventions, and unresolved dependencies.
- Validate every recalled fact against the current repository before acting.
- Store durable rationale and recurring conventions only when they are not already represented clearly in canonical documents.
- Do not store secrets, transient logs, speculative ideas, stale task state, or generated summaries as project truth.
- When memory conflicts with code, tests, governance, or current creator instruction, repository truth wins.

## Resumability

Substantial work must leave durable repository state that a fresh session can resume without reconstructing chat history.

Before ending an implementation cycle:

- update `docs/governance/PROJECT_STATUS.md` when repository state materially changed;
- record exact verification results, not reassurance;
- state blockers, known limitations, technical debt, and the next authorized action;
- ensure architectural or product decisions are recorded in the repository's authoritative decision location;
- remove or clearly mark stale status that could mislead the next session.

## Non-negotiable product invariants

- The creator remains the sole authority over project truth.
- Fragments are evidence, not canon.
- Candidates remain proposed until explicit creator approval.
- Canon mutations must be explicit, authorized, attributable, and durable.
- Compilation consumes immutable canon snapshots.
- Delivered artifacts and historical versions are never silently rewritten.
- Generated inference must remain distinguishable from sourced fact.
- Client input is never trusted for authorization or authorship identity.
- Deterministic fixtures may support tests, demos, and explicit fallback modes; they must not masquerade as production state.

## Scope discipline

Do not broaden the product, redesign architecture, add speculative systems, introduce dependencies, or perform unrelated refactors unless the active milestone or creator explicitly requires it.

When uncertain: inspect first, state the uncertainty, choose the smallest reversible change, and verify it.

## Completion standard

Do not say work is complete unless:

- the requested workflow works end to end;
- typecheck, tests, lint, build, and audit pass where applicable;
- authorization and persistence behavior have been verified;
- documentation and project status are accurate;
- remaining risks and technical debt are stated honestly.
