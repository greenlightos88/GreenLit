# Implementation Milestone 1 — Idea to Canon to Artifact

## Objective

Deliver GreenLight's first complete creator-facing vertical slice:

```text
Fragment
  ↓
Interpreter
  ↓
Candidate
  ↓
Creator Review
  ↓
Canon Event
  ↓
Immutable Snapshot
  ↓
Compilation
```

A creator must be able to enter a raw idea, inspect GreenLight's interpretation, approve or reject proposed project truth, and compile a professional artifact derived only from creator-approved Canon.

## Constitutional Constraints

1. Original Fragments are preserved before interpretation.
2. Interpreter output is Candidate state, never Canon.
3. AI has no direct Canon write path.
4. Every Candidate exposes origin, evidence, explanation, confidence, and uncertainty.
5. Creator approval is explicit, attributable, and auditable.
6. Compilers consume immutable Canon snapshots.
7. Missing facts remain visible gaps; the system does not invent polish.
8. Convex owns durable state. Client stores own ephemeral interface state only.

## Required Product Flow

### 1. Capture

The creator opens a project and submits a text Fragment.

The Fragment stores:

- project identity;
- exact source text;
- source type;
- creator identity;
- creation timestamp;
- provenance metadata;
- immutable source version.

### 2. Interpret

A replaceable `Interpreter` interface accepts a Fragment and bounded Canon context.

Initial implementation may be deterministic. Persistence and review logic must not depend on the interpreter implementation.

The interpreter returns structured Candidate proposals.

### 3. Review

The creator sees each proposal with:

- proposed object type;
- proposed fields;
- explanation;
- evidence references;
- origin classification;
- confidence;
- uncertainty;
- downstream impact where available.

Allowed decisions:

- approve;
- edit and approve;
- reject;
- defer.

### 4. Canonize

Approval creates an immutable Canon Event and a new versioned project object.

Reject and defer decisions remain auditable but cannot affect Canon or compilation.

### 5. Snapshot

The creator creates an immutable Canon Snapshot containing the approved object versions required by the selected compilation profile.

### 6. Compile

The existing compiler consumes the snapshot and produces at least one professional artifact with provenance and visible warnings.

## Initial Candidate Types

The first implementation should support a deliberately narrow set:

- project premise;
- character;
- relationship;
- location;
- story beat;
- theme;
- world rule;
- production note.

Do not expand the ontology until the full vertical slice works.

## Domain Contracts

```ts
export interface InterpreterInput {
  fragmentId: string;
  fragmentText: string;
  projectId: string;
  canonContext: readonly CanonContextItem[];
}

export interface CandidateProposal {
  candidateType: CandidateType;
  proposedObject: unknown;
  explanation: string;
  evidence: readonly EvidenceRef[];
  origin: "extracted" | "inferred" | "generated";
  confidence: number;
  uncertainty: readonly string[];
}

export interface Interpreter {
  interpret(input: InterpreterInput): Promise<readonly CandidateProposal[]>;
}
```

The actual implementation must use repository-native identifiers and validators.

## Persistence Requirements

Durable records must include:

- Fragments;
- interpretation runs;
- Candidates;
- review decisions;
- Canon Events;
- resulting project object versions;
- Canon Snapshots;
- compilation linkage.

All project-scoped reads and writes must pass the existing authentication and owner authorization boundary.

## UI Requirements

The first interface should be direct and functional:

1. Fragment composer;
2. interpretation status;
3. Candidate review cards;
4. editable proposed fields;
5. approve, reject, and defer actions;
6. approved Canon summary;
7. snapshot and compile action;
8. compiled artifact preview with provenance.

Do not lead with a speculative spatial interface. Prove the creator workflow first.

## Testing Requirements

- interpreter contract tests;
- Fragment preservation tests;
- Candidate creation tests;
- authorization tests;
- no-direct-Canon-write tests;
- approve/edit/reject/defer transition tests;
- idempotency tests;
- immutable snapshot tests;
- compiler integration test from approved Canon;
- provenance survival test from Fragment to compiled block.

## Acceptance Criteria

The milestone is complete only when:

1. a signed-in creator can submit a Fragment;
2. the exact source remains preserved;
3. at least one Candidate is produced through the Interpreter interface;
4. the creator can review and decide each Candidate;
5. only approved Candidates create Canon;
6. an immutable snapshot can be created;
7. the compiler produces a professional artifact from that snapshot;
8. every compiled fact traces back through Canon and Candidate evidence to the source Fragment;
9. another user's project cannot be read or mutated;
10. `bun run check` and `bun run audit` pass.

## Deliberate Non-Goals

- autonomous multi-agent infrastructure;
- Graphiti integration;
- a separate Intent Engine;
- multimodal ingestion;
- production scheduling or budgeting automation;
- broad ontology redesign;
- replacing the existing `ProjectObject` model without an ADR.
