# Known limitations and next-build priorities

This milestone proves the compiler model and a complete local evaluation path. It does not claim that every production integration is certified.

## Current limitations

- The Compilation Chamber loads a deterministic complex fixture. Authentication (Clerk), the Convex client provider, and owner-scoped project authorization are now wired (see `docs/architecture/ADR-0002-IDENTITY-AND-AUTHORIZATION.md` and `docs/CLERK_CONVEX_SETUP.md`); connecting the workspaces to live Convex queries/subscriptions (replacing the fixture read path) is the next integration pass.
- `convex/_generated` is **not committed yet** because official typed codegen requires a configured Convex deployment. As a temporary measure the single frontend bootstrap call uses a path-based reference (`makeFunctionReference("users:bootstrap")` in `src/auth/Provisioner.tsx`) that is **not end-to-end typed**. The degraded offline `AnyApi` stub is deliberately not committed, and generated files are never hand-written. This path must be replaced with `api.users.bootstrap` once `convex/_generated` is committed, and the pattern must not spread to additional frontend queries/mutations.
- FDX output is well-formed interchange XML and structurally tested, but has not completed round-trip testing in Final Draft. It is labeled **FDX interchange**, not “Final Draft certified.”
- PDF output provides print-safe pages, metadata, section structure, and page numbering. Tagged-PDF accessibility, bookmarks, clickable tables of contents, running section headers, and production-grade image preflight remain.
- DOCX output uses editable semantic headings, paragraphs, page breaks, metadata, and footers. Automatic TOC field refresh, revision tracking, image-caption workflows, and template branding remain.
- Screenplay pagination, locked-page A/B revisions, continued-dialogue pagination, and colored revision pages require a dedicated page-layout engine.
- Editorial Mode currently preserves prose and changes compiler context only. Model-assisted editorial suggestions, development gap generation, and paragraph-selective regeneration require a separately permissioned generation service.
- WebGPU is selected when browser adapter initialization succeeds and falls back to WebGL. GPU simulation and large-graph level-of-detail strategies are not yet implemented.
- Delivery Room permission tables and immutable versions exist, but recipient authentication, signed URLs, watermark rendering, expiry enforcement, access analytics, and comment UI require a deployed backend.
- Production breakdown uses structural links plus reviewable lexical signals. It is not a substitute for an assistant director, production manager, safety officer, lawyer, or cultural consultant.
- PDF and DOCX adapters currently execute client-side. Background export jobs and durable file storage are represented in Convex but not yet connected to a worker service.

## Next-build priorities

1. Configure the first Convex development deployment, run official typed codegen, commit `convex/_generated`, and replace all temporary `makeFunctionReference` usage (currently only `src/auth/Provisioner.tsx`) with the typed `api`.
2. Connect the workspaces to live Convex queries/subscriptions (authentication and owner-scoped permissions are already in place) and retire the fixture read path.
3. Persist the fixture through the translation and canon-approval workflow, then remove the fixture bootstrap from normal sessions.
4. Add the screenplay editor with scene/element mutations, locked pages, revision metadata, and paginated preview.
5. Move PDF/DOCX assembly into durable background export jobs with storage checksums and resumable status events.
6. Add Delivery Room recipient authentication, signed links, expiry, watermarking, access logs, and review-note targets.
7. Validate FDX round trips against supported Final Draft versions and add specification fixtures.
8. Add visual-reference uploads, captions, rights/clearance flags, and department-specific template branding.
9. Add multi-project load tests, TanStack Virtual for very large section and scene lists, and measured Rolldown chunk tuning only if bundle evidence warrants it.
