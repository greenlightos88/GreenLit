# Runtime Acceptance Checklist

Run this checklist against the exact release-candidate commit in a real authenticated environment with working Clerk and Convex services.

## Required workflow

| # | Step | Pass condition |
|---|---|---|
| 1 | Create project | A persisted project appears in the authenticated owner's project list. |
| 2 | Direct navigation | `/develop?project=<id>` loads that exact authorized project. |
| 3 | Persisted workspace | Candidate, Canon, and compilation state come from Convex rather than browser-only authority. |
| 4 | Candidate creation | Candidate proposals persist successfully. |
| 5 | Canon approval | Approval and edit-approval persist authoritative Canon. |
| 6 | Compilation | Snapshot and compile produce a persisted authoritative document. |
| 7 | Refresh | Project, Canon, and latest compilation restore after a full refresh. |
| 8 | Browser history | Back/Forward updates the workspace to match the URL with no stale project, edits, or errors. |
| 9 | Unauthorized ID | No protected data is exposed and the unavailable state is truthful. |
| 10 | State integrity | Loading, empty, failure, and unavailable states reflect actual system state. |

A single failure blocks release. Fix only the demonstrated defect, rerun affected automated checks, then repeat the complete runtime checklist.

## Sign-off format

Create `docs/release/signoff/<full-commit-sha>.md` containing all fields below:

```markdown
# Runtime Acceptance Sign-off

- Commit: <full-commit-sha>
- PR: #<number>
- Environment: <non-secret environment identifier>
- Executed by: <name or handle>
- Date: <YYYY-MM-DD>
- Last-known-good commit: <full-commit-sha>

| # | Step | Result |
|---|---|---|
| 1 | Create project | PASS |
| 2 | Direct navigation | PASS |
| 3 | Persisted workspace | PASS |
| 4 | Candidate creation | PASS |
| 5 | Canon approval | PASS |
| 6 | Compilation | PASS |
| 7 | Refresh | PASS |
| 8 | Browser history | PASS |
| 9 | Unauthorized ID | PASS |
| 10 | State integrity | PASS |

Notes: <observations and evidence locations>
```

Do not include secrets, private keys, tokens, or full credential values in the sign-off.
