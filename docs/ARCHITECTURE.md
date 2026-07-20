# Production Intelligence Compiler architecture

## Invariants

1. A compilation always reads an immutable canon snapshot, never the live graph.
2. Every factual content block points to a source object version and optional field.
3. Generated connective prose has `origin: "generated"` and `inference: true`.
4. User edits are overlays. Regeneration never destroys either the generated version or a protected override.
5. Extracted production requirements are recommendations until a human production team confirms them.
6. A delivered document version is frozen. Later corrections produce impact reports and new drafts, not mutations to historical delivery.
7. External review notes remain pending until the creator records a decision.

## Data flow

```text
Fragments and user material
        ↓ translation / approval
Versioned project objects
        ↓ immutable snapshot
CanonSnapshot
        ├──→ Screenplay compiler ──→ typed scenes/elements ──→ Fountain / FDX / PDF
        ├──→ Profile section builders
        │            ↓
        │    CompiledDocumentSections
        │            ├── source refs
        │            ├── structured data
        │            ├── generated prose
        │            └── protected overrides
        ├──→ Production requirement extraction ──→ department packets
        └──→ Quality gates ──→ approval ──→ frozen DocumentVersion ──→ Delivery Room
```

## Canon and provenance

`ProjectObject` is a discriminated union for characters, relationships, scenes, locations, props, world rules, lore, themes, laws, beats, human mechanics, production notes, knowledge facts, decisions, and raw fragments. Each object carries a version, truth status, authorship origin, and upstream source references.

Compilation profiles contain ordered section definitions. Each builder is a pure function of `(CanonSnapshot, CompileContext)`. Missing information becomes a structured warning; builders do not invent facts to fill a professional-looking page.

## Staleness and historical delivery

Snapshot diffs operate at object-field level. A section is stale when a field it cites changes, potentially stale when another field on a cited object changes, conflicted when a source is removed, and awaiting approval when a protected edit sits over changed sources.

Convex stores active documents and frozen `documentVersions` separately. `deliveryRoomDocuments` points to the frozen version, never to the mutable draft. This is the persistence-level guarantee behind “preserve the package we sent last week.”

## Quality gates

The gate runner evaluates canon, completeness, continuity, story, production, cultural review, formatting, provenance, external readiness, and confidentiality. Warnings remain visible. A failed gate can only be passed through correction or an explicit recorded override with actor, reason, and timestamp.

The cultural gate is a routing mechanism for human consultation, never an automated certification claim. Cost, schedule, clearance, and safety conclusions are likewise outside the compiler’s authority.

## UI state boundary

Zustand stores only ephemeral chamber controls such as selected section, inspector tab, audience, and preview mode. Persistent project, canon, document, delivery, and review state belongs to Convex. TanStack Query is configured for future non-Convex service adapters; Convex realtime subscriptions remain the source for persistent domain data.

The Three.js field is ambient navigation context. Its render loop stays within React Three Fiber’s imperative frame callback and opts out of React Compiler memoization. The document editor itself uses conventional accessible HTML controls.

## Corner assistant

`src/assistant/` is a thin control surface, not a parallel orchestration layer. `commands.ts` is a pure, framework-free interpreter that maps phrasing onto an injected `AssistantActions` interface; the React component wires those actions to the router, the Zustand stores, and the export adapters. Readiness answers are computed on demand from the same compiler and gate modules the Chamber uses — never restated from cached copy.

Boundaries the assistant must keep:

1. It operates interface state and exports only. It has no write path into canon, documents, or delivery records.
2. Replies are deterministic and labeled as such in the panel. No output pretends to be model-generated.
3. Voice input (`SpeechRecognition`) and spoken replies (`speechSynthesis`) are progressive enhancements; every capability is reachable by keyboard and text.
4. A future model-backed conversational layer plugs in behind the same `AssistantActions` interface and the kernel service boundary, keeping tool authority typed and inspectable.
