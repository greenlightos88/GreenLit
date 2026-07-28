# GreenLit Project Status

**Last updated:** 2026-07-28

This document is the operational memory of the repository. It records observed state, not aspiration. Update it at the end of every milestone or when an active pull request materially changes repository state.

## Release infrastructure

A permanent Release Candidate pipeline governs how changes reach `master`:
Developer → Static Verification → CI → Runtime Acceptance → Release Steward → Merge.

- Pipeline definition: `docs/release/RELEASE_CANDIDATE_WORKFLOW.md`.
- Reusable gate: `scripts/release-candidate.sh` (`bun run release:candidate`) runs static verification + audit and enforces a per-commit runtime-acceptance sign-off; `--ci` mode runs the static gate in `.github/workflows/release-candidate.yml`.
- Reusable runtime gate: `docs/release/RUNTIME_ACCEPTANCE_CHECKLIST.md`, executed against a real environment set up per `docs/release/RUNTIME_ENVIRONMENT.md`, recorded under `docs/release/signoff/<sha>.md`.
- Release Steward is the seventh engineering specialist (`.claude/agents/release-steward.md`), registered in `.greenlight/ORGANIZATION.md`.

### PR #17 runtime status

PR #17's code candidate (`feat/develop-persisted-rehydration` @ `c57fe93`, the creator's own `popstate` fix) passes static verification (`bun run check`) and `bun run audit`. Runtime acceptance remains **PENDING**: this environment has no Clerk application and cannot download the Convex local backend through its egress proxy, so the authenticated `/develop` workflow cannot be exercised here. Runtime acceptance must be run per the checklist in a credentialed environment before merge.

## Product position

GreenLit is a creator-owned Creative Intelligence Operating System. Its core truth flow is:

```text
Fragment → Candidate → Creator Approval → Canon → Immutable Snapshot → Compilation → Artifact
```

Repository doctrine requires explicit creator authority, provenance, immutable history, and a clear separation between inference and canon.

## Default branch

- Branch: `master` (tip `f3727a9`)
- Latest functional milestone on the branch: authoritative persisted compilation on top of the Idea-to-Canon-to-Artifact vertical slice
- Merged into `master` since the last status update:
  - PR #9 — authoritative persisted compilation (`compileSnapshot`, `getLatestCompilation`, `getCompiledDocument`; server-authoritative, append-only, identity-derived `requestedBy`).
  - PR #12 — authorization hardening for reviews and exports; removal of the dead `persistQualityGateRun`.
  - PR #18 — GreenLit multi-agent engineering organization (`.greenlight/`, `.claude/agents/`, governance docs, `CLAUDE.md` integration).

## Active pull requests

### PR #17 — Rehydrate `/develop` from persisted authoritative state

- Branch: `feat/develop-persisted-rehydration`
- Base: `master`
- State: open; automatic merge prohibited
- Capability: `/develop` reconstructs the selected creator workspace from persisted, owner-authorized Convex state and reloads the latest authoritative compilation by project via `getLatestCompilation(projectId)`, instead of relying on browser-only snapshot/document identifiers. Explicit rehydrating / project-unavailable / project-empty / compilation-empty / operation-failure states are shown. The client-side ephemeral compiler preview was removed from the production workspace.
- Convex remains authoritative: the URL carries only a project id for navigation and is never trusted for authorization; `listProjects` is owner-scoped and every downstream query enforces `assertProjectAccess`.
- Repository CI now exists (`.github/workflows/ci.yml`, added on the PR branch): on pull request and pushes to `master` it runs `bun install --frozen-lockfile`, `bun run check`, and `bun run audit`. The PR's CI check reports success.
- Resume verification (working branch `claude/greenlit-alpha-pr17-rehydration-xxfu59`, PR #17 merged onto current `master` plus one follow-up fix): `bun run check` exits 0 — `tsc --noEmit`, `bun test` (176 pass / 0 fail across 21 files), `oxlint` (3 pre-existing style warnings only), `guard:convex-refs`, and `vite build` all pass; `bun audit` reports no vulnerabilities.
- Follow-up fix applied on the working branch (not yet on the PR branch): the workspace now subscribes to `popstate` so browser back/forward across `?project=` values rehydrates the URL-indicated project; previously a synthetic `popstate` dispatch had no listener.
- Next action: creator review, land the follow-up fix onto the PR branch, complete the manual browser acceptance sequence, then explicit merge decision.

### PR #15 — Alpha vertical-slice execution board (documentation only)

- Branch: `alpha/vertical-slice-execution-board`
- Base: `master`; state: open
- Documentation-only. Defines the Alpha demo promise, definition of done, and the persistence-complete `/develop` implementation target that PR #17 fulfils. No runtime source, schema, dependency, or behaviour change; not a code prerequisite for PR #17.

### Other open documentation PRs

- PR #13 (`docs/master-system-blueprint`) and PR #14 (`docs/context-assembly-spec`, stacked on #13) are open architecture documents. Review #13 before #14. Neither changes runtime behaviour.

Do not periodically poll these pull requests. Resume only when a review comment, new commit, merge request, or explicit creator instruction occurs.

## Current milestone

Vertical Slice Completion and Architecture Hardening.

The next implementation cycle begins with a repository audit after PR #9 disposition. It must verify the full creator workflow, classify remaining fixture usage, complete only Critical production transitions, and harden architecture after end-to-end success.

See `CURRENT_MILESTONE.md` for the authoritative scope.

## Known operational facts

- Bun is the only package manager.
- Authentication uses Clerk; server data and authorization use Convex.
- Project access is intended to be owner-scoped server-side.
- The repository has deterministic fixture-backed surfaces that require audit before they can be described as production-complete.
- The corner assistant is deterministic and must remain honestly labelled until a real model-backed layer is connected.
- Repository CI now exists (`.github/workflows/ci.yml`) and runs `bun run check` and `bun run audit`. Its results must be inspected per pull request, not assumed; a check that did not run must not be reported as passing.

## Known limitations and technical debt (PR #17 scope)

- The manual browser acceptance sequence for `/develop` (create/select project → open `/develop?project=<id>` → approve Canon → compile → refresh → confirm project, Canon, and compilation persist → navigate to an unauthorized project id) has not been executed; no live Convex deployment or Clerk credentials are available in the resume sandbox, so verification to date is static analysis plus the automated suite. There is no component-level test of the `DevelopPage` rehydration path; backend contracts (`getLatestCompilation`, owner isolation, reload) are covered by `tests/persisted-compilation.test.ts`.
- Project selection is encoded in the `?project=` query string rather than a dedicated route parameter.
- `convex/snapshot.ts:getCanonSnapshot` is no longer used by the frontend after the ephemeral preview was removed; it remains a valid owner-authorized query and is a cleanup candidate, not a defect.
- `writeProjectToLocation` does not repeat the `typeof window === "undefined"` guard used by `projectFromLocation`; harmless in this SPA (no SSR entry point) but inconsistent.

## Current blockers

- PR #17 has not yet received the creator's final merge decision, and its `popstate` follow-up fix lives on the resume working branch (`claude/greenlit-alpha-pr17-rehydration-xxfu59`), not yet on the PR branch `feat/develop-persisted-rehydration`.
- The full conversation-to-artifact workflow has not yet been reverified as one continuous production journey in a running browser after PR #17.

## Update protocol

At the end of each implementation cycle, replace stale information in this file with:

- completed capability;
- merged and active pull requests;
- exact verification results;
- blockers;
- known limitations;
- technical debt affecting the next milestone;
- creator-approved next objective.

Never preserve a reassuring status that the repository no longer supports.
