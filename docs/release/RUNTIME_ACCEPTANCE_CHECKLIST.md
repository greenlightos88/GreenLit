# Runtime Acceptance Checklist

The reusable runtime gate of the Release Candidate pipeline
(`docs/release/RELEASE_CANDIDATE_WORKFLOW.md`). It is executed against a **real,
authenticated environment** — a live Convex deployment and a live Clerk
application (see `docs/release/RUNTIME_ENVIRONMENT.md`). Static verification and
CI cannot substitute for it, because the authenticated browser workflow cannot
run without those services.

## How to use

1. Bring up the environment per `docs/release/RUNTIME_ENVIRONMENT.md`.
2. Check out the exact release-candidate commit.
3. Execute every step below in a real browser as an authenticated owner.
4. Record the outcome as a sign-off file (template at the end), commit it to
   `docs/release/signoff/<full-commit-sha>.md`, and re-run
   `bun run release:candidate`. A signed-off commit reports **RELEASE READY**.

Do not record a sign-off unless every required step passed. A single failure
means the candidate is not release-ready; fix only the revealed defect, re-run
static verification and the affected tests, and repeat this checklist.

## Steps

| # | Step | Pass condition |
|---|------|----------------|
| 1 | Create project | A persisted project is created and appears in the owner's project list. |
| 2 | Direct navigation | Opening `/develop?project=<id>` directly loads that exact project. |
| 3 | Persisted workspace | Candidates, approved Canon, and the latest compilation load from Convex, not browser-only state. |
| 4 | Candidate creation | A fragment yields persisted Candidate proposals. |
| 5 | Canon approval | Approving a Candidate creates persisted Canon; edit-approve persists edits. |
| 6 | Compilation | Snapshot & compile produces a persisted authoritative document via `compileSnapshot`. |
| 7 | Refresh persistence | After a full browser refresh, project, Canon, and compilation all return via `getLatestCompilation`. |
| 8 | Browser back/forward | Navigating history changes the URL, the workspace follows the URL, and no stale project, stale edits, or stale errors remain. |
| 9 | Unauthorized project protection | Navigating to an unavailable/unauthorized project id exposes no protected data, preserves owner authorization, and shows the unavailable state. |
| 10 | Truthful states | Loading, failure, empty, and unavailable states each render truthfully and match actual system state. |

## Sign-off template

Record at `docs/release/signoff/<full-commit-sha>.md`:

```markdown
# Runtime Acceptance Sign-off

- Commit: <full-commit-sha>
- PR: #<number>
- Environment: <Convex deployment URL> · <Clerk application>
- Executed by: <name/handle>
- Date: <YYYY-MM-DD>

| # | Step | Result |
|---|------|--------|
| 1 | Create project | PASS |
| 2 | Direct navigation | PASS |
| 3 | Persisted workspace | PASS |
| 4 | Candidate creation | PASS |
| 5 | Canon approval | PASS |
| 6 | Compilation | PASS |
| 7 | Refresh persistence | PASS |
| 8 | Browser back/forward | PASS |
| 9 | Unauthorized project protection | PASS |
| 10 | Truthful states | PASS |

Notes: <observations, screenshots, or defects fixed>
```
