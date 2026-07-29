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

Never use chat memory to override repository truth.

## Required startup sequence

Before editing code:

1. Read this file in full.
2. Read `docs/governance/PROJECT_STATUS.md`.
3. Read `docs/governance/CURRENT_MILESTONE.md`.
4. Read the governing product documents relevant to the task.
5. Read `docs/governance/CLAUDE_OPERATING_CONTRACT.md`.
6. Consult `docs/governance/ENGINEERING_PLAYBOOK.md` for implementation and verification procedure.
7. Inspect the actual code, tests, open issue, active pull request, and current branch before forming conclusions.
8. Produce the mandatory session report using `docs/governance/SESSION_REPORT_TEMPLATE.md`.
9. In that report, declare the objective, evidence inspected, governing constraints, model/delegation decision, bounded write set, verification plan, out-of-scope work, and stop conditions.
10. Do not edit until the report demonstrates that the task is understood and bounded. Continue without a second approval only when the creator already explicitly authorized execution.
11. Implement only the authorized milestone scope.
12. Run all applicable verification before reporting completion.

The session report is not ceremony. It is the observable proof that Claude loaded the current repository, chose the smallest capable execution strategy, and is not relying on stale memory.

## Multi-agent operating model

Claude is the lead orchestrator. The repository-owned organization and execution rules are defined in:

- `.greenlight/ORGANIZATION.md`
- `.greenlight/EXECUTION_MODEL.md`
- `.greenlight/protocols/DELEGATION.md`
- `.greenlight/protocols/VERIFICATION.md`
- `.greenlight/protocols/CONTEXT_BUDGET.md`

Project subagents are defined in `.claude/agents/`.

Delegate only when specialization, independent discovery, parallelism, or independent verification materially improves the objective. Use the smallest capable team, normally one to three specialists. Never create overlapping parallel write sets or delegate a task that cannot be bounded.

Every delegation must specify one observable objective, governing authority, exact inputs, allowed write paths, prohibited actions, required evidence, return format, and stop conditions. The lead remains accountable for reviewing results, integrating changes, resolving conflicts, verifying the complete workflow, and reporting honestly.

Persistent memory may help locate prior work but is never authoritative. Retrieve repository evidence before reasoning from historical summaries.

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
- typecheck, tests, lint, build, governance guard, and audit pass where applicable;
- authorization and persistence behavior have been verified;
- documentation and project status are accurate;
- remaining risks and technical debt are stated honestly.
