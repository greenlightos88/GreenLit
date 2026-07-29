# GreenLight OS Context Assembly Specification

Status: Proposed architecture contract
Version: 1.0

## Purpose

The Context Assembly system supplies each execution with the smallest authoritative set of information required to complete the creator's current objective correctly.

It must not send an entire project to a model by default. It must construct a bounded, explainable, provenance-preserving context package from the creator request, approved Canon, relevant Fragments, prior decisions, active workflow state, and permitted creator preferences.

Context Assembly advises execution. It does not own Canon, mutate project truth, or invent missing facts.

## Governing invariants

1. Approved Canon outranks inferred, generated, historical, and unreviewed material.
2. Fragments are evidence, not Canon.
3. Candidates remain proposals until explicit creator approval.
4. Every included factual item retains its source identity, version, truth status, and provenance.
5. Generated summaries never replace their underlying sources.
6. The creator's current instruction outranks stored preferences.
7. Context must be sufficient for the objective but no broader than necessary.
8. Sensitive or restricted material is excluded unless the execution is authorized to access it.
9. Missing information is surfaced explicitly; Context Assembly must not fill gaps by invention.
10. Every context package is reproducible from its recorded inputs and policy version.

## Position in the execution lifecycle

```text
Creator action
    ↓
ExecutionRequest
    ↓
Authorization preflight
    ↓
Intent normalization
    ↓
Context Assembly
    ↓
Capability routing
    ↓
Model or tool execution
    ↓
Validation and verification
    ↓
Creator review or authorized persistence
```

## Inputs

Context Assembly receives a typed request containing at minimum:

```ts
interface ContextAssemblyRequest {
  executionId: string;
  projectId: string;
  actorId: string;
  objective: ExecutionObjective;
  requestedCapabilities: CapabilityId[];
  targetObjectIds?: string[];
  activeSurface?: SurfaceDescriptor;
  userMessage?: string;
  constraints?: ExecutionConstraints;
  tokenBudget?: TokenBudget;
  authorityScope: AuthorityScope;
}
```

The assembler may read only from authorized sources, including:

- approved Canon and immutable Canon snapshots;
- relevant Fragments and source versions;
- Candidate proposals when the objective explicitly concerns review or comparison;
- durable creator decisions;
- continuity records;
- project-level open questions;
- current document, scene, character, location, or production-object state;
- previous execution outputs when explicitly linked and still valid;
- creator preference signals permitted for the current task;
- external research with provenance and freshness metadata;
- ephemeral interface state required to understand the current surface.

## Output contract

```ts
interface ContextPackage {
  id: string;
  executionId: string;
  projectId: string;
  objective: NormalizedObjective;
  policyVersion: string;
  assembledAt: number;
  budget: ContextBudgetReport;
  authority: AuthoritySummary;
  sections: ContextSection[];
  exclusions: ContextExclusion[];
  gaps: ContextGap[];
  warnings: ContextWarning[];
  retrievalTrace: RetrievalTraceEntry[];
  digest: string;
}
```

Each section must identify why it exists:

```ts
interface ContextSection {
  id: string;
  kind:
    | "current_instruction"
    | "active_work"
    | "canon"
    | "fragment_evidence"
    | "candidate"
    | "decision"
    | "continuity"
    | "relationship"
    | "production"
    | "creator_preference"
    | "research"
    | "prior_execution"
    | "constraint";
  relevanceReason: string;
  priority: ContextPriority;
  items: ContextItem[];
  estimatedTokens: number;
}
```

Every context item must preserve authority and provenance:

```ts
interface ContextItem {
  sourceId: string;
  sourceVersion?: number;
  sourceType: string;
  truthStatus: TruthStatus;
  origin: AuthorshipOrigin;
  content: unknown;
  fieldRefs?: string[];
  confidence?: number;
  freshness?: FreshnessMetadata;
  accessClassification?: AccessClassification;
}
```

## Assembly stages

### 1. Normalize the objective

Convert the creator's action into a bounded objective without broadening it.

The normalized objective must state:

- requested outcome;
- target objects or workflow stage;
- permitted operation type;
- required deliverable or response shape;
- explicit constraints;
- ambiguity requiring clarification;
- whether durable mutation is requested.

### 2. Perform authority filtering

Before relevance scoring, remove any source the actor or execution capability is not authorized to access.

Authorization must be derived server-side. Client-supplied identity, authorship, project ownership, or access scope is never trusted.

### 3. Seed mandatory context

Mandatory context is included before semantic retrieval:

- the creator's current instruction;
- the normalized objective;
- active target objects;
- governing constraints;
- current Canon versions directly referenced by the target;
- unresolved conflicts attached to the target;
- required output contract.

### 4. Expand the dependency graph

Follow typed relationships only as far as needed.

Examples:

- scene → characters → relevant character-state fields;
- scene → location → continuity and production constraints;
- character → relationships → only relationships active in the objective;
- Canon object → source Fragment → only when provenance or interpretation is needed;
- compiled section → cited Canon fields → staleness analysis;
- production change → affected departments, schedule, safety, props, wardrobe, VFX, and continuity.

Graph expansion must have explicit depth and fan-out limits.

### 5. Retrieve semantically relevant evidence

Semantic retrieval supplements typed relationships; it does not override them.

Candidates are scored using:

- direct target relationship;
- objective relevance;
- Canon authority;
- recency and active-version status;
- explicit creator reference;
- unresolved continuity impact;
- prior decision dependency;
- semantic similarity;
- information uniqueness;
- estimated token cost.

### 6. Resolve conflicts and duplication

When multiple sources describe the same fact:

