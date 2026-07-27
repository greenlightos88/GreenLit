# GreenLit Project Status

**Last updated:** 2026-07-27

This document is the operational memory of the repository. It records observed state, not aspiration. Update it at the end of every milestone or when an active pull request materially changes repository state.

## Product position

GreenLit is a creator-owned Creative Intelligence Operating System. Its core truth flow is:

```text
Fragment → Candidate → Creator Approval → Canon → Immutable Snapshot → Compilation → Artifact
```

Repository doctrine requires explicit creator authority, provenance, immutable history, and a clear separation between inference and canon.

## Default branch

- Branch: `master`
- Latest functional milestone on the branch: Idea-to-Canon-to-Artifact vertical-slice foundation

## Active pull request

### PR #9 — Authoritative persisted compilation

- Branch: `feat/persisted-authoritative-compilation`
- Base: `master`
- State: open
- Automatic merge: prohibited
- Reported verification on the PR branch: `bun run check` passed with 168 tests; `bun run audit` reported no vulnerabilities
- Key capability: server-authoritative compilation from an exact immutable snapshot, durable retrieval, identity-derived `requestedBy`, append-only compiled versions, and preserved delivered history
- Next action: creator review and explicit merge decision

Do not periodically poll this pull request. Resume only when a review comment, new commit, merge request, or explicit creator instruction occurs.

## Governance change

Branch `agent/governance-v1` adds:

- root `CLAUDE.md` as the mandatory agent entry point;
- `CLAUDE_OPERATING_CONTRACT.md`;
- `ENGINEERING_PLAYBOOK.md`;
- `CURRENT_MILESTONE.md`;
- this living project status document.

The governance change must be reviewed through its own pull request and must not be merged automatically.

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
- Absent CI or status checks must be reported as absent, not treated as passing.

## Current blockers

- PR #9 has not yet received the creator's final merge decision.
- The post-PR #9 repository audit has not yet been performed.
- The full conversation-to-artifact workflow has not yet been reverified as one continuous production journey after PR #9.

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
