# Release Candidate Workflow

GreenLit releases changes through one evidence-based path:

```text
Developer → Static Verification → CI → Runtime Acceptance → Release Steward → Creator Merge
```

## Gates

1. **Developer** — implement one bounded objective on a purpose-named branch.
2. **Static Verification** — run `bun run check` and `bun run audit` on the exact candidate commit.
3. **CI** — repeat the automatable checks in GitHub Actions.
4. **Runtime Acceptance** — execute `RUNTIME_ACCEPTANCE_CHECKLIST.md` in a real Clerk + Convex environment and record a sign-off for the exact commit.
5. **Release Steward** — inspect branch integrity, PR integrity, CI, runtime evidence, deployment, rollback, and synchronized documentation.
6. **Creator Merge** — the creator makes the final merge decision. Automatic merge is not enabled.

## Invariants

- An unrun gate is never reported as passed.
- Static analysis cannot substitute for authenticated runtime acceptance.
- Runtime evidence must identify the exact commit, PR, environment, executor, date, and every required result.
- A sign-off file is evidence, not authority; the release gate validates its required fields and results.
- Product changes and release-infrastructure changes remain isolated in separate pull requests.
- A release with no credible rollback path is blocked.

## Deployment and rollback

Deployment requires the approved `master` commit, a Convex deployment, and the built frontend. Rollback means reverting to the recorded last-known-good commit and redeploying the corresponding frontend and Convex functions. Durable project artifacts must not be deleted or rewritten as part of rollback.
