# GreenLit Engineering Playbook

## Purpose

This playbook defines how implementation work is performed. Product truth remains in the repository's governing documents; the active objective remains in `CURRENT_MILESTONE.md`.

## 1. Intake and audit

For every task:

- identify the exact user outcome;
- locate the governing invariant and current implementation;
- trace the full data path, including server authorization and persisted reads;
- inventory fixtures, fallbacks, temporary paths, and duplicated logic;
- classify workflow stages as `COMPLETE`, `PARTIAL`, or `MISSING`;
- distinguish existing defects from requested scope.

Do not edit code before the audit is sufficient to support a bounded plan.

## 2. Planning

A valid plan states:

- objective and non-goals;
- files or domains likely to change;
- interfaces and invariants that must remain stable;
- migrations or compatibility concerns;
- tests required;
- risks and rollback strategy;
- specialist ownership, if delegation is justified.

Rank findings as `Critical`, `High`, `Medium`, or `Low`. Implement only the approved priority level.

## 3. Implementation

- Prefer one authoritative production path.
- Keep pure domain functions separate from transport and persistence.
- Derive identity and authorization server-side.
- Use immutable snapshots and append-only history where repository doctrine requires it.
- Preserve provenance and truth status through every transformation.
- Keep deterministic fallback visibly labelled and isolated.
- Avoid speculative abstractions.
- Update documentation in the same change when behaviour or contracts change.

## 4. Testing

Test at the lowest useful level and at the full workflow boundary.

Minimum areas when applicable:

- pure domain behaviour;
- input validation and typed contracts;
- owner isolation and unauthorized access;
- identity derivation;
- persistence and durable retrieval;
- repeat operations and version history;
- immutable delivered state;
- reload and subscription behaviour;
- failure and recovery paths;
- accessibility for altered UI;
- deterministic fallback honesty.

Do not weaken tests merely to make a change pass.

## 5. Verification

Run repository-standard commands from the repository root:

```bash
bun run check
bun run audit
```

Where `bun run check` does not cover a relevant path, run the specific test, typecheck, lint, build, or integration command in addition.

Record exact commands and results. A command not run must not be reported as passing.

For user-facing workflows, verify the actual transition rather than relying only on static analysis:

```text
Conversation
→ Fragment
→ Candidate
→ Creator Review
→ Canon Event
→ Immutable Snapshot
→ Compilation
→ Artifact
→ Reload
→ State Preserved
```

## 6. Review

Before opening or updating a pull request:

- inspect the diff for scope leakage;
- remove dead code and accidental debugging output;
- confirm no credential or environment file was added;
- confirm dependency changes are intentional and locked;
- confirm documentation matches behaviour;
- confirm the PR description states invariants and verification honestly.

## 7. Pull-request state

A pull request may be described as ready only when:

- its branch is current enough to review meaningfully;
- required local verification passes;
- known failures are disclosed;
- no automatic merge is enabled;
- the change is bounded and reviewable.

If no CI exists, say so. Do not describe absent checks as passing.

## 8. Status maintenance

At the end of each implementation cycle, update `PROJECT_STATUS.md` with:

- completed capability;
- active branch and PR;
- verification state;
- current blockers;
- known limitations;
- next recommended milestone.

Update `CURRENT_MILESTONE.md` only when the creator approves a new milestone or materially changes the current one.

## 9. Stop conditions

Stop and escalate when:

- repository doctrine conflicts with the requested implementation;
- a destructive migration lacks an approved recovery plan;
- creator authority or canon safety would be weakened;
- authentication or authorization cannot be verified;
- scope has expanded beyond the active milestone;
- critical information is missing and cannot be grounded from the repository.

Do not hide uncertainty behind implementation momentum.
