# Runtime Environment — reproduce from scratch

How to bring up a complete GreenLit runtime — a live Convex deployment and a
live Clerk application — so the Runtime Acceptance checklist
(`docs/release/RUNTIME_ACCEPTANCE_CHECKLIST.md`) can be executed. This is the
authoritative "reproduce from scratch" runbook; `docs/CLERK_CONVEX_SETUP.md`
covers the auth token flow in more detail.

## Prerequisites

- **Bun** (the only package manager). `bun --version`.
- A **Convex** account (or the anonymous local backend, below).
- A **Clerk** account. Clerk is a hosted identity service; there is no
  offline substitute, and the app cannot authenticate without it.

## 1. Install

```bash
bun install --frozen-lockfile
```

## 2. Convex deployment

Cloud (recommended for shared runtime acceptance):

```bash
bunx convex dev            # log in, create/select a project; serves the backend
```

Anonymous local backend (no cloud account; for local runs and typed codegen):

```bash
CONVEX_AGENT_MODE=anonymous bunx convex dev
```

Either applies `convex/schema.ts` and `convex/auth.config.ts`, regenerates
`convex/_generated`, and prints the deployment URL. Set the Clerk issuer on the
deployment (never commit it):

```bash
bunx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-app>.clerk.accounts.dev
```

## 3. Clerk application

1. Create a Clerk application.
2. Enable the **native Convex integration** (Configure → Integrations → Convex)
   so tokens carry the `convex` audience that `auth.config.ts` pins.
3. Copy the **Frontend API / issuer URL** (used in step 2 above).
4. Copy the **Publishable key**.

## 4. Frontend environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
VITE_CONVEX_URL=<Convex deployment URL from step 2>
VITE_CLERK_PUBLISHABLE_KEY=<Clerk publishable key from step 3>
```

If either is missing the app boots to a clear configuration error
(`src/auth/config.ts` → `ConfigError`), never a blank page.

## 5. Boot

```bash
bunx convex dev     # backend (leave running)
bun run dev         # frontend
```

## 6. Verify the environment

- **Application launches:** the app loads signed-out without manual patching.
- **Authentication works:** sign in through Clerk; `users.bootstrap` provisions
  the user and the workspace mounts.
- **Owner authorization works:** `listProjects` returns only your projects; a
  project id you do not own is rejected server-side (`Forbidden.`).
- **Project creation works:** creating a project persists it and it survives a
  refresh.

Once these pass, proceed to `docs/release/RUNTIME_ACCEPTANCE_CHECKLIST.md`.

## Known environment limitation (CI and sandboxes)

Automated CI and credential-less sandboxes cannot complete this runbook:
Clerk requires a hosted application and keys, and downloading the Convex local
backend can fail behind restrictive egress proxies. In those environments
Static Verification and Audit run, but Runtime Acceptance must be executed in a
real environment provisioned as above and recorded as a sign-off. This is why
the pipeline treats Runtime Acceptance as a manual gate rather than a CI step.
