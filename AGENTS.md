# GreenLit / Greenlight OS — Agent Constitution

> **Status:** Binding repository-level operating law.
>
> This file governs every human contributor, coding agent, design agent, product agent, research agent, and automated system working in this repository. It is not a mood board, suggestion list, or temporary brief. It defines what GreenLit is, how it must feel, how it must reason, how it must protect canon, and how it must be built.
>
> When a local implementation choice conflicts with this file, this file wins unless the Owner explicitly changes the constitution.

---

## 1. Product definition

GreenLit, also called **Greenlight OS**, is a private, AI-native creative development operating system for serious narrative work.

It is not:

- a generic chatbot with project folders;
- a document editor with AI added to the side;
- a collection of disconnected generation tools;
- a conventional SaaS dashboard;
- a novelty 3D interface;
- a place where fluent AI output is automatically treated as truth.

GreenLit is a **creative development engine, studio room, translation system, and production-intelligence layer**. It turns raw creative intent into coherent, inspectable, production-ready narrative artifacts.

Its core promise is:

> **Raw idea in. Living canon, production intelligence, professional scripts, screenplays, and studio-grade bibles out.**

The system must help one Owner develop an idea from first impulse through structure, character, world, scene, draft, revision, packaging, and production handoff without losing the original emotional signal.

The outputs must be clear enough that producers, directors, executives, department heads, collaborators, and production teams can understand:

- what is being made;
- why it matters;
- how the story works;
- what the work requires;
- what is canonical;
- what remains unresolved;
- how each creative decision connects to the whole.

---

## 2. Authority

### 2.1 The Owner is sovereign

The Owner is the final creative authority.

AI may propose, analyze, challenge, compare, simulate, organize, draft, compile, and surface contradictions. It may not silently redefine the work.

The system exists to strengthen authorship, not replace it.

### 2.2 Order of authority

When instructions conflict, use this order:

1. Explicit current instruction from the Owner.
2. This `AGENTS.md` constitution.
3. Approved canonical project decisions stored by GreenLit.
4. Approved architecture decisions and repository documentation.
5. Existing implementation conventions.
6. Agent preference.

Agent convenience is always last.

### 2.3 Ambiguity

Do not invent permanent product law when the stakes are architectural, irreversible, security-sensitive, destructive, public, or canon-changing.

When ambiguity is reversible, make the smallest coherent choice, document it, and preserve a clean path to change it.

When ambiguity affects canon, ownership, data loss, security, architecture, or public output, obtain Owner approval.

---

## 3. Greenlight constitutional laws

These laws are non-negotiable.

### Law 1 — Canon changes only by Owner approval

Canonical knowledge may never be changed silently.

Every AI-generated or inferred change begins as a **Candidate**. A Candidate may be reviewed, compared, edited, rejected, deferred, superseded, or approved. Only explicit approval promotes it into canon.

No convenience feature, bulk action, background process, import routine, migration, or agent workflow may bypass this rule.

### Law 2 — Candidate before canonical

AI output is not truth merely because it is fluent.

All proposed additions, rewrites, deductions, merges, retcons, conflict resolutions, and reinterpretations remain Candidates until approved.

A Candidate must preserve:

- the proposed change;
- the entity or artifact affected;
- the rationale;
- supporting evidence or source context;
- detected conflicts;
- likely downstream effects;
- the generating agent or model;
- creation time;
- approval state;
- Owner edits;
- final decision.

### Law 3 — The Constitution governs the Kernel

The **Constitution Engine** defines what the system is permitted to do.

The **Greenlight Kernel** orchestrates work inside those laws.

The Kernel may not route around constitutional constraints for speed, convenience, model capability, or a smoother demo.

### Law 4 — Kernel-only orchestration

Complex work must pass through the Greenlight Kernel or a clearly defined kernel service boundary.

UI components must not become hidden orchestration systems. Feature modules must not invent independent canon rules, memory layers, agent protocols, or approval behavior.

There is one coherent orchestration layer with observable specialist engines beneath it.

### Law 5 — Immutable creative history

GreenLit must preserve how a work became what it is.

Use append-first, event-oriented thinking for canon decisions, approvals, reversals, major edits, imports, exports, and agent actions.

The system must be able to answer:

- What changed?
- Who or what proposed it?
- Why was it proposed?
- What evidence supported it?
- Who approved it?
- What did it affect?
- Can the previous state be reconstructed?

Never destroy history merely to make the current interface appear simple.

### Law 6 — One Living Context

Each project has **One Living Context**: a coherent current understanding assembled from canon, approved artifacts, relationships, constraints, unresolved Candidates, evidence, and relevant history.

Agents must not work from isolated snippets when project context exists.

The goal is not maximum tokens. The goal is maximum relevance, continuity, and correctness.

### Law 7 — Living Knowledge Graph

A project is not a folder full of files. It is a living network of meaning.

Characters, scenes, locations, timelines, motifs, themes, relationships, objects, world rules, emotional turns, production requirements, sources, decisions, and artifacts must reference one another.

The graph must support human inspection and machine reasoning.

### Law 8 — Extend, never casually replace

New work must strengthen the existing system rather than create parallel replacements.

Do not create:

- a second canon store;
- a second approval model;
- a second project-context engine;
- a second timeline truth;
- a second export pipeline;
- a second orchestration mechanism;
- a duplicate entity type because integration feels harder.

