# GreenLight OS — Master System Blueprint

**Status:** Long-range architectural target. This document does not authorize immediate implementation of every subsystem.

This blueprint defines the complete machine GreenLight is becoming. It extends the existing `CONSTITUTION.md`, `KERNEL.md`, `CANON.md`, `INTELLIGENCE.md`, `COMPILER.md`, and `docs/ARCHITECTURE.md` without replacing them.

When this document conflicts with a governing repository document, the higher-authority document remains controlling until an explicit architectural decision changes repository truth.

---

## 1. Product definition

GreenLight is a private Creative Intelligence Operating System that converts developing creative intent into traceable, professional, production-ready artifacts while preserving creator authority.

Its purpose is not merely to generate text. It must help a creator:

- capture incomplete ideas without flattening them;
- discover and develop story structure;
- maintain characters, world rules, continuity, and emotional logic;
- make explicit Canon decisions;
- produce screenplays, series bibles, studio bibles, pitch packages, production documents, and delivery versions;
- preserve provenance from final artifact back to source material and creator decisions;
- collaborate with bounded intelligence systems without surrendering authorship.

The governing promise is:

> The system may interpret, propose, analyze, challenge, compile, and package. The creator alone determines project truth.

---

## 2. System lifecycle

```text
Creator Intent
      ↓
Universal Input
      ↓
Source Preservation
      ↓
Interpretation
      ↓
Candidate Graph
      ↓
Creative Development
      ↓
Creator Review
      ↓
Approved Canon
      ↓
Immutable Snapshot
      ↓
Artifact Compilation
      ↓
Quality and Readiness
      ↓
Frozen Delivery Version
      ↓
External Review
      ↓
Creator Decision
      ↓
New Canon / New Version
```

No stage may silently bypass Creator Review or mutate a historical delivery.

---

## 3. Architectural layers

### 3.1 Experience Layer

The creator-facing operating environment.

Responsibilities:

- conversation-first command surface;
- text, voice, image, document, and media intake;
- project navigation;
- live development workspace;
- Canon review;
- artifact preview;
- continuity and character inspection;
- progress, readiness, and Gold Path guidance;
- delivery and feedback management.

The Experience Layer does not own durable truth. It renders and operates authorized services.

### 3.2 Execution Kernel

The typed coordination layer between creator intent, domain intelligence, project context, and tool execution.

Responsibilities:

- reconstruct the creator's current objective;
- resolve project and workflow state;
- select bounded capabilities;
- assemble minimum necessary context;
- enforce authority and policy before execution;
- produce inspectable execution plans;
- validate outputs;
- route proposals into review rather than Canon;
- record provenance, confidence, uncertainty, and dependencies;
- return results to the correct interface surface.

The Execution Kernel is not an autonomous authority and does not become a parallel database.

### 3.3 Creative Intelligence Layer

Bounded expert domains operating through shared contracts.

Primary domains:

- Story Intelligence
- Character Intelligence
- World and Mythology Intelligence
- Dialogue Intelligence
- Emotional Intelligence
- Continuity Intelligence
- Research Intelligence
- Visual Intelligence
- Audio Intelligence
- Action and Stuntcraft Intelligence
- Production Intelligence
- Business and Packaging Intelligence
- Marketing and Audience Intelligence

Each domain receives bounded context and returns structured proposals, questions, analyses, warnings, and evidence-linked recommendations.

No domain receives direct authority to mutate Canon.

### 3.4 Canon and Memory Layer

The durable authorship and project-truth system.

Responsibilities:

- preserve original Fragments;
- store interpretation runs and Candidates;
- record creator decisions;
- maintain versioned project objects;
- maintain relationships and dependency links;
- create immutable Canon snapshots;
- preserve provenance and authorship history;
- calculate diffs and downstream impact;
- separate approved fact, proposal, inference, research, and unresolved uncertainty.

Convex remains the authoritative durable store unless a future ADR proves a replacement is necessary.

### 3.5 Compiler Layer

The deterministic transformation system that converts immutable snapshots into professional artifacts.

Responsibilities:

