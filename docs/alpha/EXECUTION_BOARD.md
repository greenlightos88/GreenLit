# GreenLight Alpha — Vertical Slice Execution Board

Status: Active execution plan  
Owner: Creator  
Target: Demonstrable Alpha 0.1

## Mission

Build the smallest complete GreenLight workflow that proves the product is real.

A developer must be able to clone the repository, run the application, create or open a project, develop approved creative truth, compile a durable output, refresh the browser, and continue from the same persisted state.

The Alpha is not complete when every planned feature exists. It is complete when the end-to-end demonstration is reliable, legible, and technically credible.

## Governing Product Test

Every proposed issue, branch, pull request, and architectural change must answer at least one of these questions:

1. Does this make the Alpha demonstration work?
2. Does this make the Alpha easier for another engineer to understand or extend?
3. Does this remove a concrete risk to persistence, truth, compilation, or reproducibility?

Work that answers none of these questions is deferred.

## Demo Promise

A reviewer should be able to perform this workflow without hidden setup or fabricated state:

1. Install dependencies with Bun.
2. Launch the application.
3. Open the development workspace.
4. Create or load a project.
5. Enter a meaningful creative instruction.
6. Review the resulting candidate change.
7. Approve the change into authoritative project state.
8. Compile the project.
9. Inspect the persisted result and its provenance.
10. Refresh the browser.
11. Resume from the same project, approved state, and compilation.

## Alpha Definition of Done

The vertical slice is accepted only when all of the following are true:

- `bun install` succeeds from a clean clone.
- the documented development command launches the application.
- the primary workflow contains no production fixture dependency.
- the `/develop` route rehydrates from persistence.
- a project can be created or selected through the application.
- a creator instruction produces a structured candidate rather than an invisible mutation.
- candidate approval creates authoritative state with provenance.
- compilation reads authoritative persisted state.
- the compilation result is persisted and reloadable.
- refresh preserves the project, approved state, and compilation.
- loading, empty, error, and success states are visible.
- the repository includes a concise setup and demo path.
- automated verification covers the critical end-to-end path at the strongest practical level.

## Current Critical Path

The shortest route to Alpha is:

`Boot -> Persistent Project -> /develop Rehydration -> Candidate Review -> Approval -> Authoritative Compilation -> Reload Verification -> Demo Documentation`

No parallel feature expansion should interrupt this path unless it resolves a blocker.

## Workstream A — Reliable Boot

### Outcome

A new contributor can run GreenLight without repository archaeology.

### Required work

- verify Bun version and package-manager declarations.
- verify the canonical local development command.
- eliminate undocumented environment assumptions.
- provide useful failures for missing configuration.
- ensure the initial route resolves to a functioning product surface.

### Acceptance evidence

- clean-clone installation log.
- successful local launch.
- concise setup documentation.

## Workstream B — Persistence-Backed Project Flow

### Outcome

The creator works against durable projects rather than fixtures or ephemeral client state.

### Required work

- identify and remove remaining production fixture paths.
- establish the authoritative project query for `/develop`.
- support deterministic loading, empty, unavailable, and error states.
- ensure project creation or selection resolves to a persisted project identifier.
- prevent the UI from presenting non-persisted state as authoritative.

### Acceptance evidence

- create or open a project.
- refresh and observe the same project.
- inspect storage and confirm a single authoritative record.

## Workstream C — Development Workspace Rehydration

### Outcome

The primary creator workspace reconstructs itself from persisted state.

### Required work

- load project metadata from the backend.
- load authoritative creative state and current compilation.
- restore the selected project and relevant workspace state.
- distinguish server truth from temporary interface state.
- make stale, missing, and failed reads visible.

### Acceptance evidence

- enter `/develop` directly by URL.
- reload repeatedly without losing project truth.
- open the same project in a new session and observe equivalent authoritative state.

## Workstream D — Candidate Review and Approval

### Outcome

Creator instructions can change the project only through an explicit review boundary.

### Required work

- represent proposed changes as structured candidates.
- display candidate content and provenance.
- support approve, reject, and edit paths.
- ensure approval is explicit and authorization-checked.
- preserve rejected or superseded evidence when useful without treating it as Canon.

### Acceptance evidence

- submit one creative instruction.
- review a visible candidate.
- approve it.
- verify that authoritative state changes once and records provenance.

## Workstream E — Authoritative Compilation

### Outcome

Compilation produces a durable project artifact from approved persisted state.

### Required work

- compile from the authoritative project snapshot.
- reject or visibly fail compilation when required state is unavailable.
- persist the compilation request, input identity, output, status, and provenance.
- display the latest authoritative compilation in the workspace.
- prevent fixture or browser-only state from becoming the compilation source.

### Acceptance evidence

- approve a project change.
- compile.
- inspect the resulting output.
- refresh and observe the same persisted compilation.

