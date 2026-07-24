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

## Common misconfiguration

If every call is unauthenticated, check that the Clerk integration/template
audience and `auth.config.ts` `applicationID` are both `convex`, and that
`CLERK_JWT_ISSUER_DOMAIN` matches the Clerk Frontend API URL.
