# Repository Discovery — Identity, Authorization, and Data Access

> Status: complete. Produced by direct inspection of the working tree at branch
> `claude/greenlit-local-setup-nalwgh`. No schema or code was modified during
> discovery. This document is the factual baseline for
> `ADR-0002-IDENTITY-AND-AUTHORIZATION.md` and
> `IMPLEMENTATION-PLAN-VERTICAL-SLICE.md`.

## 1. Method

Discovery was performed with repository-native commands, not by fetching
individual files over the web:

```bash
find convex src tests -type f | sort
rg -n "projectObjects|screenplayElements|ConvexProvider|ConvexReactClient|create\(|persist\(|ctx\.auth|getUserIdentity|z\.object|mutation\(|internalMutation\(|query\(|action\(" convex src tests
rg -n "auth|identity|getUserIdentity|Clerk|Auth0|convexAuth|@convex-dev/auth|OAuth|jwt|token|session" convex src
rg -n "convex/react|ConvexReactClient|ConvexProvider|useQuery|useMutation|import.meta.env|VITE_" src
```

Every claim below cites the file and line it was derived from.

## 2. Stack and topology

- **Runtime / package authority:** Bun (`package.json` scripts use `bun test`,
  `bun run`, `bunx convex`). Constitution mandates Bun (AGENTS.md §10.1).
- **Frontend:** React 19 + TanStack Router + TanStack Query, Vite 8 (Rolldown),
  Zustand for ephemeral UI state, Three.js / R3F for the orbit field.
- **Backend:** Convex 1.42.3. Constitution forbids a parallel Express/Drizzle/
  Postgres stack without Owner approval (AGENTS.md §10.1–10.2).
- **Domain code** lives under `convex/domain/**` and is imported by both the
  Convex functions and the frontend via the `@domain` alias
  (`vite.config.ts:21`). It is pure and framework-free.

Top-level Convex modules: `schema.ts`, `projects.ts`, `compilerPersistence.ts`,
`quality.ts`, `reviews.ts`, `exports.ts`. No `convex/auth.config.ts`, no
`convex/_generated/` (codegen has never been run against a deployment).

## 3. Identity state — there is none

**No authentication exists anywhere in the codebase.** The sweep for
`ctx.auth`, `getUserIdentity`, `@convex-dev/auth`, `Clerk`, `Auth0`, `convexAuth`,
`OAuth`, `jwt`, and `session` returned **zero** functional matches (only the
words "author"/"authenticity" in unrelated creative content, and static
Settings-page mockup copy at `src/pages/SettingsPage.tsx:37`).

Instead, **every actor identity is an unauthenticated free-text `v.string()`
argument** supplied by the caller. Nothing binds these strings to a verified
principal, and nothing prevents a caller from impersonating any actor or
targeting any `projectId`.

| Actor field | Table / function | Source | Trust today |
|---|---|---|---|
| `requestedBy` | `compilationRuns` / `persistCompilation` | `convex/compilerPersistence.ts:35,47` | free string |
| `author` | `reviewNotes` / `recordReviewNote` | `convex/reviews.ts:8,24` | free string |
| `decidedBy` | `reviewDecisions` / `decideReviewNote` | `convex/reviews.ts:53,64` | free string |
| `approvedBy` | `approveCompiledDocument` (return only) | `convex/quality.ts:50,60` | free string, **not persisted** |
| `overriddenBy` | `qualityGateRuns.overrides[]` | `convex/quality.ts:18` | free string |
| `createdBy` | `sectionOverrides` | `convex/schema.ts:151` | free string |
| recipient `name` / `email` | `deliveryRoomRecipients` / `createDeliveryRoom` | `convex/schema.ts:267-269`, `compilerPersistence.ts:160-161` | free string |

Note `approveCompiledDocument` (`convex/quality.ts:47`) — the most
authority-bearing action in the system, gating delivery — takes `approvedBy`
and returns it but **never writes it**. There is no durable record of who
approved a document.

## 4. Authorization state — there is none

No function performs any authorization check. Specifically:

- `saveProjectSnapshot` (`convex/projects.ts:5`) accepts an optional
  `projectId` and will patch **any** existing project and overwrite its
  `projectObjects` with no ownership verification (`projects.ts:29-65`).
- `listProjects` (`convex/projects.ts:79`) returns **all** projects in the
  deployment to **any** caller.
- `getLatestSnapshot`, `getCompiledDocument`, `listReviewNotes`, and every
  mutation accept caller-supplied ids and neither scope nor filter by principal.
- The only guards that exist are **state-machine** guards, not access guards:
  `createDeliveryRoom` requires `approvalStatus === "approved"`
  (`compilerPersistence.ts:169`); `approveCompiledDocument` requires
  `qualityGateStatus === "ready"` (`quality.ts:55`). These protect the workflow
  invariant, not the principal.

There are **no tables** for users, accounts, organizations, memberships, roles,
sessions, or delivery-recipient credentials. `projects` has no `ownerId`
(`convex/schema.ts:39-47`).

## 5. Frontend ↔ Convex wiring gap

The frontend is **not connected to Convex at all**. The sweep for
`ConvexReactClient`, `ConvexProvider`, `useQuery`, `useMutation`, and
`import.meta.env`/`VITE_` in `src` returned **zero** matches.

- `src/main.tsx` mounts only `QueryClientProvider` (TanStack Query) and
  `RouterProvider` (TanStack Router). No Convex client is instantiated.
- Every page renders from a deterministic in-memory fixture
  (`src/data/fixture.ts`), imported directly, e.g. `ScreenplayPage`
  (`src/pages/ScreenplayPage.tsx:8`) and `App` (`src/App.tsx:12`).