## Workstream F — Execution Visibility

### Outcome

A developer can understand what happened without guessing.

### Required work

- expose operation status for load, candidate creation, approval, and compilation.
- retain identifiers that connect creator action, execution, source state, and output.
- provide clear user-facing failures.
- make hidden mutations impossible in the Alpha path.

### Acceptance evidence

- follow one instruction from input through candidate, approval, and compilation.
- identify the source project state and resulting output.

## Workstream G — Verification

### Outcome

The demonstration is reproducible rather than dependent on one successful manual run.

### Required work

- test persistence queries and mutations involved in the Alpha path.
- test authorization boundaries for project reads, approvals, and compilation.
- test direct `/develop` rehydration.
- test refresh survival.
- add one automated end-to-end or integration-level happy path covering the critical workflow.
- document any intentionally manual verification.

### Acceptance evidence

- green automated checks.
- recorded manual demo checklist.
- no known critical-path failure hidden behind fixture data.

## Workstream H — Demonstration Package

### Outcome

Another developer or investor can understand the product quickly.

### Required work

- create `docs/alpha/DEMO.md` with an exact five-to-ten-minute script.
- document setup, expected behaviour, and known limitations.
- include one representative project scenario.
- describe what is implemented versus specified.
- avoid claims that exceed demonstrated behaviour.

### Acceptance evidence

A new reviewer can run the demo using repository instructions alone.

## Priority Order

### P0 — Must complete before any Alpha claim

1. Remove fixture-backed production workflow.
2. Complete persistence-backed `/develop` rehydration.
3. Verify project state survives refresh.
4. Verify authoritative compilation survives refresh.
5. Add critical-path verification.
6. Publish exact setup and demo instructions.

### P1 — Required for a convincing demonstration

1. Candidate review and explicit approval.
2. Provenance visibility.
3. coherent loading, empty, failure, and success states.
4. polished primary workflow with no dead controls.

### P2 — Deferred until the vertical slice is reliable

- broad multi-agent orchestration.
- generalized plugin systems.
- complex spatial or node interfaces.
- comprehensive creative-domain coverage.
- collaboration and organization management.
- production-scale optimization unrelated to the demo path.

## Pull Request Contract

Every Alpha pull request must state:

- the exact demo capability improved.
- the authoritative source of truth affected.
- the persistence impact.
- the authorization impact.
- the verification performed.
- the known limitations.
- the rollback or failure behaviour where relevant.

A pull request should be rejected or reduced when it:

- introduces a second source of truth.
- hides a mutation.
- expands scope beyond the critical path without removing a blocker.
- presents fixtures as product behaviour.
- adds architecture without an identified Alpha consumer.
- leaves a visible control non-functional.

## Immediate Implementation Milestone

### Milestone: Persistence-Complete `/develop`

This is the next bounded implementation target.

#### Scope

- remove remaining fixture-backed reads from the production `/develop` path.
- load the active project from persistence.
- load the current authoritative compilation from persistence.
- present loading, empty, unavailable, and failure states.
- preserve authorization boundaries.
- verify direct navigation and refresh rehydration.

#### Out of scope

- redesigning the entire interface.
- adding new creative engines.
- broad agent orchestration.
- expanding document types.
- speculative schema rewrites not required by the target.

#### Acceptance test

1. Start from a clean application session.
2. Create or select a persisted project.
3. Open `/develop`.
4. Observe persisted project data.
5. perform the currently supported authoritative compilation flow.
6. refresh the browser.
7. observe the same project and compilation.
8. verify no production fixture supplied the displayed state.

## Status Reporting

Use only these states:

- `BLOCKED` — cannot proceed without an explicit dependency or decision.
- `READY` — bounded and ready for implementation.
- `IN PROGRESS` — actively being implemented on a named branch.
- `VERIFYING` — implementation complete; acceptance evidence in progress.
- `DONE` — acceptance criteria demonstrated and merged.

Current status:

| Capability | Status | Evidence required |
| --- | --- | --- |
| Clean boot | VERIFYING | clean clone and launch |
| Persistent project | IN PROGRESS | create/open/reload |
| `/develop` rehydration | IN PROGRESS | direct navigation and refresh |
| Candidate review | READY | visible approve/reject flow |
| Authoritative compilation | VERIFYING | persisted input/output identity |
| Reload survival | IN PROGRESS | project and compilation retained |
| Execution visibility | READY | traceable operation identifiers |
| Critical-path verification | READY | automated integration or E2E path |
| Demo documentation | READY | reviewer completes demo unaided |

## Completion Rule

GreenLight Alpha 0.1 may be described as operational only after the complete demo promise succeeds from a clean clone and survives refresh without relying on production fixtures.

Until then, describe the repository accurately as an actively implemented vertical slice with established architecture and partial operational capability.