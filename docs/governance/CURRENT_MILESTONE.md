# Current Milestone — Vertical Slice Completion and Architecture Hardening

## Status

**Active after PR #9 is reviewed and merged, or when the creator explicitly directs work to continue from its branch.**

This is not a feature-expansion sprint. It is the completion and hardening phase for GreenLit's production vertical slice.

## Primary objective

Prove and stabilize the complete creator-owned workflow:

```text
Authenticate
→ Select Project
→ Conversation / Creative Input
→ Fragment
→ Interpretation
→ Candidate
→ Creator Review
→ Approval
→ Canon Event
→ Immutable Snapshot
→ Compile
→ Artifact
→ Reload
→ State Preserved
```

The repository must use authoritative, authenticated, durable production paths. Fixtures may remain only for tests, explicit demonstrations, and clearly labelled deterministic fallback.

## Current known state

- Issue #8 is implemented in PR #9.
- PR #9 introduces authoritative server-side snapshot compilation, durable artifact retrieval, identity-derived authorship, append-only compiled documents, and preserved immutable delivery history.
- PR #9 is open against `master`, is not to be merged automatically, and must receive final creator review.
- No periodic PR polling is authorized.
- Repository CI status must be inspected rather than assumed. If no GitHub Actions or required checks exist, report that fact accurately.

## Phase 0 — Repository audit

Before writing new milestone code, inspect the repository and produce a grounded audit.

### Completed

Document exactly what works today, with file and test evidence.

### Incomplete

Identify every unfinished production transition.

### Fixture inventory

Locate all deterministic fixture usage and classify each instance:

- `KEEP` — tests, explicit demo mode, or explicit deterministic fallback;
- `REPLACE` — authenticated workspace, creator workflow, persisted production state, or user-facing state represented as live.

### Workflow audit

Classify each transition as:

- `COMPLETE`
- `PARTIAL`
- `MISSING`

Do not infer completion from UI appearance. Trace writes, reads, authorization, persistence, subscriptions, and reload behaviour.

### Architecture audit

Identify, without fixing yet:

- duplicated domain logic;
- dead code;
- temporary workarounds;
- stale interfaces;
- weak typing;
- authorization risks;
- fixture leakage;
- hidden fallbacks;
- unnecessary abstractions;
- technical debt that blocks the vertical slice.

## Phase 1 — Prioritized implementation plan

After the audit, rank findings:

1. Critical
2. High
3. Medium
4. Low

Begin only Critical work required to complete the production vertical slice. Do not broaden scope.

## Phase 2 — Live data completion

Replace remaining production fixture reads with authenticated Convex data where the audit proves they block the creator workflow.

Requirements:

- typed Convex APIs;
- owner-scoped server authorization;
- durable persistence;
- live subscriptions where the product requires reactive state;
- no caller-supplied identity or authorship authority;
- no fake production state.

## Phase 3 — Conversation-first workspace

Evolve the existing interaction model so conversation or creative input is the primary operating surface rather than a detached corner utility.

The intended hierarchy is:

```text
Conversation
→ Project
→ Fragments
→ Candidates
→ Canon
→ Compiler
→ Artifacts
```

Do not merely enlarge the current assistant. Reuse the established action interfaces and preserve canon safeguards. Do not introduce model theatre or fabricate intelligence that is not connected.

## Phase 4 — End-to-end verification

Verify the complete creator workflow in the running application.

For every failure:

1. stop;
2. identify the authoritative failing transition;
3. repair the smallest coherent cause;
4. retest the transition;
5. rerun applicable repository checks.

Do not continue downstream while an upstream production transition is broken.

## Phase 5 — Architecture hardening

Only after the end-to-end workflow succeeds:

- remove duplication introduced by temporary paths;
- tighten types;
- delete obsolete fixtures from production code;
- simplify unnecessary abstractions;
- update documentation and migration notes;
- review accessibility of changed surfaces;
- measure and address material performance issues.

Avoid unrelated redesign or aesthetic refactoring.

## Phase 6 — Verification standard

Before completion, run:

```bash
bun run check
bun run audit
```

Also verify, where applicable:

- authentication;
- owner authorization and isolation;
- identity derivation;
- durable persistence;
- live retrieval or subscription behaviour;
- reload survival;
- immutable snapshots and delivered versions;
- distinct repeat compilation versions;
- accessibility of changed UI.

## Non-goals

Do not add during this milestone unless explicitly authorized:

- multi-user collaboration;
- plugin marketplace or general plugin system;
- native mobile applications;
- speculative graph visualization;
- additional model providers;
- cloud infrastructure beyond what the vertical slice needs;
- broad visual redesign;
- unrelated dependency upgrades.

## Required final report

At the end, provide:

1. Executive Summary
2. Repository Audit
3. Workflow Audit
4. Architecture Findings
5. Files Changed
6. Tests and Verification Executed
7. Authorization and Persistence Results
8. Remaining Critical Work
9. Technical Debt
10. Recommended Next Milestone

Do not declare the vertical slice complete until the entire creator workflow has been verified end to end and survives reload.