- Zustand stores hold only ephemeral UI state (`src/app/state.ts`,
  `src/app/shellState.ts`, `src/assistant/assistantState.ts`) — consistent with
  the UI-state boundary in `docs/ARCHITECTURE.md:51-53`.

This matches the self-description in `docs/KNOWN_LIMITATIONS.md`: schema and
transactional functions exist, but "authentication, generated Convex client
bindings, permissions, and live subscriptions are the next integration pass."

**Implication for identity:** because there is no Convex client wiring yet,
introducing auth is a greenfield integration, not a migration. There is no
existing provider choice, env-var contract, or login UI to preserve or undo.

## 6. Screenplay element vocabulary — derived, not assumed

The vocabulary was derived from every path that reads, writes, renders,
compiles, validates, or exports elements — **not** from industry convention.
It is a closed union of **11 element types**, defined canonically at
`convex/domain/screenplay/types.ts:9-20`:

```
scene-heading · action · character · parenthetical · dialogue ·
transition · centered · section · synopsis · page-break · note
```

Verified consistent across all real code paths:

| Path | Role | Evidence |
|---|---|---|
| `screenplay/types.ts` | canonical `ElementType` union + `makeElement` | `types.ts:9-20,118` |
| `screenplay/fountain.ts` | importer/parser **and** serializer | emits all 11; `switch` handles all 11 (`fountain.ts:83-150,222-260`) |
| `screenplay/fdx.ts` | Final Draft export | `FDX_TYPE` maps all 11; `section`/`synopsis`/`page-break`/`note` → `null` (dropped), `centered` → `Action` centered (`fdx.ts:22-34,50`) |
| `screenplay/compile.ts` | canon → draft compiler | injects `note`/`synopsis`; strips `note`/`synopsis`/`section` in submission mode (`compile.ts:63-76`) |
| `screenplay/validate.ts` | script intelligence | treats `note` as a development annotation (`validate.ts:201`) |
| `compiler/gates.ts` | readiness gate | filters `note`/`synopsis` (`gates.ts:256`) |
| `tests/screenplay.test.ts` | behavior lock | asserts `note`/`synopsis` absent after submission compile (`screenplay.test.ts:30`) |
| `src/pages/ScreenplayPage.tsx`, `src/App.tsx` | renderers | consume the compiled draft via the domain modules |
| `src/data/fixture.ts` | seed | scene bodies are Fountain text (`scriptText`), parsed into elements; object `origin: "user"` (`fixture.ts:23`) |

**Element sub-attributes** (also from `types.ts:22-32`): `extension`
(character-cue `(V.O.)/(O.S.)/(CONT'D)`), `continued`, `dual` (dual-dialogue
column).

**Schema gap:** the persisted table stores `elementType: v.string()` and
`origin: v.string()` (`convex/schema.ts:355,358`) — the database does **not**
constrain elements to the 11-member union. The domain type is the source of
truth; the DB is loose. This is a candidate hardening item, but per the
discovery discipline it is recorded here, not changed.

## 7. Adjacent vocabularies (for authorization scoping)

- **Graph object kinds** — closed union at
  `convex/domain/graph/types.ts:22-41`: `project`, `fragment`, `character`,
  `relationship`, `scene`, `sequence`, `location`, `prop`, `world-rule`,
  `lore-entry`, `theme`, `tone-law`, `cultural-law`, `project-law`,
  `story-beat`, `human-mechanics`, `production-note`, `knowledge-fact`,
  `decision`.
- **Content origin** (authorship provenance): `user | generated |
  source-quotation` (`graph/types.ts:20`). This is the existing, principled
  distinction between human-authored and machine-generated content — the
  foundation any AI/service-agent identity model must respect.
- **Compilation modes:** `preserve | editorial | development | production-draft
  | submission` (`screenplay/types.ts:63-68`).

## 8. Constitutional constraints on any identity design

From `AGENTS.md` (binding repository law):

- **§2.1 / §7 — single sovereign Owner.** "The Owner is the final creative
  authority"; the experience is "optimized for a single Owner." Collaborators,
  producers, directors, and department heads are named only as *consumers* of
  outputs (§32), not as co-equal account holders.
- **§2.2 — order of authority:** explicit Owner instruction → canon law →
  constitution. Any authorization model must encode the Owner as the top
  principal.
- **Law 1 (§ Canon) — canon changes only by Owner approval.** No generated
  content and no external actor may mutate canon. The review workflow
  (`convex/reviews.ts`) is the only path, and it ends in an Owner decision.
- **§10.2 — Convex is first-class production infrastructure**, explicitly
  including "authorization" and "access rules." Auth belongs in the Convex
  boundary, not a bolted-on service.
- **§ Kernel boundary (line 119, 629) — authorization is a Kernel concern.**
  Complex/authority-bearing work passes through the Greenlight Kernel or a
  defined kernel service boundary.
- **§ Anti-theater (line 321) — no pretend services or decorative dead
  buttons.** The Settings page's "Manage security" / profile fields
  (`SettingsPage.tsx:37`) are static mockups today and must not be mistaken for
  a real identity surface.

## 9. Summary of gaps (input to ADR-0002)

1. No authentication; all actor identity is spoofable free text.
2. No authorization; every project is world-readable/writable within a
   deployment.
3. `approvedBy` — the highest-authority action — is not even persisted.
4. Frontend is unconnected to Convex; auth is greenfield.
5. No user/org/membership/recipient-credential tables exist.
6. Delivery recipients are name/email strings with no access mechanism.
7. Element/origin persistence is unconstrained `v.string()` vs. the closed
   domain unions.

None of these were changed. Remediation sequencing is proposed in the
implementation plan; the identity/authorization decision is recorded in
ADR-0002.
