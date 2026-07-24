# Milestone — pure-domain test hardening

- **Type:** test coverage only (within the independent-work boundary: "tests").
- **Branch:** `claude/test-fountain-hardening` (off `master`).
- **Touches:** `tests/` only (plus this doc). **No** production code, schema,
  auth, or architecture is changed by this milestone.

This milestone began as a Fountain parser/serializer pass and was extended into
a systematic hardening of the highest-risk pure domain invariants. Files added:

- `tests/fountain.test.ts` — Fountain importer/serializer + FDX (27 tests).
- `tests/canon.test.ts` — `diffSnapshots` field-level diff, `createSnapshot`
  deep-copy immutability, and the snapshot query helpers (12 tests).
- `tests/compose.test.ts` — `filterSnapshot` confidentiality/sequel scoping and
  the document editing law (`overrideSection`/`restoreGenerated`/`visibleBlocks`,
  ARCHITECTURE.md invariant 4) (9 tests).
- `tests/staleness.test.ts` — `analyzeSectionStaleness` five-way classification
  (current/stale/potentially-stale/conflicted/awaiting-approval/missing-required)
  and severity ordering (7 tests).
- `tests/validate.test.ts` — 7 previously untested `validateDraft` rules plus
  the issue-reporting-contract invariant (8 tests).

## Rationale

`convex/domain/screenplay/fountain.ts` is the most intricate pure module in the
codebase — a spec-driven Fountain **importer and exporter** on the critical path
for every screenplay export (Fountain, and via the shared element model, FDX).
Before this milestone its only coverage was one round-trip and one dialogue case
(`tests/screenplay.test.ts:33-41`). Every other Fountain construct — transitions,
centered text, sections, synopses, notes, boneyard stripping, dual dialogue,
forced headings/cues, character extensions, page breaks, multi-line title pages,
and scene-heading parsing — was untested.

## Scope

Add `tests/fountain.test.ts` exercising, against the behavior documented in the
module's own docstring and the Fountain spec it implements:

- title-page parsing (single- and multi-line values; key aliases);
- boneyard (`/* */`) stripping;
- each block construct: scene headings (detected + forced), action (+ forced
  `!`), character cues (detected + forced `@`), parentheticals, dialogue,
  transitions (forced `>` + detected `TO:`), centered, sections, synopses,
  notes, page breaks;
- character extensions `(V.O.)` and dual dialogue `^`;
- `parseSceneHeading` prefix/location/time-of-day extraction;
- serializer output rules (forcing, uppercasing, numbering) and structural
  round-trip stability;
- FDX mapping of the constructs that drop (`section`/`synopsis`/`page-break`/
  `note`) and re-map (`centered` → centered Action), plus XML escaping.

## Acceptance criteria

1. `tests/fountain.test.ts` adds coverage for every `ElementType` and every
   forced/detected parse branch in `fountain.ts`.
2. `bun test` passes (existing 29 + new, 0 failures).
3. `bun run check` (typecheck + test + lint + build) passes.
4. `bun run build` passes.
5. No file outside `tests/` (and this doc) is modified. Any parser defect the
   new tests reveal is reported in the PR, and only fixed if it is an isolated
   correctness bug — otherwise it is documented, not silently enshrined.

## Out of scope

Schema tightening of `screenplayElements.elementType`/`origin` (a data-model
decision — gated), any change to the compiler pipeline, and validator-rule
coverage (a candidate for a separate milestone).
