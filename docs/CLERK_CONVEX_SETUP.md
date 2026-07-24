# Clerk + Convex authentication setup

GreenLit uses **Clerk** for human identity and **Convex** for authorization
(see `docs/architecture/ADR-0002-IDENTITY-AND-AUTHORIZATION.md`). This is the
operational setup for a development or production deployment.

## 1. Clerk

1. Create a Clerk application.
2. Activate the **native Convex integration** in Clerk (Configure → Integrations
   → Convex). This issues tokens with the `convex` audience automatically. A
   manual JWT template named `convex` is a fallback/legacy alternative only.
3. Copy the **Clerk Frontend API / issuer URL** (e.g.
   `https://your-app.clerk.accounts.dev`).
4. Copy the **Publishable key** from Clerk → API keys.

## 2. Convex deployment environment

Set the issuer domain in the Convex deployment (never commit it):

```bash
bunx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
```

`convex/auth.config.ts` reads this and pins `applicationID: "convex"`, which must
match the token audience from the integration/template.

## 3. Frontend environment

Copy `.env.example` to `.env.local` (gitignored) and fill in:

```
VITE_CONVEX_URL=<your Convex deployment URL>
VITE_CLERK_PUBLISHABLE_KEY=<your Clerk publishable key>
```

These are publishable/non-secret and are read Vite-natively via
`import.meta.env`. If either is missing the app boots to a clear configuration
error rather than a blank page.

## 4. Run

```bash
bunx convex dev      # applies schema + auth.config.ts, serves the backend
bun run dev          # serves the frontend
```

The app opens signed-out. After signing in, an authenticated `users.bootstrap`
mutation provisions (or refreshes) the application user before the workspace
mounts.

## Token flow (no app code)

`ConvexProviderWithClerk` (from `convex/react-clerk`, bundled with `convex`)
bridges Clerk's `useAuth().getToken` to the Convex client, attaching and
refreshing the JWT on Convex requests. Convex verifies it against
`auth.config.ts`; server functions then read `ctx.auth.getUserIdentity()`.

## Generated code (`convex/_generated`)

`convex/_generated` is **committed** so clients import the typed `api` and the
repo typechecks without running codegen first.

- Running `bunx convex dev` regenerates it automatically; commit any changes
  under `convex/_generated`. **Never edit generated files by hand.**
- `convex dev` also supports an **anonymous local deployment** that needs no
  cloud account — useful for regenerating typed code locally. The generated
  client (`api`, `dataModel`, `server`) is derived from local schema/functions,
  so it is identical whether produced against a local or cloud deployment.
- A `bun run check` guard (`scripts/no-untyped-convex-refs.sh`) fails if any
  `src/` file uses untyped `makeFunctionReference`/`anyApi` — frontend code must
  reference functions through the typed `api`.
- CI does not currently regenerate or verify freshness of generated code (that
  awaits a deliberate CI credential/deployment strategy); regeneration is a
  documented developer step.

## Common misconfiguration

If every call is unauthenticated, check that the Clerk integration/template
audience and `auth.config.ts` `applicationID` are both `convex`, and that
`CLERK_JWT_ISSUER_DOMAIN` matches the Clerk Frontend API URL.
