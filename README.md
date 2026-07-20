# GreenlightOS

GreenlightOS turns a living creative project graph into a traceable screenplay, studio bible, production breakdown, department packet, and versioned delivery artifact. The first runnable milestone is the **Compilation Chamber**: a structured document workspace backed by the same pure compiler modules used by exports and Convex persistence.

## Quick start

Requirements: Bun 1.3.14 or newer and a browser with WebGL 2. WebGPU is used when the browser provides a working adapter; rendering falls back to WebGL.

```bash
bun install
bun run dev
```

Run every local verification step:

```bash
bun run check
bun run audit
```

On Windows systems that block PowerShell command shims, invoke `bun.cmd` with the same arguments.

## Convex setup

The schema and transactional compiler/delivery functions live in `convex/`. Connect a development deployment with Bun:

```bash
bunx convex dev
```

For production:

```bash
bun run build
bunx convex deploy
```

Never commit `.env.local` or a deployment credential. The current interface opens with a deterministic fixture so the compiler can be evaluated without an account; the Convex persistence boundary is implemented but must be connected to a deployment before multi-user realtime persistence is available.

## Product workspaces

The application now opens into a responsive SaaS shell rather than directly into the compiler. Its purposeful routes are:

- `/` — an interactive Three.js project orbit that acts as spatial navigation, with WebGPU-to-WebGL fallback and accessible HTML controls
- `/projects` — searchable project and canon portfolio management
- `/screenplay` — mode-aware script editing, scene navigation, validation, and Fountain export
- `/compile` — the full Compilation Chamber with collapsible outline, controls, preview density, and provenance inspector
- `/delivery` — version-preserving Delivery Rooms with access-state controls
- `/settings` — profile, workspace, accessibility, notifications, integrations, and billing/usage settings

Navigation collapses to a compact rail, becomes an off-canvas drawer on smaller screens, and each dense workspace independently hides secondary rails. The visual system uses restrained warm neutrals, a single bronze accent, professional editorial typography, visible focus states, and reduced-motion support.

## Corner assistant

A floating assistant in the lower-right corner operates the interface by typed or spoken command: navigation, compilation profiles, audience and confidentiality, screenplay modes, exports, panel toggles, and live readiness summaries computed from the real quality gates. Voice input and spoken replies use the Web Speech API when the browser provides it; the text path always works. Replies come from a deterministic command interpreter (`src/assistant/commands.ts`) — honestly labeled in the panel, with no fabricated model responses. The assistant never touches canon; canonical changes always pass through the review workflow. A model-backed conversational layer is a documented next step behind the same action interface.

## What the milestone proves

- A canonical snapshot compiles into story, character, relationship, world, lore, production, department, pitch, and Studio Review profiles.
- Every factual block retains field-level source references and truth status.
- Generated connective prose is labeled as inference and never silently becomes canon.
- Section edits become protected document overrides; the generated version remains restorable.
- Character corrections propagate staleness only into dependent draft sections.
- Delivered packages are deep-frozen historical versions.
- Screenplay compilation supports Preserve, Editorial, Development, Production Draft, and Submission modes.
- Fountain and FDX-interchange serializers derive from typed screenplay elements.
- PDF, DOCX, Markdown, HTML, JSON, plain-text, Fountain, and FDX adapters are present.
- Scene breakdown extracts cast, locations, props, water, weather, night work, crowd, effects, safety, language, and cultural-consultation signals for human confirmation.
- Ten explicit quality gates govern readiness, with recorded user overrides.
- Review notes are validated, classified, and held for an explicit authorship decision.

## Resolved direct dependencies

These exact versions were resolved and locked on 2026-07-19. `package.json` intentionally uses exact versions and `bun.lock` is committed as the only package-manager lockfile.

| Runtime dependency | Version |
| --- | ---: |
| React / React DOM | 19.2.7 |
| Vite | 8.1.5 |
| TypeScript | 7.0.2 |
| Tailwind CSS / Vite plugin | 4.3.3 |
| Convex | 1.42.3 |
| TanStack Router | 1.170.18 |
| TanStack Query | 5.101.2 |
| TanStack Virtual | 3.14.6 |
| Motion | 12.42.2 |
| Three.js / React Three Fiber | 0.185.1 / 9.6.1 |
| Zod | 4.4.3 |
| Zustand | 5.0.14 |
| docx / pdf-lib | 9.7.1 / 1.17.1 |
| Bun types | 1.3.14 |
| Vite React plugin | 6.0.3 |
| React Compiler | 1.0.0 |
| Rolldown Babel plugin | 0.2.3 |
| Oxc linter | 1.74.0 |

Vite 8 uses its native Rolldown build pipeline. `vite.config.ts` keeps `build.rolldownOptions` empty until bundle measurements justify project-specific tuning. React Compiler is enabled through the Vite 8/plugin-react 6 Rolldown preset; the R3F frame loop is explicitly kept imperative.

## Repository map

```text
convex/schema.ts                     Persistent compiler and delivery model
convex/compilerPersistence.ts       Atomic compilation and delivery writes
convex/domain/graph/                 Canon snapshots, provenance, structural diffs
convex/domain/screenplay/            Typed script compiler, validation, Fountain, FDX
convex/domain/compiler/              Profiles, composition, gates, impact, breakdowns
convex/domain/delivery/              Frozen delivery packages and review-note decisions
src/app/AppShell.tsx                Responsive SaaS navigation and command surface
src/assistant/                       Corner assistant: interpreter, voice I/O, panel
src/components/OrbMenu.tsx          WebGPU/WebGL interactive project orbit
src/pages/                          Project, screenplay, delivery, and settings workspaces
src/App.tsx                         Compilation Chamber vertical workflow
src/export/                          PDF, DOCX, text, HTML, JSON download adapters
tests/                               Compiler, screenplay, delivery, and export fixtures
```

See [Architecture](./docs/ARCHITECTURE.md) for invariants and data flow, and [Known limitations](./docs/KNOWN_LIMITATIONS.md) for the honest boundary of this milestone.

## Dependency policy

Use Bun only. Check available updates with `bun outdated`, inspect release notes and migrations, then update deliberately with `bun update` and `bun run check`. Run `bun audit` after every dependency change. Do not replace exact production versions with an unbounded `latest` tag.