Refactor toward one stronger system.

### Law 9 — Artifacts over conversation

Conversation is an interaction surface, not the final product.

Valuable dialogue must become durable structure: decisions, Candidates, scene cards, timelines, character records, outlines, scripts, production notes, bibles, reports, and exports.

A productive conversation must leave the project more structured than it found it.

### Law 10 — Precision before speed

GreenLit must feel fast, but it must never manufacture false certainty to appear fast.

Prefer deliberate, inspectable, reversible work over instant opaque output.

No fake progress. No pretend implementation. No placeholder behavior described as complete. No hand-waving around hard systems.

### Law 11 — Explainability is part of the interface

Every meaningful AI action must be explainable at the level appropriate to its impact.

The system must include a **War Room** or equivalent explainability surface where the Owner can inspect evidence, conflicts, affected entities, dependencies, decision history, and a concise reasoning summary.

Explainability must increase trust without drowning the Owner in machine noise.

### Law 12 — Stewardship over novelty

GreenLit is the steward of a creative world.

Novel output is useful only when it preserves intent, continuity, emotional truth, cultural integrity, and project identity.

Random cleverness that weakens the work is not intelligence.

---

## 4. The Apple AI law

GreenLit must always be designed under this standing question:

> **What would Apple have built if deeply capable AI had existed from the first architecture decision?**

This does not mean copying Apple’s visual language. It means holding the system to a standard of coherence, restraint, integration, trust, and human-centered intelligence.

### 4.1 AI is foundational, not attached

AI must be embedded in the information architecture, data model, interaction model, and system behavior from the beginning.

There must be no normal application with a chat panel pretending to be AI-native.

### 4.2 Intelligence should be present before it is announced

The best intelligence is often invisible:

- the right context is already present;
- contradictions surface at the correct moment;
- related material gathers around the current task;
- approved decisions are remembered;
- repetitive work collapses automatically;
- downstream effects are predicted before damage occurs;
- the interface becomes simpler as the system becomes smarter.

Do not make the Owner repeatedly summon intelligence the system should already know is needed.

### 4.3 Direct manipulation first

The Owner must be able to touch, move, connect, open, compare, approve, reject, and reshape the work directly.

Natural language is important, but it must not be the only way to operate the product.

Chat is not an excuse for weak interface design.

### 4.4 Progressive disclosure

Show the minimum needed to understand and act, then reveal depth on demand.

The product must support enormous complexity without looking complicated at first glance.

Advanced controls must exist, but they should emerge in context rather than dominate every screen.

### 4.5 Continuity by default

The system should remember where the Owner was, what was being developed, what remains unresolved, and what changed elsewhere.

Moving from scene to character to timeline to bible must feel like moving through one living object, not switching between unrelated applications.

### 4.6 Human sovereignty

The Owner must always know when AI is proposing, when canon is changing, when information is inferred, and when an action affects downstream work.

There must always be a clear path to inspect, undo, reject, revise, or defer.

### 4.7 Personal scale, industry standard

The experience is optimized for a single Owner. The outputs must withstand professional industry scrutiny.

The application may feel intimate and personal. The artifacts may not feel amateur.

### 4.8 Deep integration without lock-in

GreenLit should integrate its systems deeply while preserving portability.

Support durable exports, clear schemas, and professional or open interchange formats. Never hold creative work hostage to the interface.

### 4.9 Trust is designed, not claimed

Trust comes from predictable behavior, visible boundaries, provenance, permissions, reversibility, and quality—not marketing language.

---

## 5. The technology law

Technology must disappear into capability.

### 5.1 No technology for spectacle alone

WebGPU, Three.js, Motion, AI models, streaming, graphs, and spatial interfaces must earn their place.

Use advanced technology when it makes relationships clearer, interaction more natural, navigation faster, or emotional comprehension stronger.

Do not add effects merely to advertise the stack.

### 5.2 One coherent system

The product must feel authored by one intelligence.

Navigation, motion, language, data behavior, approvals, errors, loading, exports, and AI actions must share the same principles.

### 5.3 Complexity belongs beneath the surface

The architecture may be sophisticated. The Owner should not be forced to manage that sophistication.

The interface absorbs complexity and returns clarity.

### 5.4 Latest stable, not fashionable unstable

Use the latest stable, production-appropriate versions of the approved stack.

Do not upgrade blindly. Verify compatibility, migration impact, runtime behavior, security, and build output.

Experimental dependencies require a documented reason and contained failure surface.

### 5.5 No sloppy prototypes

Code must be real, secure, modular, typed, testable, and scalable from the first committed implementation.

A vertical slice may be small. It may not be fake.

Do not commit pretend services, decorative dead buttons, fabricated AI responses, impossible TODO promises, or hardcoded demos presented as functioning systems.

---

## 6. Product experience

### 6.1 The operating-system metaphor

GreenLit should feel like entering an intelligent creative environment, not opening a website.

The Owner is not merely navigating pages. The Owner is entering states of creative attention.

Modules must feel like views into one living project rather than separate tools.

### 6.2 The translation engine

The interface should feel like an entity translating between:

- intuition and structure;
- emotion and narrative mechanics;
- fragments and canon;
- story and production;
- private creative language and professional studio language;
- imagination and executable artifact.

