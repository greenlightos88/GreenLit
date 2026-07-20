/**
 * Screenplay compilation: canon snapshot -> ScreenplayDraft (sections 50, 69).
 *
 * User-authored scene text is preserved verbatim in every mode; modes control
 * what surrounds it (placeholders, numbering, annotations), never its prose.
 */

import type { CanonSnapshot } from "../graph/types";
import { objectsOfKind, indexSnapshot } from "../graph/types";
import type {
  CompilationMode,
  ScreenplayDraft,
  ScreenplayScene,
  ScriptForm,
} from "./types";
import { makeElement, numberScenes } from "./types";
import { parseFountain } from "./fountain";

export interface CompileScreenplayOptions {
  mode: CompilationMode;
  form?: ScriptForm;
  draftLabel?: string;
}

let draftCounter = 0;

export function compileScreenplay(
  snapshot: CanonSnapshot,
  options: CompileScreenplayOptions,
): ScreenplayDraft {
  const byId = indexSnapshot(snapshot);
  const sceneObjects = objectsOfKind(snapshot, "scene").sort(
    (a, b) => a.storyOrder - b.storyOrder,
  );

  const scenes: ScreenplayScene[] = sceneObjects.map((sceneObj, i) => {
    const location = sceneObj.locationId ? byId.get(sceneObj.locationId) : undefined;
    const headingName =
      location && location.kind === "location"
        ? location.headingName
        : sceneObj.name.toUpperCase();

    const scene: ScreenplayScene = {
      id: `draft-scene-${i + 1}`,
      sceneObjectId: sceneObj.id,
      heading: {
        prefix: sceneObj.interior && sceneObj.exterior ? "INT/EXT" : sceneObj.interior ? "INT" : "EXT",
        location: headingName.toUpperCase(),
        timeOfDay: sceneObj.timeOfDay,
      },
      elements: [],
    };

    if (sceneObj.scriptText) {
      // Parse the user's Fountain body without a heading; preserve verbatim.
      const parsed = parseFountain(sceneObj.scriptText);
      scene.elements = [
        ...parsed.frontMatter,
        ...parsed.scenes.flatMap((s) => s.elements),
      ];
    } else if (options.mode === "development") {
      scene.elements = [
        makeElement(
          "note",
          `MISSING SCENE: ${sceneObj.purpose ?? sceneObj.synopsis ?? "purpose not yet stated"}`,
        ),
      ];
    } else if (sceneObj.synopsis) {
      scene.elements = [makeElement("synopsis", sceneObj.synopsis)];
    }

    if (options.mode === "submission") {
      // Clean reader-facing draft: strip development annotations.
      scene.elements = scene.elements.filter(
        (el) => el.type !== "note" && el.type !== "synopsis" && el.type !== "section",
      );
    }
    return scene;
  });

  draftCounter += 1;
  let draft: ScreenplayDraft = {
    id: `draft-${draftCounter}`,
    projectId: snapshot.projectId,
    form: options.form ?? "feature",
    mode: options.mode,
    titlePage: {
      title: snapshot.meta.title,
      credit: "Written by",
      draftDate: new Date().toISOString().slice(0, 10),
    },
    frontMatter: [],
    scenes,
    revision: {
      draftLabel: options.draftLabel ?? `${options.mode} draft`,
      revisionColor: "white",
      locked: false,
    },
    createdAt: Date.now(),
  };

  if (options.mode === "production-draft") {
    draft = numberScenes(draft);
  }
  return draft;
}
