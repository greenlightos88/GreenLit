/**
 * Production requirements extraction (section 64).
 *
 * The engine recommends categories from structural graph signals and textual
 * evidence. Every requirement stays reviewable: nothing is confirmed until a
 * human production team confirms it.
 */

import type { CanonSnapshot, SceneObject } from "../graph/types";
import { objectsOfKind, indexSnapshot } from "../graph/types";

export type RequirementCategory =
  | "cast"
  | "background-performers"
  | "location"
  | "set"
  | "props"
  | "wardrobe"
  | "hair-makeup"
  | "prosthetics"
  | "vehicles"
  | "animals"
  | "children"
  | "stunts"
  | "intimacy"
  | "weapons"
  | "fire"
  | "smoke"
  | "water"
  | "weather"
  | "night-exterior"
  | "crowd"
  | "music-playback"
  | "special-effects"
  | "visual-effects"
  | "sound"
  | "language"
  | "cultural-consultation"
  | "special-equipment"
  | "safety";

export interface ProductionRequirement {
  id: string;
  sceneId: string;
  sceneName: string;
  category: RequirementCategory;
  department: string;
  /** Text or structural signal that triggered the recommendation. */
  evidence: string;
  narrativePurpose?: string;
  emotionalPurpose?: string;
  confidence: "high" | "possible";
  /** Requirements are recommendations until a human confirms them. */
  confirmed: boolean;
  unresolvedQuestions: string[];
}

const KEYWORD_RULES: {
  category: RequirementCategory;
  department: string;
  pattern: RegExp;
  safety?: boolean;
}[] = [
  { category: "weapons", department: "Props / Armory", pattern: /\b(gun|pistol|rifle|machete|knife|blade|sword|weapon)\b/i, safety: true },
  { category: "fire", department: "Special Effects", pattern: /\b(fire|flame|burn(s|ing)?|torch|inferno)\b/i, safety: true },
  { category: "smoke", department: "Special Effects", pattern: /\b(smoke|fog|haze)\b/i },
  { category: "water", department: "Special Effects / Marine", pattern: /\b(water|river|ocean|sea|lake|lagoon|drown|underwater|rain-soaked|flood)\b/i, safety: true },
  { category: "weather", department: "Special Effects", pattern: /\b(rain|storm|thunder|lightning|harmattan|wind(storm)?|snow)\b/i },
  { category: "stunts", department: "Stunts", pattern: /\b(fight|chase|crash|falls?( from| off| through)|leap|struggle|tackle)\b/i, safety: true },
  { category: "vehicles", department: "Transportation / Picture Vehicles", pattern: /\b(car|truck|bus|danfo|okada|motorcycle|boat|canoe|drives?|driving)\b/i },
  { category: "animals", department: "Animal Wranglers", pattern: /\b(dog|goat|chicken|rooster|horse|cattle|snake|bird)\b/i },
  { category: "children", department: "Casting / Welfare", pattern: /\b(child|children|boy|girl|baby|infant|kid)\b/i },
  { category: "crowd", department: "Assistant Directors / Extras", pattern: /\b(crowd|marketplace|procession|festival|congregation|mob|villagers)\b/i },
  { category: "visual-effects", department: "VFX", pattern: /\b(transforms?|vanish(es)?|apparition|spirit|glows?|levitat|dissolv(es|ing)|manifestation|supernatural)\b/i },
  { category: "prosthetics", department: "Hair & Makeup / Prosthetics", pattern: /\b(scar|wound|burn(ed)? skin|prosthetic|aged? (up|down)|decay)\b/i },
  { category: "intimacy", department: "Intimacy Coordination", pattern: /\b(kiss(es|ing)?|intimate|love scene|undress)\b/i },
  { category: "music-playback", department: "Music / Playback", pattern: /\b(sings?|singing|drumm(ing|ers)|choir|song|chant(s|ing)?)\b/i },
  { category: "language", department: "Dialect / Translation", pattern: /\b(igbo|yoruba|hausa|pidgin|subtitle|translat)/i },
];

function sceneText(scene: SceneObject): string {
  return [scene.name, scene.synopsis ?? "", scene.scriptText ?? ""].join("\n");
}