The system does not merely store information. It continuously translates meaning while preserving authorship.

### 6.3 The command deck

The primary environment is a living command deck where the Owner can:

- see the current state of the work;
- speak or type intent;
- enter focused creative modes;
- inspect project health;
- review Candidates;
- move through relationships spatially;
- open the living bible;
- compare versions;
- understand unresolved contradictions;
- compile production-ready artifacts.

The command deck must not become a wall of widgets.

### 6.4 Calm at rest, alive under attention

At rest, the interface should feel quiet, controlled, and suspended.

When attention moves, the system reveals intelligence through subtle motion, depth, connection, and contextual response.

Nothing should pulse, glow, rotate, or animate without communicative purpose.

### 6.5 No dead ends

Every important object should answer:

- What is this?
- Why does it matter?
- What is it connected to?
- What changed?
- What can I do next?

The Owner must never be stranded in a static report with no path back into the living project.

### 6.6 The Gold Path

GreenLit must provide a **Gold Path Navigator**: a clear, adaptive route from the project’s current state to the next meaningful milestone.

The Gold Path is not a rigid wizard. It is a context-aware guide that understands what exists, what is missing, what is contradictory, and what must be approved before the next stage is trustworthy.

---

## 7. Visual design philosophy

### 7.1 Core visual statement

The target feeling is:

> **Jarvis-like intelligence meets the analytical spatial interfaces of a Bourne-style operations room, stripped of military clutter and transformed into a dark, ethereal, free-flowing creative entity.**

The interface should feel almost formless: a node-based system suspended in dark space, organizing itself around the Owner’s attention.

It should feel cinematic, precise, intelligent, and alive—but never like a game HUD, hacker cliché, or generic cyberpunk dashboard.

### 7.2 Darkness is spatial material

Darkness is not merely a background color. It is negative space, depth, silence, and focus.

Use near-black and deep low-chroma fields to create boundless space. Surfaces should emerge from darkness only when they have meaning.

Avoid flat enterprise-gray panels covering the viewport.

### 7.3 Light is information

White and blue-white light represent focus, activation, relation, and intelligence.

Accent color must be used with restraint. A bright edge, soft bloom, or thin connective line should carry meaning.

Do not flood the product with neon.

### 7.4 Ethereal, not ornamental

Glass, blur, haze, bloom, particles, refraction, and depth may be used only to communicate hierarchy, focus, state, or spatial relationship.

Avoid decorative glassmorphism on every container.

### 7.5 Node-based, but not diagram software

The system may use nodes, constellations, threads, and spatial groupings to reveal relationships.

It must not feel like generic flowchart software.

Nodes should behave like living concentrations of meaning. Visual weight, proximity, and movement should reflect importance, activity, conflict, or connection.

### 7.6 Form follows attention

The interface should reorganize around the task.

A character-focused state may pull relationships, scenes, arcs, motifs, and unresolved Candidates into orbit. A scene-focused state may surface timeline position, characters present, emotional function, production requirements, and canon dependencies.

Do not force every mode into the same rigid grid.

### 7.7 Cinematic resolution

The system must feel considered on high-density, large-format displays while remaining usable on standard laptops.

Support cinematic 2K/4K presentation without depending on a giant monitor.

### 7.8 Typography

Typography must feel editorial, precise, and calm.

Use strong hierarchy, generous breathing room, excellent line length, and clear distinctions between canon, Candidate, metadata, annotation, and generated text.

Avoid science-fiction novelty fonts for primary reading.

Long-form writing prioritizes readability over spectacle.

### 7.9 Density

Information density should be adaptive.

Analytical modes may become dense, but density must be structured through grouping, hierarchy, progressive disclosure, and spatial logic.

Do not equate professional depth with visual clutter.

### 7.10 Color semantics

Color must have stable meaning across the product.

Establish distinct, accessible semantics for:

- canonical;
- Candidate;
- approved;
- rejected;
- conflict;
- warning;
- source or evidence;
- active selection;
- generated or inferred content;
- unresolved state.

Never use color as the only indicator.

### 7.11 Visual anti-patterns

Do not ship:

- generic admin dashboards;
- rows of equal-weight cards;
- excessive borders;
- giant gradient blobs without information value;
- constant ambient animation;
- cyberpunk neon overload;
- fake terminal language;
- tiny unreadable metadata;
- overused pills and badges;
- novelty cursor behavior;
- 3D scenes that obscure basic navigation;
- menu structures that isolate tightly connected creative objects.

---

## 8. Motion philosophy

Motion is a language of continuity.

### 8.1 Motion must explain

Animation should communicate one or more of:

- origin and destination;
- relationship;
- state change;
- hierarchy;
- continuity;
- approval or rejection;
- expansion of detail;
- transfer from Candidate to canon;
- consequence propagation.

If an animation communicates nothing, remove it.

### 8.2 Preserve object identity

Objects should transition rather than disappear and reappear whenever possible.

When a scene card opens into a scene workspace, it should feel like the same object gaining depth.

### 8.3 Physical confidence

Motion should feel controlled, weighted, and precise.

Avoid bouncy consumer-app animation unless a specific interaction truly calls for it.

### 8.4 Reduced motion

Every meaningful workflow must remain fully usable with reduced motion enabled.

Reduced motion is not an afterthought or broken substitute.

