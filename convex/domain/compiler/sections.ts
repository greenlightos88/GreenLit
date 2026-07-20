/**
 * Section builders for the story-facing bibles (sections 51): story, character,
 * relationship, world, and lore bibles.
 */

import type { CanonSnapshot, SourceRef } from "../graph/types";
import { objectsOfKind, indexSnapshot } from "../graph/types";
import type { CompileContext, CompiledSection, ContentBlock } from "./types";
import { fieldBlocks, generated, ref, section } from "./builders";

function metaRef(snapshot: CanonSnapshot, field: string): SourceRef {
  return { objectId: snapshot.projectId, objectVersion: 0, field };
}

function metaBlock(
  snapshot: CanonSnapshot,
  field: keyof CanonSnapshot["meta"],
  label: string,
): ContentBlock | undefined {
  const value = snapshot.meta[field];
  if (!value) return undefined;
  return {
    origin: "user",
    label,
    text: String(value),
    sources: [metaRef(snapshot, String(field))],
  };
}

// --- Story bible -----------------------------------------------------------

export function buildProjectOverview(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CompiledSection[] {
  const missing: string[] = [];
  const required: [keyof CanonSnapshot["meta"], string][] = [
    ["title", "Project title"],
    ["format", "Format"],
    ["genre", "Genre"],
    ["tone", "Tone"],
    ["logline", "Logline"],
    ["shortSynopsis", "Short synopsis"],
  ];
  for (const [field, label] of required) {
    if (!snapshot.meta[field]) missing.push(label);
  }
  const blocks = [
    metaBlock(snapshot, "format", "Format"),
    metaBlock(snapshot, "genre", "Genre"),
    metaBlock(snapshot, "subgenre", "Subgenre"),
    metaBlock(snapshot, "tone", "Tone"),
    metaBlock(snapshot, "logline", "Logline"),
    metaBlock(snapshot, "hook", "One-sentence hook"),
    metaBlock(snapshot, "audience", "Audience"),
    metaBlock(snapshot, "shortSynopsis", "Short synopsis"),
    ctx.excludeEnding ? undefined : metaBlock(snapshot, "fullSynopsis", "Full synopsis"),
    metaBlock(snapshot, "thematicStatement", "Thematic statement"),
    metaBlock(snapshot, "developmentStatus", "Development status"),
  ];
  return [
    section(
      { sectionType: "project-overview", title: "Project Overview", blocks, missing },
      ctx.now,
    ),
  ];
}

export function buildThemes(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CompiledSection[] {
  const themes = objectsOfKind(snapshot, "theme");
  if (themes.length === 0) {
    return [
      section(
        {
          sectionType: "themes",
          title: "Themes",
          blocks: [],
          missing: ["At least one articulated theme"],
        },
        ctx.now,
      ),
    ];
  }
  return [
    section(
      {
        sectionType: "themes",
        title: "Themes",
        blocks: themes.map((t) => ({
          origin: t.origin,
          label: t.name,
          text: t.statement,
          sources: [ref(t, "statement")],
          truthStatus: t.truthStatus,
        })),
      },
      ctx.now,
    ),
  ];
}

export function buildNarrativeArchitecture(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CompiledSection[] {
  const beats = objectsOfKind(snapshot, "story-beat").sort(
    (a, b) => (a.act ?? 0) - (b.act ?? 0),
  );
  const visibleBeats = ctx.excludeEnding
    ? beats.filter((b) => (b.act ?? 1) < Math.max(...beats.map((x) => x.act ?? 1)))
    : beats;
  const blocks: (ContentBlock | undefined)[] = visibleBeats.map((b) => ({
    origin: b.origin,
    label: b.act !== undefined ? `Act ${b.act} — ${b.name}` : b.name,
    text: b.description,
    sources: [ref(b, "description")],
    truthStatus: b.truthStatus,
  }));
  return [
    section(
      {
        sectionType: "narrative-architecture",
        title: "Narrative Architecture",
        blocks,
        missing: beats.length === 0 ? ["Story structure (no beats defined)"] : [],
        structured: { actCount: new Set(beats.map((b) => b.act)).size },
      },
      ctx.now,
    ),
  ];
}

export function buildSceneBreakdown(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CompiledSection[] {
  const scenes = objectsOfKind(snapshot, "scene").sort(
    (a, b) => a.storyOrder - b.storyOrder,
  );
  const byId = indexSnapshot(snapshot);
  const missing: string[] = [];
  const blocks: (ContentBlock | undefined)[] = [];
  for (const s of scenes) {
    const loc = s.locationId ? byId.get(s.locationId) : undefined;
    const parts = [
      s.synopsis,
      s.purpose ? `Purpose: ${s.purpose}` : undefined,
      s.emotionalPurpose ? `Emotional purpose: ${s.emotionalPurpose}` : undefined,
    ].filter(Boolean);
    if (!s.synopsis) missing.push(`${s.name}: synopsis`);
    blocks.push({
      origin: s.origin,
      label: `${s.storyOrder}. ${s.name}${loc ? ` (${loc.name})` : ""}`,
      text: parts.join(" — ") || "(no summary yet)",
      sources: [ref(s, "synopsis"), ref(s, "purpose")],
      truthStatus: s.truthStatus,
    });
  }
  return [
    section(
      {
        sectionType: "scene-breakdown",
        title: "Scene-Level Summary",
        blocks,
        missing,
        structured: { sceneCount: scenes.length },
      },
      ctx.now,
    ),
  ];
}

export function buildSetupsPayoffs(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CompiledSection[] {
  const scenes = objectsOfKind(snapshot, "scene");
  const byId = indexSnapshot(snapshot);
  const blocks: (ContentBlock | undefined)[] = [];
  for (const s of scenes) {
    for (const payoffId of s.setupForSceneIds ?? []) {
      const payoff = byId.get(payoffId);
      blocks.push(
        generated(
          `"${s.name}" sets up ${payoff ? `"${payoff.name}"` : "a scene that no longer exists"}.`,
          [ref(s, "setupForSceneIds")],
        ),
      );
    }
  }
  return [
    section(
      { sectionType: "setups-payoffs", title: "Setups and Payoffs", blocks },
      ctx.now,
    ),
  ];
}

export function buildUnresolvedQuestions(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CompiledSection[] {
  const blocks: (ContentBlock | undefined)[] = [];
  for (const obj of snapshot.objects) {
    if (obj.truthStatus === "unresolved") {
      blocks.push(
        generated(`Unresolved: ${obj.name} (${obj.kind}).`, [ref(obj)]),
      );
    }
    if (obj.kind === "character") {
      for (const detail of obj.unresolvedDetails ?? []) {
        blocks.push(generated(`${obj.name}: ${detail}`, [ref(obj, "unresolvedDetails")]));
      }
    }
  }
  return [
    section(
      {
        sectionType: "unresolved-questions",
        title: "Unresolved Development Questions",
        blocks,
      },
      ctx.now,
    ),
  ];
}

// --- Character bible -------------------------------------------------------

export function buildCharacterSections(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CompiledSection[] {
  const characters = objectsOfKind(snapshot, "character");
  if (characters.length === 0) {
    return [
      section(
        {
          sectionType: "character",
          title: "Characters",
          blocks: [],
          missing: ["No characters established"],
        },
        ctx.now,
      ),
    ];
  }
  return characters.map((c) => {
    const { blocks, missing } = fieldBlocks(c, [
      ["role", "Role in the story", true],
      ["ageRange", "Age range"],
      ["background", "Background"],
      ["culturalIdentity", "Cultural identity"],
      ["physicalPresentation", "Physical presentation"],
      ["personality", "Personality"],
      ["worldview", "Worldview"],
      ["consciousWant", "Conscious want", true],
      ["unconsciousNeed", "Unconscious need"],
      ["fear", "Fear"],
      ["wound", "Wound"],
      ["contradiction", "Contradiction"],
      ["secret", "Secret"],
      ["flaw", "Flaw"],
      ["strength", "Strength"],
      ["behaviorUnderStress", "Behavior under stress"],
      ["speechPatterns", "Speech patterns"],
      ["visualMotifs", "Visual motifs"],
      ["emotionalArc", "Emotional arc", true],
      ["castingConsiderations", "Casting considerations"],
      ["definingMoments", "Defining moments"],
    ]);
    if (!ctx.excludeEnding) {
      const ending = fieldBlocks(c, [["endingState", "Ending state"]]);
      blocks.push(...ending.blocks);
    }
    const sceneCount = objectsOfKind(snapshot, "scene").filter((s) =>
      s.characterIds.includes(c.id),
    ).length;
    blocks.push(
      generated(`${c.name} appears in ${sceneCount} scene${sceneCount === 1 ? "" : "s"}.`, [
        ref(c),
      ]),
    );
    return section(
      { sectionType: "character", title: c.name, blocks, missing },
      ctx.now,
    );
  });
}

// --- Relationship bible ----------------------------------------------------

export function buildRelationshipSections(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CompiledSection[] {
  const relationships = objectsOfKind(snapshot, "relationship");
  const byId = indexSnapshot(snapshot);
  return relationships.map((r) => {
    const [aId, bId] = r.characterIds;
    const a = byId.get(aId);
    const b = byId.get(bId);
    const title = a && b ? `${a.name} & ${b.name}` : r.name;
    const { blocks, missing } = fieldBlocks(r, [
      ["history", "History"],
      ["currentState", "Current state", true],
      ["hiddenTension", "Hidden tension"],
      ["powerBalance", "Power balance"],
      ["conflictPattern", "Conflict pattern"],
      ["arc", "Relationship arc", true],
    ]);
    if (!ctx.excludeEnding) {
      blocks.push(...fieldBlocks(r, [["finalState", "Final state"]]).blocks);
    }
    const altering = (r.alteringSceneIds ?? [])
      .map((id) => byId.get(id)?.name)
      .filter(Boolean);
    if (altering.length > 0) {
      blocks.push(
        generated(`Scenes that alter this relationship: ${altering.join("; ")}.`, [
          ref(r, "alteringSceneIds"),
        ]),
      );
    }
    return section({ sectionType: "relationship", title, blocks, missing }, ctx.now);
  });
}

// --- World bible -----------------------------------------------------------

export function buildWorldSections(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CompiledSection[] {
  const out: CompiledSection[] = [];

  const rules = objectsOfKind(snapshot, "world-rule");
  out.push(
    section(
      {
        sectionType: "world-rules",
        title: "Rules of the World",
        blocks: rules.flatMap((w) => {
          const { blocks } = fieldBlocks(w, [
            ["rule", w.name],
            ["limitations", "Limitations"],
            ["costs", "Costs"],
            ["taboos", "Taboos"],
          ]);
          return blocks;
        }),
        missing: rules.length === 0 ? ["World rules not yet established"] : [],
      },
      ctx.now,
    ),
  );

  const locations = objectsOfKind(snapshot, "location");
  out.push(
    section(
      {
        sectionType: "locations",
        title: "Locations",
        blocks: locations.map((l) => ({
          origin: l.origin,
          label: l.name,
          text: [l.description, l.emotionalPurpose ? `Emotional purpose: ${l.emotionalPurpose}` : undefined]
            .filter(Boolean)
            .join(" — ") || "(described only by name)",
          sources: [ref(l, "description")],
          truthStatus: l.truthStatus,
        })),
        missing: locations.length === 0 ? ["No locations established"] : [],
      },
      ctx.now,
    ),
  );

  const culturalLaws = snapshot.objects.filter((o) => o.kind === "cultural-law");
  out.push(
    section(
      {
        sectionType: "cultural-foundation",
        title: "Cultural Foundation",
        blocks: culturalLaws.map((law) => ({
          origin: law.origin,
          label: law.name,
          text:
            law.kind === "cultural-law"
              ? [law.law, law.rationale].filter(Boolean).join(" — ")
              : law.name,
          sources: [ref(law, "law")],
          truthStatus: law.truthStatus,
        })),
      },
      ctx.now,
    ),
  );

  return out;
}

// --- Lore bible ------------------------------------------------------------

export function buildLoreSections(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CompiledSection[] {
  const entries = objectsOfKind(snapshot, "lore-entry");
  const byId = indexSnapshot(snapshot);
  return entries.map((e) => {
    const { blocks, missing } = fieldBlocks(e, [
      ["body", "Lore", true],
      ["knownTruth", "Known truth"],
      ["believedTruth", "Believed truth"],
    ]);
    if (!ctx.excludeEnding) {
      blocks.push(...fieldBlocks(e, [["concealedTruth", "Concealed truth"]]).blocks);
      if (e.revealSceneId) {
        const revealScene = byId.get(e.revealSceneId);
        if (revealScene) {
          blocks.push(
            generated(`Revealed in "${revealScene.name}".`, [ref(e, "revealSceneId")]),
          );
        }
      }
    }
    return section({ sectionType: "lore-entry", title: e.name, blocks, missing }, ctx.now);
  });
}
