# Milestone — frontend authentication (PR-2)

Wires the reviewed PR-1 backend (ADR-0002) to the browser: Clerk identity +
Convex authorization, an authenticated bootstrap, and minimal sign-in/out UI.
Operational setup lives in `docs/CLERK_CONVEX_SETUP.md`.

## Scope (approved)

- `@clerk/react` (exact **6.12.8**; `@clerk/clerk-react` is deprecated). The
  Convex bridge `ConvexProviderWithClerk` ships in `convex/react-clerk` (already
  in `convex@1.42.3`) — no new Convex dependency.
- DOM test harness (exact pins): `@testing-library/react` 16.3.2,
  `@testing-library/dom` 10.4.1, `happy-dom` 20.11.1,
  `@happy-dom/global-registrator` 20.11.1. **Bun stays the test runner** (no
  Vitest); the harness is registered via `bunfig.toml` preload
  (`tests/setup/happydom.ts`).
- `convex/auth.config.ts` (`applicationID: "convex"`, domain from
  `CLERK_JWT_ISSUER_DOMAIN`, `satisfies AuthConfig`).
- `convex/users.ts` — `bootstrap`: no args, identity from `ctx.auth`, calls
  `ensureCurrentUser`, returns the minimal current-user shape, safe to repeat.
- Vite-native env validation (`src/auth/config.ts`); provider wiring in
  `src/main.tsx`; the three-stage `AuthBoundary`; the `ProvisioningGate`;
  minimal sign-in/out UI; `.env.example`.

## Boundary and gating

```
Clerk loading / Convex token sync   → <AuthLoading>  → BootSplash
signed out                          → <Unauthenticated> → SignInScreen (modal)
authenticated                       → <Authenticated> → Provisioner
                                                          → users.bootstrap
                                                          → workspace mounts
```

`ClerkProvider` wraps `ConvexProviderWithClerk` (`useAuth` bridged in). The
workspace — and every protected Convex query — mounts only after
`users.bootstrap` succeeds, so an authenticated Owner with zero projects never
hits "User not provisioned". Provisioning failure renders retry + sign-out and
no workspace.

## Design notes

- Provisioning is an explicit authenticated bootstrap, **not** a side effect of
  first project creation (an Owner may have zero projects).
- **Temporary limitation — path-based bootstrap reference.** The frontend
  references the bootstrap mutation with
  `makeFunctionReference<"mutation">("users:bootstrap")`, which is **not
  end-to-end typed**. `convex/_generated` is intentionally **not committed** in
  this PR: official typed codegen requires a configured Convex deployment (the
  offline path only emits the degraded `AnyApi` stub, which would differ from
  real `convex dev` output). Committing the stub, or hand-writing generated
  files, was explicitly avoided. This is the **only** path-based frontend
  reference and the pattern must not spread to new queries/mutations. It is
  replaced with the typed `api.users.bootstrap` at the follow-up milestone below.
- `ProvisioningGate` is pure (bootstrap + sign-out injected) so it is tested
  without Clerk/Convex context.

## Tests (frontend composition + gating; backend authz already covered by PR-1)

`tests/auth-config.test.ts`, `tests/auth-gate.test.tsx`,
`tests/auth-boundary.test.tsx`: missing config fails clearly; signed-out renders
sign-in and no workspace; loading renders the boot screen; authenticated calls
bootstrap once per mount; workspace mounts only after bootstrap succeeds;
failure renders retry + sign-out; retry re-invokes bootstrap; UserButton appears
only in the authenticated shell; protected children do not mount before
provisioning resolves.

## Non-blocking follow-up (recorded, not solved here)

Whether **absent** Clerk profile claims should **clear** stored
`email`/`displayName`. Current `ensureCurrentUser` updates only when a claim is
present and changed; absent claims never clear (retains last-known). Left as a
decision; not expanded in this PR.

## Known follow-ups

- The main JS chunk grows past the 600 kB warning limit with Clerk added
  (build still succeeds). Code-splitting/lazy-loading is a later optimization.
- Deeper account/settings surfaces, organization UI, and custom credential
  flows are intentionally out of scope.