### 8.5 Performance

Motion must remain smooth under realistic project load. Never trade input responsiveness for ambient effects.

---

## 9. Spatial systems, Three.js, and WebGPU

### 9.1 Purpose

Spatial rendering exists to reveal relationships that are harder to understand in flat lists.

Good uses include:

- living knowledge graphs;
- timeline constellations;
- character relationship fields;
- motif propagation;
- project-health topology;
- context orbit around a focused entity;
- downstream effects of a Candidate.

### 9.2 Progressive enhancement

Core creative work must never depend entirely on WebGPU availability.

The Owner must still be able to read, write, approve, search, inspect, and export without advanced rendering.

### 9.3 Interaction

Spatial scenes must support keyboard navigation, visible focus, selection inspection, disciplined zoom, and clear paths back to conventional views.

### 9.4 Restraint

Do not create a 3D universe when a clear 2D relationship view is better.

### 9.5 Resource discipline

Pause or reduce expensive rendering when hidden, backgrounded, out of view, or unnecessary.

Dispose resources correctly. Avoid memory leaks, runaway frame loops, and battery-hostile idle behavior.

---

## 10. Approved technical stack

The primary stack is:

- **Bun** for package management, scripts, and compatible runtime tooling;
- **React** for the interface;
- **Vite with the Rolldown-based toolchain** for development and production builds;
- **TypeScript in strict mode**;
- **Tailwind CSS** for design-token-driven styling;
- **Convex** as the primary backend, reactive database, server-function, and durable application-state platform;
- **TanStack** libraries where they provide clear value for routing, server-state coordination, tables, virtualization, or related infrastructure;
- **Motion** for interface animation and continuity;
- **Three.js and WebGPU** for purposeful spatial visualization;
- **Playwright** for critical end-to-end validation.

Use the latest stable, mutually compatible versions.

### 10.1 Bun is the package authority

Use Bun commands and the Bun lockfile.

Do not introduce npm, Yarn, or pnpm lockfiles.

Repository instructions, CI, and scripts must be Bun-first.

### 10.2 Convex is the primary backend

Do not introduce parallel Express, Drizzle, or PostgreSQL application architecture unless the Owner explicitly approves an architecture change.

Convex schemas, queries, mutations, actions, indexes, scheduled functions, and access rules are first-class production infrastructure.

### 10.3 Strict boundaries

Separate:

- domain logic;
- orchestration;
- persistence;
- model and provider integration;
- UI state;
- presentation;
- export generation;
- authorization;
- analytics;
- observability.

UI components must not contain hidden business law.

### 10.4 Domain-first organization

Organize around product domains rather than file-type dumping grounds.

Expected domains include:

- kernel;
- constitution;
- candidates;
- approvals;
- canon;
- projects;
- context;
- knowledge graph;
- characters;
- scenes;
- timelines;
- worlds;
- motifs;
- themes;
- artifacts;
- scripts;
- bibles;
- exports;
- provenance;
- War Room;
- Review Queue;
- reference workloads.

### 10.5 Types are product law

Use strong domain types and validated schemas.

Avoid `any`, vague string maps, unvalidated JSON blobs, and booleans whose meaning changes by context.

Represent state explicitly with discriminated unions or equivalent typed models.

### 10.6 Deterministic core, probabilistic edges

AI generation may be probabilistic.

Canon rules, approval transitions, permissions, event recording, artifact versioning, and export assembly must be deterministic and testable.

### 10.7 Provider independence

Model providers are replaceable capabilities behind adapters.

Do not bind domain objects to one provider’s response format.

Preserve model identity, parameters, and provenance for generated Candidates while keeping project schemas provider-neutral.

---

## 11. The Greenlight Kernel

The Kernel coordinates intent, context, tools, specialist engines, and results.

### 11.1 Responsibilities

The Kernel must:

- interpret user intent;
- determine required context;
- consult the Constitution Engine;
- route work to specialist engines;
- gather evidence;
- create Candidates rather than silent canon mutations;
- coordinate multi-step work;
- track progress and failure;
- record meaningful events;
- return artifacts and next actions;
- expose an understandable summary of what happened.

### 11.2 The Kernel must not

The Kernel must not:

- conceal unresolved conflicts;
- promote its own output to canon;
- invent missing approval;
- skip provenance;
- become an untestable monolith;
- perform every specialist task internally;
- dump raw model output directly into the product;
- treat an API success response as a successful creative result.

### 11.3 Specialist engines

Specialist engines may include:

- Character Engine;
- Scene Engine;
- Timeline Engine;
- World Engine;
- Theme and Motif Engine;
- Emotional Mechanics Engine;
- Continuity Engine;
- Structure Engine;
- Dialogue Engine;
- Research and Source Engine;
- Production Intelligence Engine;
- Script Compiler;
- Bible Compiler;
- Export Engine;
- Quality and Contradiction Engine.

Each engine must have a clear contract, typed inputs and outputs, observable behavior, and constitutional boundaries.

---

## 12. The Constitution Engine

The Constitution Engine enforces global and project-specific law.

It should distinguish:

- global GreenLit law;
- project-specific creative laws;
- format requirements;
- canon constraints;
- cultural and research constraints;
- Owner preferences;
- temporary task instructions.

It must support inspection and versioning.

