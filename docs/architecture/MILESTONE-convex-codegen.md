# Milestone — Convex typed codegen committed

Replaces the temporary path-based bootstrap reference with the typed
`api.users.bootstrap`, backed by committed official `convex/_generated`.
Resolves KNOWN_LIMITATIONS' prior "generated code not committed" item.

## Feasibility gate (Phase A) — passed

Before committing anything, tested the official local path (no cloud account):

- Convex CLI: **1.42.3** (pinned `convex` dependency).
- Command: `bunx convex dev --once` → auto-selected an **anonymous local
  deployment** (downloaded `convex-local-backend`, ran on `127.0.0.1:3210`, wrote
  `CONVEX_DEPLOYMENT`/`VITE_CONVEX_URL` to `.env.local`). One placeholder was
  required so the push validated `auth.config.ts`:
  `bunx convex env set CLERK_JWT_ISSUER_DOMAIN https://dummy.clerk.accounts.dev`
  (non-secret, on the local deployment only).
- Result: push succeeded ("Convex functions ready!") and `convex/_generated/api.d.ts`
  is the **typed** form — imports every function module, `ApiFromModules<{…}>`,
  `FilterApi<typeof fullApi, FunctionReference<any, "public">>` — **not** `AnyApi`.
- Verified end-to-end typing with a negative check: `api.users.doesNotExist` fails
  typecheck, and `api.users.bootstrap` resolves to
  `FunctionReference<"mutation", "public", {}, { id; email; displayName }, …>`.

The offline self-hosted-env workaround (which only produced the degraded `AnyApi`
stub) was **not** used for the committed output.

## Changes

- `.gitignore`: stop ignoring `convex/_generated`.
- `convex/_generated/{api.js,api.d.ts,dataModel.d.ts,server.js,server.d.ts}`:
  committed official typed output. Never hand-edited.
- `src/auth/Provisioner.tsx`: `useMutation(api.users.bootstrap)` (typed), replacing
  `makeFunctionReference("users:bootstrap")`.
- `.oxlintrc.json`: ignore `convex/_generated/**` (generated code is not linted;
  files are not modified).
- `scripts/no-untyped-convex-refs.sh` + `package.json` `check`: repository rule —
  no `makeFunctionReference`/`anyApi` in `src/` (test harnesses under `tests/`
  are exempt).

## Decisions

- **tsconfig `exclude: ["convex/_generated"]` kept.** Imported generated
  declarations still participate through the import graph, and `bun run check`
  remains clean (typed `api` resolves). No demonstrated reason to remove it.
- **No CI deploy key / staleness check** added; deferred until a deliberate CI
  credential and deployment strategy is designed. Regeneration is a documented
  developer step (`bunx convex dev`).
- Local dev artifacts (`.env.local`, `.convex/`) remain gitignored.

## Verification

- Typed-form gate: passed (see above).
- `bun run check` → typecheck + **142 tests** + lint + guard (`OK: no untyped
  Convex references in src/`) + build, all green.
- `rg "makeFunctionReference|anyApi" src/` → empty.

## Follow-ups (unchanged, out of scope)

- CI freshness check for `convex/_generated` once a CI credential/deployment
  strategy exists.
- The `tests/` harnesses (`auth.test.ts`, `auth-boundary.test.tsx`) still use
  `anyApi`/mocks; migrating them to the generated `api` is optional and not part
  of this milestone.
