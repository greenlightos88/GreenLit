# Milestone — pure-domain test hardening

- **Type:** test coverage only (within the independent-work boundary: "tests").
- **Branch:** `claude/test-fountain-hardening` (off `master`).
- **Touches:** `tests/` only (plus this doc). **No** production code, schema,
  auth, Canon semantics, or compiler contracts are changed by this milestone.

This milestone began as a Fountain parser/serializer pass and was extended into
a systematic hardening of the highest-risk pure domain logic. Files added (test
counts are the final PR values):

| File | Tests | Subsystem |
|---|--:|---|
| `tests/fountain.test.ts` | 27 | Fountain importer/serializer + FDX serializer |
| `tests/canon.test.ts` | 9 | `graph/canon` diff + `createSnapshot` + query helpers |
| `tests/compose.test.ts` | 7 | `filterSnapshot` + document editing law |
| `tests/staleness.test.ts` | 7 | `analyzeSectionStaleness` classification |
| `tests/validate.test.ts` | 14 | `validateDraft` — 13 issue codes |
| `tests/profiles.test.ts` | 24 | profile registry + compile-all-profiles invariant |

**Baseline 29 tests (4 files) → 117 tests (10 files), all green.** The 88 added
tests are the six files above; the 29 pre-existing tests
(`assistant`/`compiler`/`review-notes`/`screenplay`) are unchanged.

Commit structure keeps the validator and compiler-invariant additions in
separate files and separate commits for independent review.

## Rationale

The pure domain modules under `convex/domain/**` are the deterministic core the
constitution requires to be testable, yet coverage was concentrated in a few
high-level `compileDocument` paths. The highest-risk gaps were:

- the intricate, spec-driven Fountain **importer and serializer**
  (`screenplay/fountain.ts`), previously exercised by a single round-trip case;
- the canon **field-level diff** and snapshot immutability (`graph/canon.ts`)
  that drive staleness and delivered-package divergence;
- the confidentiality/scoping filter and **document editing law**
  (`compiler/compose.ts`, ARCHITECTURE.md invariant 4);
- the **staleness classifier** (`compiler/staleness.ts`);
- the **script-intelligence validator** (`screenplay/validate.ts`), of which
  only 2 of ~13 issue codes were asserted;
- the **profile registry and builders** (`compiler/profiles.ts`,
  `sections.ts`, `production.ts`) — only 4 of 13 profiles were ever compiled.

## Scope

Verify existing behavior across the subsystems above:

- **Fountain / FDX** — title pages (single/multi-line, aliases), boneyard
  stripping, every block construct (scene headings detected + forced, action +
  forced `!`, character cues detected + forced `@`, parentheticals, dialogue,
  transitions forced `>` + detected `TO:`, centered, sections, synopses, notes,
  page breaks), extensions `(V.O.)`, dual dialogue `^`, `parseSceneHeading`,
  serializer forcing/uppercasing/numbering/blank-line normalization,
  parse→serialize→parse round-trip; FDX mapping/drops/centered-as-Action/XML
  escaping.
- **Canon** — `diffSnapshots` added/removed/modified with exact changed fields,
  ignored version/updatedAt churn, deep nested compare; `createSnapshot`
  deep-copy immutability; `objectsOfKind`/`canonicalObjects`/`isCanonical`/
  `indexSnapshot`.
- **Compose** — `filterSnapshot` confidentiality + sequel scoping; the editing
  law (`overrideSection` protects the edit and preserves the generated version,
  `restoreGenerated`, `visibleBlocks`).
- **Staleness** — `analyzeSectionStaleness` classification across
  current/stale/potentially-stale/conflicted/awaiting-approval/missing-required
  and severity ordering.
- **Validator** — 13 issue codes, including the graph-linked rules
  (dialogue-absent-character, law-conflict, cultural-accuracy,
  incomplete-story-beat, missing-scene-purpose, broken-setup-payoff) and the
  issue-reporting contract.
- **Compiler profiles** — `getProfile`/`ALL_PROFILES` registry invariants and a
  compile of all 19 registered profiles over the fixture, exercising the
  `sections.ts`/`production.ts` builders transitively and asserting well-formed,
  provenance-bearing output.

## Acceptance criteria

1. Coverage spans all six subsystems above, verifying existing behavior only.
2. `bun test` passes with **117 tests across 10 files, 0 failures**.
3. `bun run check` (typecheck + test + lint + build) passes.
4. `bun run build` passes.
5. No file outside `tests/` (and this doc) is modified. Any defect a test
   reveals is reported in the PR and fixed only if it is an isolated,
   pure-domain correctness bug — otherwise documented, not silently enshrined.
   (This pass changed no production code; the mid-development corrections were
   test-authoring assumptions, not production defects.)

## Out of scope

- Tightening `screenplayElements.elementType`/`origin` from `v.string()` toward
  the closed domain unions — a **schema/data-model** decision, gated.
- Fixing the two Fountain **serializer** behaviors this pass documented
  (mixed-case cue normalization `McClane` → `@MCCLANE`; adjacent dialogue
  blocks not blank-line-separated on serialize) — those are production changes
  for a separate serializer-hardening milestone with its own PR/review.
- Tests of the Convex **function layer** (`convex/*.ts` mutations/queries),
  which require a deployment/test harness and belong with the identity/auth and
  persistence work, not this pure-domain pass.