A project constitution may include tone, genre, cultural grounding, prohibited shortcuts, motif rules, character laws, structure requirements, production ambitions, and quality bars.

Project law must guide generation and evaluation. It must not sit as passive text nobody reads.

---

## 13. Canon, Candidates, and approval

### 13.1 Canon

Canon is approved project truth.

Canon must be versioned, attributable, queryable, and linked to approval history.

### 13.2 Candidates

Candidates are proposed truth, change, or interpretation.

Candidate states should be explicit:

- draft;
- ready for review;
- approved;
- rejected;
- superseded;
- deferred;
- conflicted.

### 13.3 Approval UX

Approval must not be a blind green button.

The review surface should show:

- before and after;
- rationale;
- evidence;
- conflict warnings;
- affected artifacts;
- downstream consequences;
- alternatives when relevant;
- ability to edit before approval.

### 13.4 No approval fatigue

Do not force the Owner to approve meaningless machine micro-actions one by one.

Batch related changes when they share intent and consequences while retaining item-level inspectability.

The goal is sovereignty without bureaucracy.

### 13.5 Reversal

Approved changes must be reversible through a new recorded decision, never by erasing history.

---

## 14. One Living Context

### 14.1 Context assembly

Context should be assembled from:

- current task;
- focused entities;
- approved canon;
- relevant graph neighbors;
- active project constitution;
- unresolved Candidates;
- recent decisions;
- artifact versions;
- sources and evidence;
- Owner preferences relevant to the task.

### 14.2 Context quality

Every context pack should optimize for:

- relevance;
- recency;
- canonical status;
- source authority;
- contradiction awareness;
- token efficiency;
- privacy;
- reproducibility.

### 14.3 Context visibility

The Owner should be able to inspect a human-readable summary of what context informed a meaningful result.

### 14.4 No memory theater

Never imply the system remembers information it cannot retrieve or verify.

---

## 15. Living Knowledge Graph

### 15.1 Graph entities

Support first-class entities such as:

- project;
- character;
- relationship;
- scene;
- sequence;
- act;
- episode;
- season;
- timeline event;
- location;
- world rule;
- faction;
- object;
- motif;
- theme;
- emotional beat;
- conflict;
- question;
- source;
- decision;
- Candidate;
- artifact;
- production requirement.

### 15.2 Graph relationships

Relations must be typed and meaningful, not generic unlabeled edges.

Examples:

- appears in;
- causes;
- contradicts;
- foreshadows;
- resolves;
- mirrors;
- inherits;
- knows;
- conceals from;
- transforms into;
- depends on;
- sourced from;
- approved by;
- represented in artifact;
- requires for production.

### 15.3 Temporal truth

Distinguish story chronology, narrative order, revision history, and production schedule. They are not the same timeline.

### 15.4 Graph integrity

Validate graph updates. Prevent orphaned relationships, impossible references, and silent destructive cascades.

---

## 16. Creative intelligence

Story development is not a sequence of text-generation tasks. It is the construction of emotional, thematic, causal, cultural, and production coherence.

### 16.1 Preserve the signal

At every stage, protect the original emotional reason the work exists.

Structure should clarify the signal, not sterilize it.

### 16.2 Emotional mechanics

The system should model how narrative devices can evoke:

- fear;
- tension;
- grief;
- joy;
- desire;
- empathy;
- dread;
- release;
- awe;
- shame;
- intimacy;
- alienation;
- transformation.

It should understand mechanisms including:

- anticipation;
- uncertainty;
- dramatic irony;
- identification;
- withheld information;
- rupture of pattern;
- sensory specificity;
- silence;
- repetition and variation;
- proximity;
- helplessness;
- reversal;
- sacrifice;
- recognition;
- contradiction between what is said and felt;
- violation of intimacy;
- escalation through consequence rather than volume.

This intelligence exists to serve authored creative work.

The product must never covertly manipulate the Owner, use dark patterns, or engineer emotional dependence. Creative intensity inside the work must not be flattened merely because it is intense.

### 16.3 Human mechanics are contextual

Do not reduce people to simplistic psychological levers.

Emotion depends on character, culture, relationship, history, expectation, embodiment, and point of view.

### 16.4 Character arcs

Track:

- external objective;
- internal need;
- wound;
- defense;
- contradiction;
- fear;
- desire;
- lie;
- truth;
- relationships;
- agency;
- choices;
- consequences;
- transformation.

Do not confuse biography with character depth.

### 16.5 Agency

Characters must make consequential choices.

Plot should not merely happen to them because an outline demands it.

### 16.6 Theme through action

Theme must emerge through pressure, choice, consequence, image, relationship, and structure—not speeches explaining the author’s intent.

### 16.7 Motifs evolve

Recurring images, sounds, objects, gestures, phrases, and spatial patterns must change meaning through repetition.

A motif repeated without development is decoration.

### 16.8 Every scene earns existence

A scene should normally perform at least two meaningful jobs, such as:

- advancing plot;
- revealing character;
- shifting relationship;
- deepening theme;
- creating consequence;
- planting or paying off information;
- altering emotional pressure.

### 16.9 Every scene leaves a bruise

A strong scene leaves residue: a changed relationship, new question, altered risk, emotional wound, image, decision, or irreversible knowledge.

### 16.10 Silence is dialogue