- screenplay compilation;
- series and studio bible compilation;
- character and world documentation;
- pitch and producer package compilation;
- production breakdown compilation;
- Fountain, FDX, PDF, and structured-data export;
- source-level provenance;
- structured warnings for missing information;
- protected creator overrides;
- staleness detection;
- quality-gate execution.

Compilation must never invent approved facts to create the appearance of completeness.

### 3.6 Delivery Layer

The historical and external-facing document system.

Responsibilities:

- freeze artifact versions;
- generate delivery rooms and packages;
- control recipient access;
- preserve what was sent;
- collect review notes;
- route feedback back to creator decisions;
- prevent external comments from directly altering Canon;
- generate new drafts after approved changes.

---

## 4. Execution Kernel contract

Every kernel execution should be representable by a typed record containing:

```text
ExecutionRequest
- creatorId
- projectId
- sessionId
- requestId
- rawInput
- reconstructedIntent
- requestedOutcome
- currentWorkflowStage
- authorityContext
- selectedCapabilities
- contextManifest
- constraints
- outputContract
```

```text
ExecutionResult
- requestId
- status
- proposals
- analyses
- questions
- warnings
- producedArtifacts
- provenance
- confidence
- uncertainty
- dependencies
- recommendedNextAction
- requiredCreatorDecision
```

Kernel rules:

1. Resolve identity and project authority before loading private context.
2. Use the smallest sufficient context package.
3. Select capabilities by contract, not by model personality.
4. Validate all model output before durable use.
5. Label inference and uncertainty.
6. Route proposed truth into Candidate state.
7. Never convert model output directly into Canon.
8. Record enough provenance to explain how the result was produced.
9. Fail closed when identity, authority, or project ownership is unclear.
10. Prefer reversible operations before destructive or expansive changes.

---

## 5. Agent and model system

GreenLight should treat models as replaceable execution providers behind capability contracts.

### 5.1 Roles

**Orchestrator**

- reconstructs intent;
- chooses workflow and capabilities;
- assembles context;
- validates completion.

**Domain Specialist**

- performs bounded analysis or generation;
- returns contract-compliant output;
- has no independent authority.

**Critic / Auditor**

- tests logic, continuity, emotional credibility, production feasibility, and policy compliance;
- cannot silently rewrite source output.

**Compiler**

- deterministic code path;
- consumes approved immutable data;
- is not replaced by free-form model generation.

**Repository Work Agent**

- implements approved code scope;
- begins from repository governance;
- audits before editing;
- verifies before reporting;
- never merges without creator authorization.

### 5.2 Routing principles

Model selection should consider:

- capability fit;
- context-window need;
- reasoning depth;
- multimodal requirement;
- latency;
- cost;
- privacy;
- determinism;
- tool support;
- historical performance on the task type.

The system should not route by brand loyalty. It should route by measured capability and current requirement.

### 5.3 Multi-agent collaboration

Collaboration must use explicit handoff records:

```text
AgentHandoff
- originatingCapability
- targetCapability
- objective
- suppliedContext
- excludedContext
- assumptions
- unresolvedQuestions
- expectedOutput
- completionCriteria
```

Agents do not converse indefinitely. The orchestrator controls turn count, scope, and completion.

---

## 6. Canonical domain model

The long-range domain model should support these conceptual entities without prematurely forcing each into a separate table.

### Project foundation

- User
- Project
- ProjectMembership
- ProjectPreference
- CreatorTasteProfile
- ProjectStatus

### Source and interpretation

- Fragment
- SourceAsset
- SourceVersion
- InterpretationRun
- Candidate
- CandidateEvidence
- CandidateRelationship

### Canon

- ProjectObject
- ProjectObjectVersion
- CanonEvent
- CanonDecision
- CanonSnapshot
- CanonSnapshotObject
- CanonDependency
- CanonConflict

### Story development

- Premise
- Theme
- Character
- Relationship
- WorldRule
- Location
- Prop
- Lore
- PlotThread
- Beat
- Scene
- Sequence
- Episode
- Act
- Season
- DialogueIntent
- EmotionalState
- CharacterArc
- ContinuityFact
- OpenQuestion

### Production intelligence

- ProductionRequirement
- DepartmentRequirement
- StuntRequirement
- SafetyConcern
- CulturalConsultationNeed
- ClearanceNeed
- ScheduleAssumption
- BudgetAssumption
- LocationRequirement
- CastingRequirement

