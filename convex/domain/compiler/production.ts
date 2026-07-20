/**
 * Production bible and department packet builders (sections 52–53, 65).
 *
 * Costs, schedules, clearances, and safety conclusions are never fabricated;
 * estimates carry an explicit label, and safety/cultural items are flagged for
 * human confirmation.
 */

import type { CanonSnapshot } from "../graph/types";
import { objectsOfKind, indexSnapshot } from "../graph/types";
import type { CompileContext, CompiledSection, ContentBlock } from "./types";
import { generated, ref, section } from "./builders";
import {
  extractProductionRequirements,
  rankSceneComplexity,
  type RequirementCategory,
} from "./breakdown";

export function buildProjectLaws(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CompiledSection[] {
  const laws = snapshot.objects.filter(
    (o) => o.kind === "project-law" || o.kind === "tone-law" || o.kind === "cultural-law",
  );
  return [
    section(
      {
        sectionType: "project-laws",
        title: "Non-Negotiable Project Laws",
        blocks: laws.map((law) => ({
          origin: law.origin,
          label: `${law.name} (${law.kind.replace("-", " ")})`,
          text:
            law.kind === "tone-law" || law.kind === "cultural-law" || law.kind === "project-law"
              ? [law.law, law.rationale].filter(Boolean).join(" — ")
              : "",
          sources: [ref(law, "law")],
          truthStatus: law.truthStatus,
        })),
        missing: laws.length === 0 ? ["No project laws established"] : [],
      },
      ctx.now,
    ),
  ];
}

export function buildProductionRequirementsSection(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CompiledSection[] {
  const requirements = extractProductionRequirements(snapshot);
  const byCategory = new Map<RequirementCategory, typeof requirements>();
  for (const req of requirements) {
    const list = byCategory.get(req.category) ?? [];
    list.push(req);
    byCategory.set(req.category, list);
  }
  const blocks: ContentBlock[] = [];
  for (const [category, reqs] of byCategory) {
    const sceneNames = [...new Set(reqs.map((r) => r.sceneName))];
    const confirmedNote = reqs.every((r) => !r.confirmed)
      ? " (recommended by extraction; awaiting production confirmation)"
      : "";
    blocks.push(
      generated(
        `${category} — ${reqs[0]?.department ?? ""}: ${sceneNames.join("; ")}${confirmedNote}`,
        reqs.map((r) => ({ objectId: r.sceneId, objectVersion: 0 })),
      ),
    );
  }
  return [
    section(
      {
        sectionType: "production-requirements",
        title: "Production Requirements by Category",
        blocks,
        structured: { requirements },
      },
      ctx.now,
    ),
  ];
}

export function buildComplexitySection(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CompiledSection[] {
  const ranked = rankSceneComplexity(extractProductionRequirements(snapshot));
  return [
    section(
      {
        sectionType: "scene-complexity",
        title: "Schedule- and Budget-Pressure Sequences",
        blocks: ranked.slice(0, 10).map((r) =>
          generated(
            `"${r.sceneName}" triggers ${r.categories.length} production categories: ${r.categories.join(", ")}. (Complexity ranking is an estimate, not a schedule conclusion.)`,
            [{ objectId: r.sceneId, objectVersion: 0 }],
          ),
        ),
        structured: { ranking: ranked },
      },
      ctx.now,
    ),
  ];
}

export function buildProductionNotes(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CompiledSection[] {
  const notes = objectsOfKind(snapshot, "production-note");
  return [
    section(
      {
        sectionType: "production-notes",
        title: "Production Notes and Assumptions",
        blocks: notes.map((n) => ({
          origin: n.origin,
          label: `${n.name}${n.department ? ` (${n.department})` : ""}${n.isEstimate ? " — ESTIMATE" : ""}`,
          text: n.body,
          sources: [ref(n, "body")],
          truthStatus: n.truthStatus,
        })),
      },
      ctx.now,
    ),
  ];
}

export function buildRiskRegister(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CompiledSection[] {
  const requirements = extractProductionRequirements(snapshot);
  const risks = requirements.filter(
    (r) => r.category === "safety" || r.unresolvedQuestions.length > 0,
  );
  return [
    section(
      {
        sectionType: "risk-register",
        title: "Risk Register (Unconfirmed)",
        blocks: risks.map((r) =>
          generated(
            `"${r.sceneName}" — ${r.category}: ${r.evidence} ${r.unresolvedQuestions.join(" ")}`,
            [{ objectId: r.sceneId, objectVersion: 0 }],
          ),
        ),
      },
      ctx.now,
    ),
  ];
}

/** Section 65: Human Mechanics as structured creative intention. */
export function buildHumanMechanics(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CompiledSection[] {
  const mechanics = objectsOfKind(snapshot, "human-mechanics");
  const byId = indexSnapshot(snapshot);
  return mechanics.map((m) => {
    const fields: [string | undefined, string][] = [
      [m.intendedAudienceState, "Intended audience state"],
      [m.startingEmotionalState, "Starting emotional state"],
      [m.escalationPattern, "Escalation pattern"],
      [m.sensoryMechanisms, "Sensory mechanisms"],
      [m.emotionalPeak, "Emotional peak"],
      [m.release, "Release"],
      [m.aftereffect, "Aftereffect"],
    ];
    const blocks: ContentBlock[] = fields
      .filter((f): f is [string, string] => Boolean(f[0]))
      .map(([text, label]) => ({
        origin: m.origin,
        label,
        text,
        sources: [ref(m)],
        truthStatus: m.truthStatus,
      }));
    const sceneNames = (m.sceneIds ?? [])
      .map((id) => byId.get(id)?.name)
      .filter(Boolean);
    if (sceneNames.length > 0) {
      blocks.push(generated(`Applies to: ${sceneNames.join("; ")}.`, [ref(m, "sceneIds")]));
    }
    blocks.push(
      generated(
        "This describes intended audience experience as structured creative intention, not a measured or guaranteed effect.",
        [ref(m)],
      ),
    );
    return section(
      {
        sectionType: "human-mechanics",
        title: `Human Mechanics — ${m.sequenceName}`,
        blocks,
      },
      ctx.now,
    );
  });
}

// --- Department packet builders -------------------------------------------

const DEPARTMENT_CATEGORY_MAP: Record<string, RequirementCategory[]> = {
  "casting-packet": ["cast", "children", "language"],
  "location-packet": ["location", "night-exterior", "weather", "crowd"],
  "production-design-packet": ["set", "props", "vehicles"],
  "costume-packet": ["wardrobe"],
  "hair-makeup-packet": ["hair-makeup", "prosthetics"],
  "sound-packet": ["sound", "music-playback", "language"],
  "music-packet": ["music-playback"],
  "vfx-packet": ["visual-effects", "special-effects", "fire", "smoke", "water"],
  "stunts-packet": ["stunts", "weapons", "safety"],
};

export function buildDepartmentRequirements(
  packetId: string,
): (snapshot: CanonSnapshot, ctx: CompileContext) => CompiledSection[] {
  return (snapshot, ctx) => {
    const categories = DEPARTMENT_CATEGORY_MAP[packetId] ?? [];
    const requirements = extractProductionRequirements(snapshot).filter((r) =>
      categories.includes(r.category),
    );
    return [
      section(
        {
          sectionType: "department-requirements",
          title: "Scene-Level Requirements",
          blocks: requirements.map((r) =>
            generated(
              `"${r.sceneName}" (${r.category}): ${r.evidence}${r.narrativePurpose ? ` Narrative purpose: ${r.narrativePurpose}.` : ""}${r.confirmed ? "" : " [Awaiting confirmation]"}`,
              [{ objectId: r.sceneId, objectVersion: 0 }],
            ),
          ),
          structured: { requirements },
        },
        ctx.now,
      ),
    ];
  };
}

export function buildCastingRoles(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CompiledSection[] {
  const characters = objectsOfKind(snapshot, "character");
  return characters.map((c) => {
    const blocks: ContentBlock[] = [];
    const push = (label: string, text?: string) => {
      if (text) blocks.push({ origin: c.origin, label, text, sources: [ref(c)] });
    };
    push("Role summary", c.role);
    push("Emotional range", c.emotionalArc);
    push("Age range", c.ageRange);
    push("Cultural authenticity", c.culturalIdentity);
    push("Physical requirements (only where essential)", c.physicalPresentation);
    push("Speech patterns", c.speechPatterns);
    push("Casting considerations", c.castingConsiderations);
    blocks.push(
      generated(
        "Casting guidance derives only from established canon. Do not reduce this role to a stereotype; unlisted attributes are open.",
        [ref(c)],
      ),
    );
    return section(
      { sectionType: "casting-role", title: c.name, blocks },
      ctx.now,
    );
  });
}
