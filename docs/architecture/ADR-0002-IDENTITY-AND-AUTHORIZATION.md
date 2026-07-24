# ADR-0002 — Identity and Authorization

- **Status:** **Accepted** (Owner-approved 2026-07-24). Provider = **Clerk**;
  the §8 open questions are resolved in §9. Concrete PR-1 schema and
  authorization flow are specified in §10 for architectural review **before**
  implementation begins.
- **Date:** 2026-07-24 (proposed); 2026-07-24 (accepted)
- **Supersedes / relates to:** the existing `docs/ARCHITECTURE.md` serves as the
  de-facto ADR-0001 (compiler + Convex persistence architecture). No numbered
  ADR-0001 file exists yet; backfilling one is recommended but out of scope
  here.
- **Evidence base:** `docs/architecture/REPOSITORY-DISCOVERY.md`.

## 1. Context

Discovery (see the companion document) established, by direct inspection, that:

- There is **no authentication** in the codebase — every actor is an
  unauthenticated `v.string()` argument.
- There is **no authorization** — `listProjects` returns every project to any
  caller, and `saveProjectSnapshot` will overwrite any project's graph with no
  ownership check.
- The frontend is **not wired to Convex** at all, so identity is a **greenfield
  integration**, not a migration.
- The binding constitution (`AGENTS.md`) defines a **single sovereign Owner**
  product, mandates **Convex** as the authorization boundary, and routes
  authority-bearing work through the **Kernel** boundary.

This ADR fixes the identity taxonomy and the authorization model, and records a
**recommended but not-yet-final** authentication provider decision, deliberately
held open pending Owner input.

## 2. Decision drivers

1. **Constitutional single-Owner model.** The Owner is the top principal;
   canon changes only by Owner approval (`AGENTS.md` §2.1, Law 1).
2. **Convex-native.** Authorization lives in Convex functions via
   `ctx.auth.getUserIdentity()`; no parallel auth service (`AGENTS.md` §10.2).
3. **Provenance integrity.** The existing `ContentOrigin` distinction
   (`user | generated | source-quotation`) must extend cleanly to *who/what*
   acted, so AI/service actions are always attributable and never silently
   canonical.
4. **External reach without external accounts.** Producers/directors/execs
   receive frozen artifacts in Delivery Rooms; they must **not** become
   first-class app users.
5. **No theater.** No decorative login. Every identity surface must be real
   (`AGENTS.md` anti-theater clause).

## 3. Identity taxonomy (adopted)

The system distinguishes **four** principal classes. Conflating them is the
root cause of most auth mistakes, so they are separated explicitly.

### 3.1 Authenticated human users (the Owner; later, invited collaborators)

- The verified human operating the workspace. In the constitutional model this
  is **one Owner** per workspace; collaborators are a **future** extension
  behind an Owner-granted grant, not assumed now.
- Established by a real identity provider and surfaced in Convex as
  `ctx.auth.getUserIdentity()`.
- Holds the top of the authority order (`AGENTS.md` §2.2). Only this class may
  approve canon, approve compiled documents, and create Delivery Rooms.
- **New table `users`** keyed by the provider `subject` (OIDC `sub`), storing
  `subject`, `email`, `displayName`, `createdAt`. `projects` gains
  `ownerId: Id<"users">`.

### 3.2 Organizations and project memberships (deferred, not adopted)

- A multi-tenant org/membership layer (org → members → roles → project ACLs).
- **Explicitly out of scope and not modeled now.** The constitution is
  single-Owner (§7); introducing org tenancy is a **constitution-level change
  requiring explicit Owner approval** (`AGENTS.md` §2.2, §10.1). We name the
  class here only to reserve the seam: authorization is centralized in one
  `assertProjectAccess(ctx, projectId)` helper so a membership check can later
  replace the owner check **without touching call sites**.
- No `organizations`/`memberships` tables are created by this ADR.

### 3.3 External delivery recipients (adopted as a distinct, non-user class)