1. current approved Canon wins;
2. current explicit creator instruction wins over stored preference;
3. newer approved object versions win over superseded versions;
4. conflicting approved facts are included as a warning, not silently resolved;
5. generated summaries are excluded when their source material is already included unless compression is necessary;
6. duplicated material is represented once with multiple provenance references.

### 7. Apply budget policy

Context budgeting is objective-driven.

Recommended priority order:

1. current instruction and constraints;
2. active target state;
3. directly relevant Canon;
4. unresolved continuity and creator decisions;
5. essential source evidence;
6. creator preference signals;
7. related historical material;
8. optional research and examples.

When the package exceeds its budget, the assembler must compress or exclude lower-priority content and record what was removed. It must never truncate structured facts in a way that changes meaning.

### 8. Produce gaps and warnings

A context gap identifies information required for a reliable answer that is absent, ambiguous, stale, unauthorized, or contradictory.

```ts
interface ContextGap {
  code: string;
  severity: "blocking" | "material" | "advisory";
  description: string;
  affectedObjectivePart: string;
  suggestedResolution?: string;
}
```

Blocking gaps may require creator clarification before model or tool execution.

### 9. Freeze the package

The completed package receives:

- a stable identifier;
- policy version;
- source-version references;
- retrieval trace;
- deterministic digest;
- token accounting;
- exclusions;
- warnings and gaps.

An execution result must be traceable to the exact context package used.

## Relevance model

A context candidate's score should be inspectable rather than hidden behind a single opaque number.

```ts
interface RelevanceScore {
  directRelationship: number;
  objectiveSimilarity: number;
  authorityWeight: number;
  continuityRisk: number;
  decisionDependency: number;
  freshnessWeight: number;
  uniquenessWeight: number;
  tokenCostPenalty: number;
  finalScore: number;
}
```

The implementation may change scoring algorithms without changing the contract, provided ranking remains testable and explanations remain available.

## Creator Taste Profile boundary

Creator preference signals may influence style, option ranking, and presentation, but they must not:

- override the creator's current instruction;
- alter Canon;
- convert repeated behaviour into immutable identity claims;
- conceal alternatives;
- be inferred from private or unrelated projects without authorization;
- be presented as certainty when evidence is weak.

Every applied preference should include its source, confidence, scope, and last-confirmed date.

## External research boundary

Research context must include:

- source identity;
- retrieval date;
- publication date when available;
- confidence and authority assessment;
- quotation or summary provenance;
- freshness requirements;
- separation from project Canon.

Research remains evidence until the creator approves any resulting project truth.

## Persistence boundary

Durable storage should retain:

- context package metadata;
- source references and versions;
- policy version;
- retrieval trace;
- exclusions, gaps, and warnings;
- digest and token report;
- links to the resulting execution.

The system should avoid persisting redundant copies of full source content when stable source-version references are sufficient. A frozen materialized package may be stored for regulated, delivery-critical, or reproducibility-sensitive executions.

## Cache policy

Context packages may be cached only when:

- authorization scope is identical;
- target source versions are unchanged;
- policy version is unchanged;
- creator instruction and objective are equivalent;
- freshness requirements remain satisfied.

A cache hit must never bypass authorization or staleness checks.

## Failure behaviour

Context Assembly must fail closed when:

- project ownership cannot be verified;
- required Canon versions cannot be resolved;
- a blocking conflict makes the objective unsafe or indeterminate;
- the token budget cannot contain mandatory context;
- provenance is unavailable for required factual material;
- the request attempts to access restricted sources.

Failure responses must be structured, attributable, and recoverable. They should identify the smallest next action needed from the creator or system.

## Observability

The system should measure:

- assembly latency;
- retrieval count;
- included and excluded token volume;
- cache-hit rate;
- context-gap frequency;
- post-execution citation accuracy;
- source utilization;
- stale-context incidents;
- creator corrections attributable to missing or irrelevant context;
- authorization denials.

Metrics must not expose protected content in logs.

## Evaluation suite

Minimum evaluation cases:

1. A scene rewrite receives only the scene, active characters, relevant arc state, continuity, constraints, and creator preferences.
2. An unrelated character's full history is excluded.
3. A superseded Canon version is not selected.
4. A conflicting approved fact creates a warning rather than silent reconciliation.
5. A Fragment is labelled as evidence and cannot masquerade as Canon.
6. A Candidate is included only for review-oriented objectives.
7. An unauthorized cross-project source is excluded and recorded.
8. A reload can reproduce the same package when all source versions are unchanged.
9. A Canon change invalidates the affected cache entry.
10. A tight budget preserves mandatory facts and records lower-priority exclusions.
11. Creator preference never overrides an explicit current instruction.
12. External research remains separated from approved project truth.

## Initial implementation boundary

The first implementation should remain narrow:

- deterministic typed retrieval from current Convex project state;
- explicit relationship expansion;
- authority and version filtering;
- simple inspectable relevance ranking;
- fixed token budgeting;
- structured gaps, warnings, and retrieval trace;
- no autonomous long-term memory system;
- no hidden cross-project learning;
- no vector database in the authoritative truth path;
- no automatic Canon mutation.

## Stop conditions

Do not expand implementation when:

- the active milestone does not require Context Assembly;
- a simpler direct query satisfies the objective safely;
- required authorization rules are not yet implemented;
- the proposed retrieval layer would duplicate an existing stable path;
- evaluation cannot prove that additional context improves correctness.

## Completion standard

Context Assembly v1 is complete only when:

- every package is authorized, bounded, versioned, and explainable;
- all factual items retain provenance and truth status;
- mandatory context survives budget pressure;
- conflicts and missing information remain visible;
- executions can be reproduced from recorded package metadata;
- tests demonstrate relevance, isolation, staleness, and authority behaviour;
- no assembly path can mutate Canon directly.