let requirementCounter = 0;

export function extractProductionRequirements(
  snapshot: CanonSnapshot,
): ProductionRequirement[] {
  const byId = indexSnapshot(snapshot);
  const scenes = objectsOfKind(snapshot, "scene").sort(
    (a, b) => a.storyOrder - b.storyOrder,
  );
  const culturalLaws = snapshot.objects.filter((o) => o.kind === "cultural-law");
  const requirements: ProductionRequirement[] = [];

  const add = (
    scene: SceneObject,
    category: RequirementCategory,
    department: string,
    evidence: string,
    confidence: "high" | "possible",
    unresolvedQuestions: string[] = [],
  ) => {
    requirementCounter += 1;
    requirements.push({
      id: `req-${requirementCounter}`,
      sceneId: scene.id,
      sceneName: scene.name,
      category,
      department,
      evidence,
      narrativePurpose: scene.purpose,
      emotionalPurpose: scene.emotionalPurpose,
      confidence,
      confirmed: false,
      unresolvedQuestions,
    });
  };

  for (const scene of scenes) {
    // Structural signals — high confidence because they come from canon.
    const cast = scene.characterIds
      .map((id) => byId.get(id)?.name)
      .filter((n): n is string => Boolean(n));
    if (cast.length > 0) {
      add(scene, "cast", "Casting / AD", `Canonical scene cast: ${cast.join(", ")}`, "high");
    }
    if (scene.locationId) {
      const loc = byId.get(scene.locationId);
      if (loc) {
        add(scene, "location", "Locations", `Canonical location: ${loc.name}`, "high");
      }
    }
    for (const propId of scene.propIds ?? []) {
      const prop = byId.get(propId);
      if (prop) {
        add(scene, "props", "Props", `Canonical prop: ${prop.name}`, "high");
      }
    }
    if (scene.timeOfDay === "NIGHT" && scene.exterior) {
      add(
        scene,
        "night-exterior",
        "Production / AD",
        "Scene is a night exterior in canon.",
        "high",
        ["Lighting package and crew turnaround for night work."],
      );
    }

    // Textual signals — recommendations for human review.
    const text = sceneText(scene);
    for (const rule of KEYWORD_RULES) {
      const match = text.match(rule.pattern);
      if (match) {
        add(
          scene,
          rule.category,
          rule.department,
          `Text mentions "${match[0]}".`,
          "possible",
          rule.safety
            ? ["Safety-sensitive element: requires qualified supervision and a risk assessment."]
            : [],
        );
        if (rule.safety) {
          add(
            scene,
            "safety",
            "Production Safety",
            `Safety-sensitive signal: "${match[0]}".`,
            "possible",
            ["A human safety officer must assess this scene; no conclusion is made here."],
          );
        }
      }
    }

    // Cultural consultation whenever cultural laws exist and a scene touches them.
    for (const law of culturalLaws) {
      if (law.kind !== "cultural-law") continue;
      const touches = (law.requiredTerms ?? []).some((term) =>
        text.toUpperCase().includes(term.toUpperCase()),
      );
      if (touches) {
        add(
          scene,
          "cultural-consultation",
          "Cultural Consultants",
          `Scene touches material governed by "${law.name}".`,
          "possible",
          ["Human cultural consultation required; accuracy is not certified automatically."],
        );
      }
    }
  }

  return requirements;
}

/** Scenes ranked by how many distinct production categories they trigger. */
export function rankSceneComplexity(
  requirements: ProductionRequirement[],
): { sceneId: string; sceneName: string; categories: RequirementCategory[] }[] {
  const byScene = new Map<string, { sceneName: string; categories: Set<RequirementCategory> }>();
  for (const req of requirements) {
    const entry = byScene.get(req.sceneId) ?? {
      sceneName: req.sceneName,
      categories: new Set<RequirementCategory>(),
    };
    entry.categories.add(req.category);
    byScene.set(req.sceneId, entry);
  }
  return [...byScene.entries()]
    .map(([sceneId, { sceneName, categories }]) => ({
      sceneId,
      sceneName,
      categories: [...categories],
    }))
    .sort((a, b) => b.categories.length - a.categories.length);
}