- Producers, directors, executives, department heads, reviewers who receive a
  **frozen** `documentVersion` in a Delivery Room. Today they are name/email
  strings on `deliveryRoomRecipients` with **no access mechanism**.
- These are **not** `users` and must never get a workspace account or any read
  path into the live graph, drafts, or other projects. They get **scoped,
  capability-based room access only** (an unguessable per-recipient room token /
  signed link), bounded by the room's existing `accessLevel`, `expiresAt`,
  `downloadPermission`, `commentPermission`, and `revokedAt` fields
  (`convex/schema.ts:253-272`).
- Their only write capability is a **review note** (`recordReviewNote`), which
  is *pending* until the Owner decides it (`AGENTS.md` Law 1;
  `docs/ARCHITECTURE.md:11`). A recipient token authenticates *that specific
  recipient in that specific room* and nothing else.

### 3.4 AI / service-agent identities (adopted as a distinct, attributable class)

- The Greenlight Kernel, generation services, compilation runners, and export
  workers that act **on behalf of** the Owner but are not the Owner.
- Represented as a distinct principal type so `requestedBy` /
  `origin: "generated"` actions are always attributable to a named agent+version
  and are visibly non-human.
- **Authority ceiling:** an agent identity may *propose* and *compile*; it may
  **never** approve canon, approve a compiled document, or deliver. Those remain
  Owner-only. This encodes Law 1 at the identity layer, not just by convention.
- Realized as Convex **internal** functions / actions invoked with an explicit
  `agent` provenance stamp — never via a spoofable client string.

## 4. Authorization model (adopted)

1. **Single choke point.** One helper,
   `assertProjectAccess(ctx, projectId): Promise<UserDoc>`, resolves
   `ctx.auth.getUserIdentity()` → `users` → verifies `project.ownerId ===
   user._id`, throwing on failure. Every project-scoped query/mutation calls it
   first. This is the seam where §3.2 memberships slot in later.
2. **Scope reads by principal.** `listProjects` returns only the caller's
   projects (new `by_owner` index), replacing the current return-everything
   behavior.
3. **Derive actor fields from identity, never from arguments.** `requestedBy`,
   `author`, `decidedBy`, `overriddenBy`, `createdBy`, and a newly **persisted**
   `approvedBy` are set from the resolved principal server-side. The
   corresponding client `v.string()` args are removed.
4. **Recipients via room capability, not user auth.** Delivery/review functions
   authenticate a recipient token to a room; they never call
   `assertProjectAccess`.
5. **Agents via internal functions.** Generation/compile/export entry points
   that run as an agent are `internalMutation`/`internalAction`, callable only
   from trusted server context, and stamp agent provenance.

## 5. Authentication provider — recommendation (NOT final)

Per the discovery discipline, a provider is **not locked** here. The verified
facts that constrain the choice:

- **Existing auth config:** none (`no convex/auth.config.ts`).
- **Current frontend provider integration:** none (no Convex client wired).
- **Existing env-var expectations:** only Convex deployment vars; README forbids
  committing `.env.local`. No `VITE_*` auth vars exist to honor.
- **Deployment constraint:** Convex is mandated; no parallel auth backend.

Given a greenfield integration and a Convex-native mandate, the realistic
options are the four Convex supports:

