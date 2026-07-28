# Release Candidate Workflow

GreenLit's permanent path from a completed change to `master`. It exists so
features can be released repeatedly without re-deriving the process each time.
Each stage is a concrete, reusable artifact — not a manual document.

```text
Developer
  ↓
Static Verification   (bun run check)
  ↓
CI                    (.github/workflows/release-candidate.yml)
  ↓
Runtime Acceptance    (docs/release/RUNTIME_ACCEPTANCE_CHECKLIST.md)
  ↓
Release Steward       (.claude/agents/release-steward.md)
  ↓
Merge                 (creator decision)
```

## Stages

### 1. Developer
Implements the smallest coherent change on a purpose-named branch, updates
tests and documentation with the change, and self-verifies before requesting
release.

### 2. Static Verification
`bun run check` — typecheck, tests, lint, the `convex-refs` guard, and the
production build. Plus `bun run audit`. Run locally via:

```bash
bun run release:candidate        # full gate (static + audit + runtime sign-off)
```

### 3. CI
`.github/workflows/release-candidate.yml` runs `scripts/release-candidate.sh
--ci` on every pull request and on pushes to `master`. CI enforces Static
Verification and Audit. CI **cannot** perform Runtime Acceptance, because the
authenticated browser workflow requires live Convex and Clerk services; it
therefore reports Runtime Acceptance as a downstream manual gate and never
marks it passed.

### 4. Runtime Acceptance
The reusable checklist in `docs/release/RUNTIME_ACCEPTANCE_CHECKLIST.md`,
executed against a real authenticated environment
(`docs/release/RUNTIME_ENVIRONMENT.md`). Its result is recorded as a per-commit
sign-off file under `docs/release/signoff/<sha>.md`. Only then does
`scripts/release-candidate.sh` (full mode) report **RELEASE READY**.

### 5. Release Steward
The seventh engineering specialist (`.claude/agents/release-steward.md`)
evaluates release readiness, branch and PR integrity, merge readiness, release
notes, the deployment and rollback checklists, and documentation
synchronization. It recommends exactly one of: `MERGE`,
`RUN ONE SPECIFIC ADDITIONAL TEST`, or `FIX ONE SPECIFIC BLOCKER`. It never
merges or edits source.

### 6. Merge
The creator makes the final merge decision. Automatic merge is never enabled.

## Invariants

- A stage is never reported as passed unless it actually ran and passed.
- Runtime Acceptance is required for release and cannot be satisfied by static
  analysis or CI.
- The gate blocks on any static, audit, or unmet runtime-acceptance condition.
- The pipeline adds no product behavior; it governs how changes reach `master`.

## Deployment and rollback

- **Deployment:** merge to `master`; deploy the Convex functions
  (`bunx convex deploy`) and the built frontend (`bun run build` output).
- **Rollback:** durable artifacts are append-only and delivered versions are
  immutable, so reverting a change is a code revert plus, if functions changed,
  re-deploying the prior Convex function version. Record the last-known-good
  commit in each sign-off so rollback targets are unambiguous. A change whose
  rollback path is not validated is not release-ready.