Absence, delay, gesture, avoidance, interruption, and withheld response can carry as much meaning as spoken language.

Do not overwrite subtext.

---

## 17. Cultural and psychological integrity

### 17.1 Culture before genre extraction

When a story is culturally grounded, ordinary life, language, behavior, food, family structure, place, humor, rhythm, and social reality must exist before genre elements consume the representation.

Culture is not production design for horror, fantasy, or spectacle.

### 17.2 Specificity over generic atmosphere

Research and represent specific communities, histories, languages, and practices carefully.

Flag uncertainty. Preserve sources. Do not invent confidence.

### 17.3 No diagnosis as shorthand

Do not use mental-health diagnosis as lazy shorthand for danger, supernatural sensitivity, instability, or narrative unreliability.

Distinguish shared supernatural events, subjective experience, grief, trauma, and clinical conditions with precision.

### 17.4 No flattening through safety theater

Support visceral, disturbing, intense, mature, and morally complex creative work when that is the Owner’s intent.

Do not sanitize the work into blandness. The standard is purposeful intensity, not harmlessness.

### 17.5 No imitation dependency

Use cinematic references to identify craft qualities, not to imitate a living creator’s exact style.

Translate references into concrete attributes such as restraint, tonal control, visual logic, subtext, escalation, sound design, cultural specificity, or structural daring.

---

## 18. Prestige creative quality bar

The target is production-grade, auteur-capable, prestige-level work suitable for serious producers and studios.

“A24-level” is a quality signal, not a template. It means bold identity, emotional truth, formal control, cultural specificity, production awareness, and confidence in silence and ambiguity.

### 18.1 Horror and suspense

- Horror is never decorative.
- The emotional story and horror story must be the same story.
- Disturbing elements should arise from existing emotional fractures.
- Intelligence is preferred over empty spectacle.
- Escalation should increase meaning and consequence, not only volume.
- Familiar voices, faces, spaces, and relationships can become terrifying because intimacy is understood precisely.
- Camera language should be restrained and producible.
- Sound and silence are narrative architecture.

### 18.2 Screenplay prose

Action lines must be concise, visual, playable, and production-aware.

Avoid novelistic interior explanation that cannot be filmed.

Dialogue should carry character, culture, objective, rhythm, and subtext.

### 18.3 Naturalism

Performances should feel lived rather than expositional.

Characters should not speak solely to deliver lore, theme, or backstory.

### 18.4 Production imagination

Creative development must include awareness of:

- location;
- cast;
- schedule;
- visual effects;
- practical effects;
- sound;
- costume;
- props;
- stunts;
- cultural consultation;
- budget pressure.

Production awareness must not crush the creative core.

---

## 19. Artifact system

Artifacts are durable, versioned manifestations of project intelligence.

### 19.1 Required artifact classes

GreenLit should support creation and compilation of:

- premise and concept documents;
- loglines and synopses;
- treatments;
- beat sheets;
- sequence outlines;
- scene outlines;
- character breakdowns;
- character bibles;
- relationship maps;
- world bibles;
- mythology and rules documents;
- timeline reports;
- theme and motif reports;
- research dossiers;
- screenplay drafts;
- teleplays;
- approved scripted formats;
- series bibles;
- feature-film studio bibles;
- production bibles;
- pitch-facing documents;
- revision reports;
- continuity reports;
- production-requirement reports;
- export-ready PDFs;
- professional interchange formats.

### 19.2 Studio Bible Compiler

The Studio Bible Compiler is a central product capability, not an afterthought.

It must compile approved project intelligence into a coherent, deeply detailed document that lets a professional reader understand:

- what the project is;
- why it matters;
- tone and audience;
- format and scope;
- story engine;
- world and rules;
- character system;
- season, feature, or episode architecture;
- themes and motifs;
- visual and sonic language;
- cultural foundation;
- production implications;
- unresolved development questions;
- source and version provenance.

A bible must read as one authored object, not a database dump.

### 19.3 Script Compiler

The Script Compiler must transform approved narrative structure and scene work into professionally formatted scripts or screenplays while preserving:

- canonical names and facts;
- scene order;
- chronology distinctions;
- dialogue attribution;
- formatting rules;
- revision history;
- scene identifiers;
- production notes where appropriate;
- traceability to source entities.

### 19.4 Compilation is not concatenation

A compiler must resolve repetition, hierarchy, transitions, conflicts, missing sections, and audience needs.

It must not merely paste records together.

### 19.5 Artifact provenance

Every compiled artifact should preserve:

- project version;
- canon snapshot;
- generation time;
- approved source entities;
- unresolved warnings;
- compiler version;
- export format;
- optional model-contribution metadata.

### 19.6 Professional export

Exports must be clean, legible, correctly paginated, and usable outside GreenLit.

Never expose internal UI decoration, debug labels, database IDs, or agent scaffolding in professional documents unless intentionally requested.

---

## 20. War Room and governance

### 20.1 War Room

The War Room is the system’s high-trust analytical environment.

It should reveal:

- project health;
- canon conflicts;
- unresolved Candidates;
- timeline contradictions;
- character-arc gaps;
- scene-function weaknesses;
- orphaned motifs;
- unsupported research claims;
- artifact drift;
- downstream consequences;
- recent agent activity;
- quality-gate status.

### 20.2 Review Queue

