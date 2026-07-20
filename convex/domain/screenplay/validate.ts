/**
 * Script intelligence validation (section 50).
 *
 * Every check reports the issue, its location, its consequence, a proposed
 * fix, affected downstream documents, and whether user approval is required.
 * Validation never rewrites user-authored material.
 */

import type { CanonSnapshot } from "../graph/types";
import { objectsOfKind, indexSnapshot } from "../graph/types";
import type { ScreenplayDraft, ScreenplayScene } from "./types";
import { formatHeading } from "./types";

export type IssueSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  code: string;
  severity: IssueSeverity;
  message: string;
  /** Where the issue lives (scene id, element id, or object id). */
  location: string;
  consequence: string;
  proposedFix?: string;
  affectedDocuments: string[];
  requiresApproval: boolean;
}

const STANDARD_TIMES = new Set([
  "DAY",
  "NIGHT",
  "MORNING",
  "EVENING",
  "DAWN",
  "DUSK",
  "CONTINUOUS",
  "LATER",
  "SAME",
]);

const PLACEHOLDER_RE = /\b(TBD|TODO|TK|XXX)\b|\[(PLACEHOLDER|FIXME)[^\]]*\]/i;

function normalizeName(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function validateDraft(
  draft: ScreenplayDraft,
  snapshot: CanonSnapshot,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const byId = indexSnapshot(snapshot);
  const characters = objectsOfKind(snapshot, "character");
  const knownCueNames = new Map(characters.map((c) => [normalizeName(c.name), c.name]));

  // --- Character-name inconsistencies -------------------------------------
  const cueSpellings = new Map<string, Set<string>>();
  for (const scene of draft.scenes) {
    for (const el of scene.elements) {
      if (el.type !== "character") continue;
      const key = normalizeName(el.text);
      if (!cueSpellings.has(key)) cueSpellings.set(key, new Set());
      cueSpellings.get(key)?.add(el.text.toUpperCase());
    }
  }
  for (const [key, spellings] of cueSpellings) {
    if (spellings.size > 1) {
      issues.push({
        code: "character-name-inconsistent",
        severity: "warning",
        message: `Character cue spelled inconsistently: ${[...spellings].join(" / ")}`,
        location: "screenplay",
        consequence:
          "Breakdown software and casting documents will treat these as different characters.",
        proposedFix: `Standardize on a single spelling${knownCueNames.has(key) ? `: ${knownCueNames.get(key)?.toUpperCase()}` : ""}.`,
        affectedDocuments: ["character-bible", "casting-packet", "production-bible"],
        requiresApproval: true,
      });
    }
    if (!knownCueNames.has(key)) {
      issues.push({
        code: "character-unknown",
        severity: "warning",
        message: `Dialogue attributed to "${[...spellings][0]}", who is not in the project graph.`,
        location: "screenplay",
        consequence:
          "The character bible and casting packet will not account for this speaking role.",
        proposedFix: "Add the character to the project graph or correct the cue.",
        affectedDocuments: ["character-bible", "casting-packet"],
        requiresApproval: true,
      });
    }
  }

  // --- Dialogue attributed to characters absent from the scene ------------
  for (const scene of draft.scenes) {
    const sceneObj = scene.sceneObjectId ? byId.get(scene.sceneObjectId) : undefined;
    if (!sceneObj || sceneObj.kind !== "scene") continue;
    const present = new Set(
      sceneObj.characterIds
        .map((id) => byId.get(id))
        .filter((c) => c !== undefined)
        .map((c) => normalizeName(c.name)),
    );
    for (const el of scene.elements) {
      if (el.type !== "character") continue;
      const key = normalizeName(el.text);
      if (knownCueNames.has(key) && !present.has(key)) {
        issues.push({
          code: "dialogue-absent-character",
          severity: "error",
          message: `${el.text.toUpperCase()} speaks in "${formatHeading(scene.heading)}" but is not listed in that scene.`,
          location: scene.id,
          consequence: "Continuity conflict between screenplay and scene canon.",
          proposedFix:
            "Add the character to the scene in the project graph, or reassign the dialogue.",
          affectedDocuments: ["story-bible", "production-bible", "casting-packet"],
          requiresApproval: true,
        });
      }
    }
  }

  // --- Scene-heading / location consistency -------------------------------
  const locations = objectsOfKind(snapshot, "location");
  const knownHeadings = new Set(locations.map((l) => normalizeName(l.headingName)));
  const headingSpellings = new Map<string, Set<string>>();
  for (const scene of draft.scenes) {
    const key = normalizeName(scene.heading.location);
    if (!headingSpellings.has(key)) headingSpellings.set(key, new Set());
    headingSpellings.get(key)?.add(scene.heading.location);
    if (knownHeadings.size > 0 && !knownHeadings.has(key)) {
      issues.push({
        code: "location-unknown",
        severity: "warning",
        message: `Scene heading location "${scene.heading.location}" does not match any canonical location.`,
        location: scene.id,
        consequence: "Location packets and schedules will miss or duplicate this location.",
        proposedFix: "Add the location to the project graph or correct the heading.",
        affectedDocuments: ["world-bible", "location-packet", "production-bible"],
        requiresApproval: true,
      });
    }
  }
  for (const [, spellings] of headingSpellings) {
    if (spellings.size > 1) {
      issues.push({
        code: "scene-heading-inconsistent",
        severity: "warning",
        message: `Location spelled inconsistently in scene headings: ${[...spellings].join(" / ")}`,
        location: "screenplay",
        consequence: "Scheduling and breakdown tools will treat these as separate sets.",
        proposedFix: "Standardize the heading spelling.",
        affectedDocuments: ["location-packet", "production-bible"],
        requiresApproval: true,
      });
    }
  }

  // --- Time-of-day terminology --------------------------------------------
  for (const scene of draft.scenes) {
    const tod = scene.heading.timeOfDay;
    if (tod && !STANDARD_TIMES.has(tod)) {
      issues.push({
        code: "time-of-day-nonstandard",
        severity: "info",
        message: `Non-standard time of day "${tod}" in "${formatHeading(scene.heading)}".`,
        location: scene.id,
        consequence: "Inconsistent terminology complicates scheduling day/night work.",
        proposedFix: `Use one of: ${[...STANDARD_TIMES].join(", ")}.`,
        affectedDocuments: ["production-bible"],
        requiresApproval: false,
      });
    }
  }

  // --- Duplicate scenes -----------------------------------------------------
  const sceneHashes = new Map<string, ScreenplayScene>();
  for (const scene of draft.scenes) {
    const hash =
      formatHeading(scene.heading) + "::" + scene.elements.map((e) => e.text).join("|");
    const dup = sceneHashes.get(hash);
    if (dup) {
      issues.push({
        code: "duplicate-scene",
        severity: "warning",
        message: `Scene "${formatHeading(scene.heading)}" appears to duplicate an earlier scene.`,
        location: scene.id,
        consequence: "Redundant material inflates page count and confuses breakdowns.",
        proposedFix: "Remove or differentiate one of the two scenes.",
        affectedDocuments: ["story-bible", "production-bible"],
        requiresApproval: true,
      });
    } else {
      sceneHashes.set(hash, scene);
    }
  }

  // --- Unresolved placeholders ---------------------------------------------
  for (const scene of draft.scenes) {
    for (const el of scene.elements) {
      if (PLACEHOLDER_RE.test(el.text) || el.type === "note") {
        issues.push({
          code: "unresolved-placeholder",
          severity: el.type === "note" ? "info" : "warning",
          message:
            el.type === "note"
              ? `Development note present in "${formatHeading(scene.heading)}".`
              : `Placeholder text in "${formatHeading(scene.heading)}": "${el.text.slice(0, 60)}"`,
          location: el.id,
          consequence: "Placeholder material must not reach an external reader.",
          proposedFix: "Resolve the placeholder before compiling in Submission mode.",
          affectedDocuments: ["screenplay"],
          requiresApproval: false,
        });
      }
    }
  }

  // --- Graph-level story checks --------------------------------------------
  const sceneObjects = objectsOfKind(snapshot, "scene").sort(
    (a, b) => a.storyOrder - b.storyOrder,
  );
  const sceneOrder = new Map(sceneObjects.map((s) => [s.id, s.storyOrder]));

  for (const s of sceneObjects) {
    if (!s.purpose) {
      issues.push({
        code: "missing-scene-purpose",
        severity: "warning",
        message: `Scene "${s.name}" has no stated dramatic purpose.`,
        location: s.id,
        consequence: "Purposeless scenes weaken structure and invite cuts nobody planned.",
        proposedFix: "State what the scene must accomplish, or mark it for review.",
        affectedDocuments: ["story-bible", "editorial-packet"],
        requiresApproval: false,
      });
    }
    for (const setupId of s.setupForSceneIds ?? []) {
      if (!sceneOrder.has(setupId)) {
        issues.push({
          code: "broken-setup-payoff",
          severity: "error",
          message: `Scene "${s.name}" sets up a payoff scene that no longer exists.`,
          location: s.id,
          consequence: "A promised payoff never arrives; the setup reads as a loose end.",
          proposedFix: "Re-link the setup or remove it.",
          affectedDocuments: ["story-bible"],
          requiresApproval: true,
        });
      }
    }
  }

  // --- Knowledge a character should not yet possess ------------------------
  const facts = objectsOfKind(snapshot, "knowledge-fact");
  const factLearnedAt = new Map(
    facts.map((f) => [f.id, sceneOrder.get(f.learnedInSceneId) ?? Infinity]),
  );
  for (const s of sceneObjects) {
    for (const factId of s.requiresFactIds ?? []) {
      const learnedAt = factLearnedAt.get(factId);
      const fact = byId.get(factId);
      if (learnedAt !== undefined && learnedAt > s.storyOrder && fact) {
        issues.push({
          code: "premature-knowledge",
          severity: "error",
          message: `Scene "${s.name}" depends on "${fact.name}" before it is learned.`,
          location: s.id,
          consequence: "A character acts on knowledge the audience knows they cannot have.",
          proposedFix: "Move the reveal earlier or restructure the dependent scene.",
          affectedDocuments: ["story-bible", "screenplay", "editorial-packet"],
          requiresApproval: true,
        });
      }
    }
  }

  // --- Props appearing before introduction ---------------------------------
  const props = objectsOfKind(snapshot, "prop");
  for (const prop of props) {
    if (!prop.introducedInSceneId) continue;
    const introAt = sceneOrder.get(prop.introducedInSceneId) ?? Infinity;
    for (const s of sceneObjects) {
      if ((s.propIds ?? []).includes(prop.id) && s.storyOrder < introAt) {
        issues.push({
          code: "prop-before-introduction",
          severity: "warning",
          message: `Prop "${prop.name}" appears in scene "${s.name}" before its introduction.`,
          location: s.id,
          consequence: "Continuity error for props and set dressing.",
          proposedFix: "Move the introduction earlier or remove the early appearance.",
          affectedDocuments: ["production-design-packet", "production-bible"],
          requiresApproval: true,
        });
      }
    }
  }

  // --- Tone / cultural / project law conflicts -----------------------------
  const laws = snapshot.objects.filter(
    (o) => o.kind === "tone-law" || o.kind === "cultural-law" || o.kind === "project-law",
  );
  const fullText = draft.scenes
    .flatMap((s) => s.elements.map((e) => e.text))
    .join("\n");
  for (const law of laws) {
    if (law.kind !== "tone-law" && law.kind !== "cultural-law" && law.kind !== "project-law")
      continue;
    for (const term of law.forbidden ?? []) {
      if (fullText.toUpperCase().includes(term.toUpperCase())) {
        issues.push({
          code: law.kind === "cultural-law" ? "cultural-accuracy" : "law-conflict",
          severity: "error",
          message: `Screenplay contains "${term}", which violates the ${law.kind.replace("-", " ")} "${law.name}".`,
          location: "screenplay",
          consequence: law.rationale ?? "Violates a non-negotiable project law.",
          proposedFix: law.requiredTerms?.length
            ? `Use established terminology: ${law.requiredTerms.join(", ")}.`
            : "Revise the offending material.",
          affectedDocuments: ["screenplay", "story-bible", "production-bible"],
          requiresApproval: true,
        });
      }
    }
  }

  // --- Incomplete story beats ----------------------------------------------
  for (const beat of objectsOfKind(snapshot, "story-beat")) {
    if (!beat.sceneIds || beat.sceneIds.length === 0) {
      issues.push({
        code: "incomplete-story-beat",
        severity: "warning",
        message: `Story beat "${beat.name}" is not realized by any scene.`,
        location: beat.id,
        consequence: "A structural promise exists on paper but not on screen.",
        proposedFix: "Write or link the scene(s) that deliver this beat.",
        affectedDocuments: ["story-bible", "screenplay"],
        requiresApproval: false,
      });
    }
  }

  return issues;
}
