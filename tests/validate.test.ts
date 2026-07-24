import { describe, expect, test } from "bun:test";
import { validateDraft } from "../convex/domain/screenplay/validate";
import { makeElement } from "../convex/domain/screenplay/types";
import type {
  ScreenplayDraft,
  ScreenplayElement,
  ScreenplayScene,
  SceneHeadingParts,
} from "../convex/domain/screenplay/types";
import type { CanonSnapshot } from "../convex/domain/graph/types";
import { fixtureSnapshot } from "../src/data/fixture";

/**
 * Script-intelligence validation rules (validate.ts). The fixture snapshot
 * supplies canon (characters "Nneka"/"Kelechi"/"Amara Okoye"; locations
 * "SALT HOUSE"/"ORU LAGOON"/"CROSSING MARKET"). Each test crafts a minimal
 * draft that triggers one rule and asserts the rule fired with its documented
 * reporting fields. These complement the fixture-driven rules already covered
 * in screenplay.test.ts (premature-knowledge, prop-before-introduction).
 */

let sceneId = 0;
function scene(
  heading: Partial<SceneHeadingParts>,
  elements: ScreenplayElement[],
  extra: Partial<ScreenplayScene> = {},
): ScreenplayScene {
  sceneId += 1;
  return {
    id: `sc-${sceneId}`,
    heading: { prefix: "INT", location: "SALT HOUSE", ...heading },
    elements,
    ...extra,
  };
}

function draft(scenes: ScreenplayScene[]): ScreenplayDraft {
  return {
    id: "d",
    projectId: "p",
    form: "feature",
    mode: "preserve",
    titlePage: {},
    frontMatter: [],
    scenes,
    revision: { draftLabel: "test" },
    createdAt: 0,
  };
}

function codes(d: ScreenplayDraft): string[] {
  return validateDraft(d, fixtureSnapshot).map((i) => i.code);
}

describe("validateDraft rules", () => {
  test("flags a character cue absent from the project graph", () => {
    const d = draft([scene({}, [makeElement("character", "GHOST")])]);
    expect(codes(d)).toContain("character-unknown");
  });

  test("flags an inconsistently spelled character cue for a known character", () => {
    const d = draft([
      scene({}, [
        makeElement("character", "NNEKA"),
        makeElement("character", "NNE KA"),
      ]),
    ]);
    const issue = validateDraft(d, fixtureSnapshot).find(
      (i) => i.code === "character-name-inconsistent",
    );
    expect(issue).toBeDefined();
    expect(issue?.requiresApproval).toBe(true);
    expect(issue?.affectedDocuments).toContain("character-bible");
  });

  test("flags a scene-heading location that matches no canonical location", () => {
    const d = draft([scene({ location: "ATLANTIS" }, [makeElement("action", "A.")])]);
    expect(codes(d)).toContain("location-unknown");
  });

  test("flags inconsistent spelling of the same location across headings", () => {
    const d = draft([
      scene({ location: "SALT HOUSE" }, [makeElement("action", "A.")]),
      scene({ location: "SALT-HOUSE" }, [makeElement("action", "B.")]),
    ]);
    const cs = codes(d);
    expect(cs).toContain("scene-heading-inconsistent");
    // Both spellings normalize to a known location, so no location-unknown noise.
    expect(cs).not.toContain("location-unknown");
  });

  test("flags a non-standard time of day as an informational note", () => {
    const d = draft([
      scene({ location: "SALT HOUSE", timeOfDay: "TWILIGHTISH" }, [
        makeElement("action", "A."),
      ]),
    ]);
    const issue = validateDraft(d, fixtureSnapshot).find(
      (i) => i.code === "time-of-day-nonstandard",
    );
    expect(issue?.severity).toBe("info");
    expect(issue?.requiresApproval).toBe(false);
  });

  test("flags a scene that duplicates an earlier identical scene", () => {
    const body = () => [makeElement("action", "Identical beat.")];
    const d = draft([
      scene({ location: "SALT HOUSE", timeOfDay: "DAY" }, body()),
      scene({ location: "SALT HOUSE", timeOfDay: "DAY" }, body()),
    ]);
    expect(codes(d)).toContain("duplicate-scene");
  });

  test("flags unresolved placeholder text", () => {
    const d = draft([
      scene({ location: "SALT HOUSE" }, [makeElement("action", "Add the reveal TBD.")]),
    ]);
    expect(codes(d)).toContain("unresolved-placeholder");
  });

  test("every issue reports consequence, downstream impact, and approval need", () => {
    const d = draft([scene({}, [makeElement("character", "GHOST")])]);
    const issue = validateDraft(d, fixtureSnapshot).find((i) => i.code === "character-unknown");
    expect(issue?.consequence).toBeTruthy();
    expect(issue?.proposedFix).toBeTruthy();
    expect((issue?.affectedDocuments.length ?? 0)).toBeGreaterThan(0);
    expect(typeof issue?.requiresApproval).toBe("boolean");
  });
});

/** Replace fields on one canonical scene object to trigger graph-linked rules. */
function mutateScene(id: string, patch: Record<string, unknown>): CanonSnapshot {
  return {
    ...fixtureSnapshot,
    objects: fixtureSnapshot.objects.map((o) =>
      o.kind === "scene" && o.id === id ? ({ ...o, ...patch } as typeof o) : o,
    ),
  };
}

describe("validateDraft graph-linked rules", () => {
  test("flags dialogue attributed to a character absent from the linked scene", () => {
    // scene-lagoon's canonical cast is Amara + Kelechi; Nneka Okoye is a known
    // character (cue must be the full name to match canon) but absent here.
    const d = draft([
      scene({}, [makeElement("character", "NNEKA OKOYE")], { sceneObjectId: "scene-lagoon" }),
    ]);
    const issue = validateDraft(d, fixtureSnapshot).find(
      (i) => i.code === "dialogue-absent-character",
    );
    expect(issue?.severity).toBe("error");
  });

  test("flags a tone-law forbidden term as a law conflict", () => {
    const d = draft([scene({}, [makeElement("action", "A MAGIC LASER ignites the pier.")])]);
    expect(validateDraft(d, fixtureSnapshot).map((i) => i.code)).toContain("law-conflict");
  });

  test("routes a cultural-law forbidden term to the cultural-accuracy code", () => {
    const d = draft([scene({}, [makeElement("action", "They speak an AFRICAN DIALECT.")])]);
    expect(validateDraft(d, fixtureSnapshot).map((i) => i.code)).toContain("cultural-accuracy");
  });

  test("flags a story beat realized by no scene (fixture carries one)", () => {
    const d = draft([scene({}, [makeElement("action", "A quiet establishing beat.")])]);
    expect(validateDraft(d, fixtureSnapshot).map((i) => i.code)).toContain("incomplete-story-beat");
  });

  test("flags a canonical scene with no stated dramatic purpose", () => {
    const snapshot = mutateScene("scene-lagoon", { purpose: undefined });
    const d = draft([scene({}, [makeElement("action", "A.")])]);
    expect(validateDraft(d, snapshot).map((i) => i.code)).toContain("missing-scene-purpose");
  });

  test("flags a setup whose payoff scene no longer exists", () => {
    const snapshot = mutateScene("scene-return", { setupForSceneIds: ["scene-that-was-cut"] });
    const d = draft([scene({}, [makeElement("action", "A.")])]);
    expect(validateDraft(d, snapshot).map((i) => i.code)).toContain("broken-setup-payoff");
  });
});
