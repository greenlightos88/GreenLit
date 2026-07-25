# GreenLight Canon

## Core Law

```text
AI proposes.
AI explains.
The creator decides.
Only approval changes Canon.
```

## Fragment

A Fragment is preserved source material: a note, line, image, voice memo, reference, scene, question, document, observation, or incomplete thought.

Fragments remain traceable to their origin and are not silently rewritten by interpretation.

## Candidate

A Candidate is a proposed addition, correction, relationship, interpretation, classification, contradiction resolution, or structured project object awaiting creator review.

A Candidate is not Canon.

## Approval Decision

A Canon event records an explicit creator decision to approve, edit and approve, reject, defer, or supersede a Candidate.

The decision must remain attributable and auditable.

## Canon

Canon is the durable, creator-approved project truth used by downstream systems.

Every canonical object should preserve:

- object identity and type;
- version;
- authorship origin;
- evidence references;
- provenance;
- approval history;
- truth status;
- relevant dependencies.

## Immutable Snapshot

A Canon Snapshot is a frozen, internally consistent view of approved project truth at a specific point in time.

Compilers consume snapshots, not mutable live state.

## Origin

Origin categories should distinguish at minimum:

- creator-authored;
- extracted;
- inferred;
- generated;
- imported;
- externally reviewed.

Origin does not determine truth. Approval does.

## Confidence and Uncertainty

Confidence measures an interpreter's assessment, not truth.

A high-confidence inference still requires creator approval. Uncertainty, missing evidence, ambiguity, and contradiction must remain visible.

## Review Lifecycle

```text
Proposed
   ↓
Explained
   ↓
Under Review
   ├── Approved
   ├── Edited and Approved
   ├── Rejected
   └── Deferred
```

Rejected Candidates remain available for audit where appropriate but cannot affect Canon or compilation.

## Contradictions

Contradictions should be surfaced as explicit review items with competing evidence and impact information. GreenLight must not silently resolve them.

## Structural Diffs and Staleness

Snapshot diffs operate at object and field level.

A compiled section may become:

- stale when a cited field changes;
- potentially stale when another field on a cited object changes;
- conflicted when a source is removed;
- awaiting approval when a protected override sits over changed sources.

## Historical Delivery

Delivered versions are frozen historical records. Later Canon corrections produce impact reports and new versions rather than modifying what was previously delivered.

## Authorization

Every durable Canon write must be:

- authenticated;
- authorized;
- attributable;
- auditable;
- routed through an explicit creator decision.