### Compilation and delivery

- CompilationRun
- CompiledDocument
- CompiledSection
- SectionSource
- QualityGateRun
- QualityGateResult
- DocumentVersion
- ExportJob
- DeliveryRoom
- DeliveryRoomDocument
- ReviewNote
- ReviewDecision

### System execution

- ExecutionRequest
- ExecutionRun
- CapabilityInvocation
- ModelInvocation
- ContextManifest
- ToolInvocation
- ExecutionArtifact
- ExecutionError

The existing polymorphic `ProjectObject` remains the preferred durable story-domain representation until actual access patterns justify further normalization.

---

## 7. Context system

The context system must avoid sending an entire project to every model invocation.

### Context layers

**Immediate context**

- current user request;
- active object or document;
- current workflow stage;
- recent creator decisions.

**Relevant Canon context**

- approved objects directly related to the task;
- dependency-linked facts;
- applicable rules and constraints.

**Historical context**

- earlier versions;
- rejected or deferred alternatives;
- prior analyses;
- creator feedback.

**Global project context**

- premise;
- tone;
- audience;
- format;
- creative laws;
- project-specific preferences.

Each execution records a `ContextManifest` identifying what was included, why it was included, and what was intentionally excluded.

---

## 8. Creator Taste Profile

The Creator Taste Profile is advisory context, not Canon.

It may capture demonstrated preferences such as:

- tonal range;
- pacing;
- ambiguity tolerance;
- dialogue density;
- visual intensity;
- emotional pressure;
- preferred character complexity;
- aversions and recurring corrections;
- production ambition;
- formatting and presentation standards.

Taste signals must be:

- evidence-linked;
- editable;
- reversible;
- project-overridable;
- distinguishable from explicit instructions.

The system must never use an inferred preference to override a current creator instruction.

---

## 9. Gold Path Navigator

The Gold Path Navigator tells the creator what is complete, what is weak, what is blocked, and what action has the highest leverage.

It should calculate readiness across:

- premise clarity;
- protagonist clarity;
- character motivation;
- conflict architecture;
- world-rule coherence;
- plot causality;
- emotional progression;
- continuity;
- screenplay completeness;
- production feasibility;
- package completeness;
- provenance coverage;
- unresolved decisions.

A readiness score is never a claim of artistic quality. It is an explainable workflow diagnostic composed of visible criteria, evidence, and unresolved gaps.

---

## 10. Quality architecture

Quality evaluation should use separate lenses rather than one opaque score.

Required lenses:

- Canon integrity
- Structural completeness
- Causal coherence
- Character consistency
- Emotional credibility
- Dialogue function
- Continuity
- Theme integration
- Visual storytelling
- Production realism
- Safety and clearance routing
- Cultural consultation routing
- Formatting compliance
- Provenance completeness
- External presentation readiness

Every finding should state:

- severity;
- affected object or section;
- evidence;
- rationale;
- recommended correction;
- whether correction requires creator approval.

No automated gate may claim certification in legal, safety, cultural, budget, scheduling, or professional-union matters.

---

## 11. UI operating model

GreenLight should feel like one intelligent workspace rather than a collection of disconnected forms.

### Primary surfaces

**Command Deck**

- project orientation;
- active objective;
- recent changes;
- next best action;
- system readiness;
- agent activity.

**Universal Input**

- conversation;
- voice;
- files;
- images;
- screenshots;
- notes;
- pasted material.

**Development Workspace**

- conversational development;
- current project state;
- proposed changes;
- creator decisions;
- contextual documents.

**Canon Vault**

- approved truth;
- versions;
- provenance;
- conflicts;
- unresolved questions.

**Living Bible**

- characters;
- arcs;
- world;
- mythology;
- themes;
- chronology;
- relationships;
- production-facing detail.

**Artifact Chamber**

- screenplay and document preview;
- section-level sources;
- warnings;
- protected edits;
- compilation status;
- export.

**Delivery Room**

- frozen versions;
- recipients;
- review notes;
- creator responses;
- version history.

The dark, suspended, spatial interface is an experiential layer. It must not reduce accessibility, text legibility, keyboard use, or document-editing precision.

