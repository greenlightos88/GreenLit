# Delegation Protocol

## Required Assignment

Every delegated task must contain:

- **Objective:** one observable outcome.
- **Authority:** governing files and decisions.
- **Inputs:** exact files, symbols, issue, or workflow to inspect.
- **Allowed write set:** explicit paths or `none`.
- **Prohibited actions:** scope, architecture, dependency, and data constraints.
- **Deliverable:** patch, findings, decision proposal, or verification report.
- **Evidence:** checks, references, and results required.
- **Stop conditions:** uncertainty or failure requiring escalation.

## Rules

1. One task has one accountable owner.
2. Do not assign overlapping write sets in parallel.
3. Research and verification roles are read-only unless explicitly reassigned.
4. Specialists may recommend adjacent work but may not perform it without authorization.
5. Returned claims must distinguish observed fact, inference, and recommendation.
6. The lead accepts, revises, or rejects every result before integration.

## Return Format

```text
STATUS: complete | blocked | partial
SUMMARY: maximum five sentences
CHANGED: exact paths or none
EVIDENCE: commands/checks and outcomes
RISKS: unresolved risks or none
DECISIONS NEEDED: explicit decisions or none
NEXT: smallest justified next action
```

Long reasoning transcripts are not deliverables.