The Review Queue should make approval calm and efficient.

It must support filtering, grouping, comparison, batch review, impact preview, and deep inspection.

### 20.3 Governance dashboard

Governance is not corporate bureaucracy. It is creative trust infrastructure.

The dashboard must help the Owner understand the state of the world without becoming an administrative burden.

---

## 21. Agent operating protocol

Every agent working in this repository must follow this protocol.

### 21.1 Before acting

1. Read this file.
2. Inspect relevant code and documentation.
3. Identify the current source of truth.
4. Determine whether the action affects canon, architecture, security, data, exports, or public interfaces.
5. Reuse existing systems before creating new ones.
6. Determine the smallest complete vertical slice.

### 21.2 During work

1. Keep changes coherent and scoped.
2. Use real implementations.
3. Preserve types, provenance, and state transitions.
4. Add or update tests with behavior.
5. Handle loading, empty, error, unauthorized, conflict, and degraded states.
6. Avoid hidden side effects.
7. Record decisions future agents need.
8. Do not silently change public contracts.

### 21.3 After work

1. Run formatting, linting, type checking, tests, and builds relevant to the change.
2. Verify the actual user path, not only isolated functions.
3. Confirm accessibility and reduced-motion behavior for UI changes.
4. Confirm migration and rollback behavior for schema changes.
5. Confirm provenance and approval behavior for AI changes.
6. Summarize what changed, why, what was verified, and what remains.

### 21.4 Agent language

Be direct and specific.

Do not claim completion when only scaffolding exists.

Do not call work “production-ready” unless it passed the applicable gates.

### 21.5 No silent scope collapse

When a request is large, do not quietly deliver a thin approximation while describing it as complete.

Define a real phase boundary and finish that phase properly.

---

## 22. Coding standards

### 22.1 TypeScript

- Strict mode is mandatory.
- Avoid `any`.
- Validate external data at boundaries.
- Prefer explicit domain types.
- Use exhaustive handling for state machines and discriminated unions.
- Do not suppress errors without documented justification.

### 22.2 React

- Keep render logic pure.
- Avoid effect-driven state when derived or event-driven logic is clearer.
- Keep domain logic out of presentation components.
- Prefer composition over giant configurable components.
- Preserve accessibility semantics.
- Treat suspense, streaming, and optimistic UI as product behavior, not decoration.

### 22.3 Tailwind

- Use shared design tokens and semantic utilities.
- Avoid arbitrary-value sprawl.
- Do not repeat one-off visual decisions.
- Keep class composition readable.
- Build primitives that preserve the GreenLit visual language.

### 22.4 Convex

- Validate all arguments and return shapes.
- Define indexes intentionally.
- Avoid unbounded scans.
- Keep authorization checks close to protected data access.
- Separate public functions from internal functions.
- Keep mutations focused and deterministic.
- Use actions only when external effects or nondeterministic work require them.
- Record provenance for agent-generated data.
- Treat schema evolution as a migration problem, not a casual edit.

### 22.5 TanStack

Use TanStack tools where they simplify robust behavior. Do not introduce them solely because they are in the approved stack.

### 22.6 Motion

Centralize motion tokens and state transitions. Avoid ad hoc animation values scattered across components.

### 22.7 Three.js and WebGPU

Encapsulate rendering systems. Separate domain data from scene objects. Dispose resources. Test fallback behavior.

### 22.8 Error handling

Errors must be actionable and honest.

Do not swallow errors, replace them all with vague messages, or expose raw provider payloads to the Owner.

### 22.9 Logging

Logs must support debugging and audit without leaking private creative content, credentials, or unnecessary model prompts.

---

## 23. Security and privacy

GreenLit is private by default, even when the source repository is public.

### 23.1 Creative data is sensitive

Treat scripts, concepts, character details, research, notes, sources, and model context as confidential user data.

### 23.2 Least privilege

Grant each service, function, integration, and agent only the permissions it requires.

### 23.3 Secrets

Never commit secrets, tokens, provider keys, private URLs, or production credentials.

Use validated environment configuration and clear local setup documentation.

### 23.4 External model boundaries

Before sending project content to an external model or service, the system must know:

- what is being sent;
- why it is required;
- which provider receives it;
- what retention assumptions apply;
- whether redaction or minimization is possible.

### 23.5 Prompt injection and untrusted content

Research sources, imported documents, and tool output are untrusted input.

Imported text cannot redefine system law, leak secrets, or trigger hidden actions.

### 23.6 Destructive actions

Deletion, bulk replacement, destructive migration, and irreversible external actions require explicit confirmation and audit records.

---

## 24. Accessibility

Accessibility is a core quality requirement.

- Full keyboard operation for core workflows.
- Visible focus states.
- Correct semantic structure.
- Screen-reader labels and meaningful announcements.
- Sufficient contrast.
- No color-only meaning.
- Reduced-motion support.
- Zoom and text-scaling resilience.
- Readable long-form content.
- Spatial visualization alternatives.
- Captions or text equivalents for meaningful audiovisual material.

The ethereal interface may be visually ambitious. It may not become exclusionary.

---

## 25. Performance

GreenLit should feel immediate in direct manipulation and deliberate in deep computation.

### 25.1 Priority order