---

## 12. Security and authority model

Core requirements:

- every durable operation has an authenticated actor;
- project access is checked server-side;
- client-supplied authorship is never trusted;
- external-recipient access is separately scoped from creator accounts;
- model providers receive only necessary context;
- private project content is never used outside authorized execution;
- tool access is capability-scoped;
- destructive actions require explicit intent;
- execution and delivery events are auditable;
- secrets and provider credentials never enter project Canon or model context.

---

## 13. Observability and evaluation

The system must be measurable without turning creative work into vanity metrics.

Operational measures:

- execution success rate;
- validation failure rate;
- tool failure rate;
- latency by capability;
- cost by capability;
- context size;
- retry count;
- authorization denials;
- compiler determinism;
- provenance coverage;
- reload and persistence reliability.

Creative-assistance measures:

- creator acceptance rate of proposals;
- edit distance before approval;
- recurring rejection causes;
- contradiction detection accuracy;
- missing-context detection accuracy;
- creator-reported usefulness;
- time from idea to approved artifact;
- number of unresolved blockers surfaced before export.

These measurements optimize assistance. They do not rank the creator or declare art objectively good.

---

## 14. API boundaries

GreenLight should preserve four explicit boundaries:

### Experience API

Operations used by the creator interface.

### Kernel API

Transport-neutral execution requests and structured results.

### Capability API

Typed contracts for intelligence and tool capabilities.

### Compiler API

Deterministic snapshot-to-artifact functions.

A model provider SDK must never become the domain architecture. Provider code belongs behind adapters.

---

## 15. Implementation sequence

Implementation must remain milestone-driven.

### Stage A — Durable vertical slice

- production persistence only;
- reload rehydration;
- authorization isolation;
- authoritative compilation;
- frozen delivery versions;
- no fixture masquerading as production state.

### Stage B — Conversation-first creator workspace

- universal conversational input;
- project-aware context;
- explicit proposal review;
- persistent session continuity;
- Gold Path navigation.

### Stage C — Canon graph and Living Bible

- dependency-aware project objects;
- characters, arcs, continuity, world, and chronology;
- impact analysis;
- unresolved-question management.

### Stage D — Professional artifact system

- screenplay compiler maturity;
- studio and series bibles;
- pitch and producer packages;
- production breakdowns;
- high-quality export and presentation.

### Stage E — Execution Kernel and model routing

- transport-neutral execution API;
- bounded capability registry;
- model adapters;
- context manifests;
- validation and observability;
- multi-capability handoffs.

### Stage F — Production and delivery intelligence

- department routing;
- stunt and action design;
- production assumptions;
- external review workflows;
- versioned delivery rooms.

No later stage should be used to avoid completing the durable foundations of an earlier stage.

---

## 16. Non-goals and stop conditions

Do not build:

- autonomous agents with independent project authority;
- a second source of project truth;
- a speculative graph database without demonstrated need;
- hidden Canon mutation;
- model-generated professional claims presented as certified fact;
- UI spectacle that obscures creator control;
- provider-specific architecture;
- broad ontology expansion without real access patterns;
- automatic delivery or merge decisions without creator authorization.

Stop and request a decision when:

- two governing documents conflict;
- a proposed feature changes creator authority;
- a new durable system duplicates Convex state;
- external-recipient identity must be modeled;
- a model output would become Canon without review;
- a milestone requires a major schema replacement;
- professional certification or legal authority is implied;
- implementation scope expands beyond the approved objective.

---

## 17. Definition of the finished machine

GreenLight OS is functioning as intended when a creator can enter with a fragment of an idea and, through one continuous trusted environment:

1. preserve the original expression;
2. develop the story with specialized intelligence;
3. understand every recommendation and its evidence;
4. approve only the truth they choose;
5. maintain coherent characters, world, continuity, and emotional logic;
6. compile professional screenplays and production-facing documents;
7. trace every factual artifact element to approved sources;
8. freeze and deliver historical versions safely;
9. receive feedback without surrendering Canon authority;
10. return later and continue with the full project state intact.

That is the system target. Every milestone should make this machine more real without violating the authority, provenance, and durability laws that make it trustworthy.
