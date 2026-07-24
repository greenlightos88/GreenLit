# Implementation Plan — Authenticated Vertical Slice

> Goal: prove one **end-to-end authenticated, owner-scoped** path through the
> real Convex backend — a browser user who signs in, saves a project, and reads
> back **only their own** projects — while adopting the identity taxonomy and
> authorization choke point from `ADR-0002`.
>
> Governing evidence: `REPOSITORY-DISCOVERY.md`. Governing decision:
> `ADR-0002-IDENTITY-AND-AUTHORIZATION.md`.

## Principles

1. **No schema change until discovery is complete.** Discovery is complete
   (this document set), so schema changes are now permitted — but only within
   the PRs below, each with tests.
2. **Provider-independent first.** PR-1 depends only on
   `ctx.auth.getUserIdentity()` behind a thin adapter, so it lands before the
   Owner finalizes the provider (ADR-0002 §8).
3. **One choke point.** All project access flows through
   `assertProjectAccess(ctx, projectId)`. Future membership/tenancy replaces its
   body, not its call sites.
4. **Actor identity is derived, never passed.** Remove client-supplied
   `requestedBy` / `author` / `decidedBy` / `createdBy` / `approvedBy` args as
   each function is brought under auth.
5. **Recipients and agents are not users** (ADR-0002 §3.3–3.4) and are out of
   this slice except where noted.
6. Every PR keeps `bun run check` (typecheck + test + lint + build) green and
   adds tests for new behavior.

## The vertical slice (definition of done)

A signed-in Owner in the browser:

1. authenticates via the chosen provider → `ctx.auth.getUserIdentity()` resolves
   server-side;
2. calls `saveProjectSnapshot`, which stamps `ownerId` from the verified
   principal;
3. calls `listProjects`, which returns **only** that Owner's projects;
4. a second identity sees **none** of the first Owner's projects.

That is the smallest change that turns "world-readable string identity" into
"authenticated, owner-private."

## PR sequence

### PR-1 — Authorization choke point + identity plumbing (provider-independent)

- **Schema:** add `users` table (`subject`, `email?`, `displayName?`,
  `createdAt`) indexed `by_subject`; add `ownerId: Id<"users">` to `projects`
  with a `by_owner` index. (`convex/schema.ts`)
- **New `convex/identity.ts`:**
  - `getOrCreateUser(ctx)` — resolve `ctx.auth.getUserIdentity()`, upsert the
    `users` row, return it; throw if unauthenticated.
  - `assertProjectAccess(ctx, projectId)` — resolve user, load project, throw
    unless `project.ownerId === user._id`. Single choke point (ADR-0002 §4.1).
- **Rewire `convex/projects.ts`:** `saveProjectSnapshot` sets `ownerId` from the
  resolved user (new projects) / asserts access (existing); `listProjects` uses
  `by_owner` for the caller only; `getLatestSnapshot` asserts access.
- **Tests:** owner-A cannot read or overwrite owner-B's project; `listProjects`
  is scoped; unauthenticated calls throw. Use the Convex test harness with a
  mocked identity.
- **Acceptance:** slice steps 2–4 pass at the function level (still no UI).

### PR-2 — Bind the authentication provider (after ADR-0002 §8 answered)

- Add `convex/auth.config.ts` for the Owner-chosen provider (Clerk **or**
  `@convex-dev/auth`).
- Wire the Convex React client + provider in `src/main.tsx` (the first Convex
  client in the app — see discovery §5), reading config from documented
  `VITE_*` / Convex env vars. No secrets committed.
- Add a real sign-in surface; replace the static Settings security/profile
  mockups (`src/pages/SettingsPage.tsx`) only as far as needed to reflect the
  real principal — no dead buttons (`AGENTS.md` anti-theater).
- **Acceptance:** slice step 1 works in the browser end-to-end against a dev
  deployment.

### PR-3 — Bring the compile/quality/review write-paths under identity

- Derive and **persist** the actor on every authority-bearing write, closing the
  discovery §3 gaps:
  - persist `approvedBy` + `approvedAt` in `approveCompiledDocument`
    (currently returned but dropped — `convex/quality.ts:47-61`);
  - stamp `requestedBy` (`persistCompilation`), `author`/`decidedBy`
    (`reviews.ts`), `overriddenBy`, `createdBy` from the principal; remove the
    client args.
  - gate `persistCompilation`, `persistQualityGateRun`, `approveCompiledDocument`
    behind `assertProjectAccess` (resolving the owning project via the document).
- **Constitutional check:** only an authenticated Owner principal may approve
  (Law 1). Agent principals are rejected at approval (ADR-0002 §3.4).
- **Tests:** approval is attributable and owner-gated; non-owner is denied.

### PR-4 — Delivery recipients as scoped capability (not users)

- Add a per-recipient room capability (unguessable token) on
  `deliveryRoomRecipients`; add a recipient-scoped read of the frozen
  `documentVersion` and a `recordReviewNote` path authenticated by that token,
  bounded by `accessLevel` / `expiresAt` / `downloadPermission` /
  `commentPermission` / `revokedAt`.
- Recipients get **no** `assertProjectAccess` path and no live-graph read
  (ADR-0002 §3.3). Review notes remain pending until Owner decision.
- **Tests:** revoked/expired tokens denied; recipient cannot reach other rooms,
  drafts, or projects; a note lands as `pending`.
- *(Depends on ADR-0002 §8 Q3 — recipient identity requirement.)*

### PR-5 — Agent identity + provenance hardening (optional in this slice)

- Move generation/compile/export entry points that run as an agent to
  `internalMutation`/`internalAction`; stamp agent+version provenance; forbid
  agent principals from approval/delivery.
- Optionally tighten `screenplayElements.elementType` / `origin` from
  `v.string()` toward the closed domain unions (discovery §6 gap) — behind its
  own test, since it is a validation tightening, not part of the auth slice.

## Sequencing and dependencies

```
PR-1 (provider-independent, lands now)
  └─> PR-2 (needs ADR-0002 §8 Q1 provider answer)
        └─> PR-3 (needs a real principal in the browser)
              ├─> PR-4 (needs ADR-0002 §8 Q3 recipient answer)
              └─> PR-5 (independent hardening)
```

PR-1 is the only PR unblocked today. PR-2 and PR-4 are **blocked on Owner
answers** in ADR-0002 §8 and must not proceed until those are recorded.

## Out of scope (reserved seams, not built)

Organization tenancy / memberships / role hierarchy (ADR-0002 §3.2, §7),
collaborator invitations, recipient SSO, background export workers, and the
screenplay editor mutations tracked in `docs/KNOWN_LIMITATIONS.md`. The
`assertProjectAccess` choke point is the single place these later land.