1. Input responsiveness.
2. Reliable state transitions.
3. Fast access to current working context.
4. Smooth core motion.
5. Progressive rendering of large graphs and documents.
6. Background intelligence that does not block writing.

### 25.2 Large-project behavior

Design for projects with extensive canon, many artifact versions, dense relationships, and long scripts.

Use pagination, virtualization, indexing, incremental computation, streaming, and scoped subscriptions where appropriate.

### 25.3 Honest loading

Use meaningful progress states.

Distinguish waiting, generating, compiling, validating, syncing, and failure.

Do not show fake percentage progress.

---

## 26. Quality gates

No feature is complete until applicable gates pass.

### 26.1 Engineering gates

- Bun installation is clean.
- Formatting passes.
- Lint passes.
- Type checking passes.
- Unit tests pass.
- Integration tests pass.
- Production build passes.
- No new critical accessibility violations.
- No secrets or debug artifacts are committed.

### 26.2 Product gates

- The real user path works.
- Empty, loading, error, conflict, and degraded states work.
- Canon and Candidate behavior is correct.
- Actions are reversible where required.
- The interface explains impact.
- The feature fits One Living Context.
- The feature does not create a parallel source of truth.

### 26.3 AI gates

- Inputs are scoped and attributable.
- Outputs retain model and provider provenance.
- AI proposals remain Candidates until approval.
- Unsupported assertions are flagged.
- Contradictions are surfaced.
- Failure cannot corrupt canon.
- Retry behavior cannot duplicate events or Candidates.

### 26.4 Artifact gates

- Content is coherent rather than concatenated.
- Formatting matches the target professional format.
- Canon snapshot and version are known.
- Missing or unresolved material is disclosed.
- Export is legible and portable.
- The artifact can be understood outside the application.

---

## 27. Reference workload

GreenLit must maintain at least one demanding end-to-end reference workload:

> **EKPO Reference Workload 001**

The workload proves the system can carry a complex narrative project through:

1. ingestion;
2. canon extraction;
3. project constitution;
4. character and relationship modeling;
5. world and timeline modeling;
6. scene development;
7. Candidate generation;
8. approval;
9. contradiction detection;
10. screenplay compilation;
11. studio-bible compilation;
12. professional export;
13. revision without loss of history.

Do not expose private story content in public fixtures. Use sanitized or synthetic data where repository visibility requires it.

A feature that works in isolation but breaks the reference workload is not complete.

---

## 28. Repository and Git workflow

### 28.1 Default branch

The repository currently uses `master` as its default branch unless the Owner deliberately changes it.

### 28.2 Commits

Commits should be atomic, understandable, and truthful.

Use messages that explain the product or system change.

Do not mix unrelated formatting, architecture, feature, and content changes in one commit.

### 28.3 Branches and pull requests

Substantial work should use a focused branch and pull request containing:

- purpose;
- constitutional impact;
- architecture notes;
- screenshots or recordings for interface work;
- test evidence;
- migration notes;
- known limitations.

### 28.4 No destructive Git behavior

Do not force-push shared branches, rewrite public history, delete branches containing unmerged work, or overwrite files without inspection unless explicitly directed by the Owner.

### 28.5 Generated files

Do not commit large generated artifacts, local model output, caches, secrets, or build products unless the repository intentionally versions them.

---

## 29. Documentation law

Documentation must describe the system that actually exists.

Keep architecture decisions, schemas, environment requirements, workflows, and quality gates current.

Do not leave aspirational documentation claiming unimplemented features.

When behavior changes, update relevant documentation in the same change.

---

## 30. Definition of done

A GreenLit feature is done only when:

- it solves the intended Owner problem;
- it aligns with this constitution;
- it integrates with existing systems rather than duplicating them;
- it uses real data and real state transitions;
- it preserves canon governance;
- it is typed, validated, tested, and documented;
- it handles failure and edge states;
- it respects privacy and security;
- it is accessible;
- it performs at realistic project scale;
- it leaves an audit trail where required;
- it produces or improves a durable artifact;
- it has been verified through the actual user workflow;
- it does not describe itself as more complete than it is.

---

## 31. Final agent test

Before committing any meaningful decision, ask:

1. Does this preserve the Owner’s sovereignty?
2. Is this a Candidate or canon, and is that state explicit?
3. Does this strengthen One Living Context?
4. Does this extend the system instead of creating a duplicate?
5. Can the Owner understand what happened and why?
6. Does the interface reduce complexity rather than display it?
7. Is AI invisible where it should be and inspectable where it matters?
8. Does the design feel like a living translation engine rather than a dashboard?
9. Does the output preserve emotional truth and cultural specificity?
10. Can this ultimately contribute to a professional script, screenplay, or studio bible?
11. Is the implementation real, typed, secure, modular, scalable, and tested?
12. Would this survive the EKPO reference workload?
13. Is this the most coherent GreenLit solution rather than the fastest local patch?

If the answer to an essential question is no, the work is not ready.

---

## 32. The standard

GreenLit must be built to the utmost of our coding, design, and creative abilities.

No sloppy prototypes.

No pretend code.

No hand-waving.

No silent canon changes.

No disconnected intelligence.

No interface clutter disguised as power.

No beautiful surface hiding a weak system.

No powerful system trapped behind an ugly or confusing surface.

Build a coherent creative operating system in which intelligence, design, data, governance, and authorship behave as one entity.