| Option | Fit | Trade-off |
|---|---|---|
| **Clerk** (Convex's first-party recommendation) | Turnkey OIDC, hosted UI, works with `ctx.auth`; fastest to a real login for a single Owner | External dependency + Clerk env vars; hosted user store |
| **`@convex-dev/auth`** (in-Convex auth) | No third party; users live in Convex; strong data-locality | Younger; more wiring for providers/passkeys ourselves |
| **Auth0 / generic OIDC** | Enterprise-grade, standard | Heavier setup than needed for one Owner now |
| **Custom OIDC / passkey** | Maximum control | Most build + security-review burden |

**Recommendation:** start with **Clerk** *or* **`@convex-dev/auth`** — both give
a genuine `ctx.auth` identity with minimal surface. Lean **`@convex-dev/auth`**
if the Owner prefers zero third-party identity dependency and keeping the user
store inside Convex (aligns with §10.2 data-locality and single-Owner
simplicity); lean **Clerk** if the Owner wants the least custom auth code and is
comfortable with a hosted provider. **This choice is deferred to §8.**

Crucially, **the taxonomy (§3) and authorization model (§4) are
provider-independent** — `assertProjectAccess` depends only on
`ctx.auth.getUserIdentity()`, which all four options populate. We can adopt the
model now and bind the provider once the Owner answers §8.

## 6. Consequences

- **Positive:** identity becomes unspoofable; projects become owner-private;
  the highest-authority action (approval) becomes durably attributable; external
  recipients and AI agents are structurally prevented from acting as the Owner;
  a single choke point keeps future collaboration/tenancy a localized change.
- **Cost:** a schema change (new `users` table, `projects.ownerId`, persisted
  `approvedBy`, recipient tokens) and removal of client-supplied actor args —
  a breaking change to the current function signatures. Gated behind the
  implementation plan; **not performed by this ADR**.
- **Migration:** none in the data sense — no deployment has run, and the
  frontend is unconnected. First real users are created through the new flow.

## 7. Non-goals

Organization tenancy, role hierarchies beyond Owner, collaborator invitations,
recipient SSO, and agent-to-agent delegation. Each is a later ADR; the seams are
reserved but the mechanisms are not built.

## 8. Open questions requiring Owner input (block provider finalization)

1. **Provider:** Clerk vs. `@convex-dev/auth` (the two recommended)? Any
   organizational SSO/compliance requirement that forces Auth0/OIDC?
2. **Collaborators:** is single-Owner correct for the foreseeable milestone, or
   should the `users`/`assertProjectAccess` seam be built membership-ready now?
3. **Recipient identity:** is an unguessable signed room link acceptable for
   external recipients, or is verified email / one-time-code required before a
   recipient can view or comment?
4. **Agent attribution:** should agent provenance record a service account per
   environment, or a per-run ephemeral agent id?

Until these are answered, PR-1 in the implementation plan builds only the
**provider-independent** identity plumbing and authorization choke point behind
a thin, swappable auth adapter.

## 9. Owner decisions (2026-07-24) — §8 resolved

1. **Provider = Clerk.** Clerk establishes *human identity only*. **Clerk is not
   the authorization system.** Convex functions remain the sole enforcer of
   project access and product permissions. A Clerk token that authenticates a
   human grants nothing until a Convex function checks ownership.
2. **Tenancy = single sovereign Owner, structurally membership-ready.** Build for
   one Owner now, but route every access check through one choke point so a
   membership table can later replace the owner check without touching call
   sites. Do **not** add `organizations`/`memberships` tables yet.
3. **External delivery recipients stay separate from workspace users** and use
   scoped delivery-room **access tokens** — never Clerk accounts, never a
   `users` row, never `assertProjectAccess`.
4. **AI agents are service principals** with explicit attribution and **may never
   approve Canon or delivery**. They never traverse authenticated-human code
   paths.

## 10. Proposed PR-1 design (for review before implementation)

Scope is exactly the approved PR-1 list; nothing here touches snapshots, Canon
history, or relationships.

### 10.1 Schema additions (`convex/schema.ts`)

```ts
// NEW — human identity, keyed by the stable Clerk subject (JWT `sub`).
users: defineTable({
  subject: v.string(),        // Clerk `sub` — stable across sessions/logins
  email: v.optional(v.string()),
  displayName: v.optional(v.string()),
  createdAt: v.number(),
}).index("by_subject", ["subject"]),

// CHANGED — projects gain an owner. Optional at the column level so existing
// rows remain valid; ownership is enforced in code, and backfilled explicitly
// (see 10.4). A later membership table is the seam, not a schema change here.
projects: defineTable({
  /* …existing fields… */
  ownerUserId: v.optional(v.id("users")),   // NEW
}).index("by_updated", ["updatedAt"])
  .index("by_owner", ["ownerUserId"]),      // NEW — scopes listProjects
```

`approveCompiledDocument` currently drops `approvedBy`. PR-1 persists the
approver. Minimal, additive change to the existing `compiledDocuments` row via a
patch (`approvedByUserId: v.optional(v.id("users"))`, `approvedAt:
v.optional(v.number())`) — recorded here as the intended shape; the exact field
placement is part of the PR-1 diff for review.

Delivery-recipient tokens (§3.3) are **out of PR-1** (they belong to PR-4); no
recipient-token columns are added in this PR. The seam is preserved.

### 10.2 Authorization choke point (`convex/identity.ts`, NEW)

```ts
// Human identity → Convex user row. Throws when unauthenticated.
async function requireAuthenticatedUser(ctx): Promise<UserDoc> {
  const identity = await ctx.auth.getUserIdentity();      // Clerk-populated
  if (!identity) throw new Error("Not authenticated.");
  // upsert users row keyed by identity.subject; return it
}

// The single project access gate. Membership later replaces the body only.
async function assertProjectAccess(ctx, projectId): Promise<UserDoc> {
  const user = await requireAuthenticatedUser(ctx);
  const project = await ctx.db.get(projectId);
  if (!project) throw new Error("Project not found.");
  if (project.ownerUserId !== user._id) throw new Error("Forbidden.");
  return user;
}
```

Agent/service entry points do **not** call these; they run as Convex
`internalMutation`/`internalAction` and are structurally barred from the
human-approval functions.

### 10.3 Authorization flow (per request)

```text
Browser (Clerk session/JWT)
   │  Convex client attaches the Clerk token
   ▼
Convex function
   │  ctx.auth.getUserIdentity()          ← Clerk = WHO the human is
   ▼
requireAuthenticatedUser → users row
   │
   ▼
assertProjectAccess(projectId)            ← Convex = WHAT they may touch
   │  ownerUserId === user._id ? proceed : throw
   ▼
read/write scoped to the owner's project
```

PR-1 applies this to the vertical slice: `saveProjectSnapshot` (stamps/*asserts*
`ownerUserId`), `listProjects` (scoped via `by_owner`), `getLatestSnapshot`, and
the approval path (persists approver; human-only). Caller-supplied human
identity args (`requestedBy`, `author`, `decidedBy`, `overriddenBy`,
`createdBy`, `approvedBy`) are removed where an authenticated identity is
derivable from `ctx.auth`.

### 10.4 Migration strategy (explicit — no silent ownership)

Existing `projects` rows have no `ownerUserId`. **Production code must never
auto-assign ownership** (an unauthenticated row must not silently become some
caller's property).

- **Development / seed:** a guarded `internalMutation`
  (`backfillProjectOwner({ projectId, subject })`) that an operator invokes
  explicitly to assign a known Clerk subject as owner. Never runs automatically.
- **Reads of unowned rows:** `assertProjectAccess` treats `ownerUserId ===
  undefined` as **access-denied**, not access-granted — so an un-backfilled row
  is inert, never world-readable.
- **`saveProjectSnapshot` on a new project:** stamps `ownerUserId` from the
  authenticated caller at creation.
- Because no deployment has run yet (discovery §5), the practical data
  population is greenfield; the backfill exists for any dev deployment that
  seeded rows before this PR.

### 10.5 Tests required by PR-1

Unauthenticated access is rejected; cross-project access is rejected (owner-A
cannot read/write owner-B); owner access succeeds; `listProjects` is
owner-scoped; an un-backfilled (ownerless) project is inaccessible; and an
**agent/service principal is rejected from `approveCompiledDocument`**.

> **Gate:** implementation of §10 does not begin until this ADR revision has had
> independent architectural review. This section is the "show the proposed
> schema and authorization flow" deliverable, not an implementation record.
