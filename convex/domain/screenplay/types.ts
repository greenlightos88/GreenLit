/**
 * Screenplay data structures (section 50).
 *
 * A draft is an ordered list of typed elements grouped into scenes. Elements —
 * not opaque text — so validation, breakdowns, and every export format derive
 * from the same structure.
 */

export type ElementType =
  | "scene-heading"
  | "action"
  | "character"
  | "parenthetical"
  | "dialogue"
  | "transition"
  | "centered"
  | "section"
  | "synopsis"
  | "page-break"
  | "note";

export interface ScreenplayElement {
  id: string;
  type: ElementType;
  text: string;
  /** For character cues: (V.O.), (O.S.), (CONT'D) extensions. */
  extension?: string;
  /** True when this cue continues dialogue across a break. */
  continued?: boolean;
  /** True for dual-dialogue right-hand column. */
  dual?: boolean;
}

export interface SceneHeadingParts {
  /** INT, EXT, INT/EXT, EST */
  prefix: string;
  location: string;
  timeOfDay?: string;
}

export interface ScreenplayScene {
  id: string;
  /** Production scene number, assigned in Production Draft mode. */
  number?: string;
  heading: SceneHeadingParts;
  elements: ScreenplayElement[];
  /** Link back to the project graph scene object, when known. */
  sceneObjectId?: string;
}

export interface TitlePage {
  title?: string;
  credit?: string;
  author?: string;
  source?: string;
  draftDate?: string;
  contact?: string;
  notes?: string;
  copyright?: string;
}

/** Section 50: the user must always know which mode is active. */
export type CompilationMode =
  | "preserve"
  | "editorial"
  | "development"
  | "production-draft"
  | "submission";

export type ScriptForm =
  | "feature"
  | "short-film"
  | "tv-pilot"
  | "tv-episode"
  | "limited-series-episode"
  | "stage-play"
  | "audio-drama"
  | "documentary-treatment"
  | "proof-of-concept"
  | "teaser"
  | "trailer"
  | "pitch-scene"
  | "commercial"
  | "music-video-treatment"
  | "interactive";

export interface RevisionMetadata {
  draftLabel: string;
  revisionDate?: string;
  /** Future-ready architecture for production revision colors. */
  revisionColor?:
    | "white"
    | "blue"
    | "pink"
    | "yellow"
    | "green"
    | "goldenrod"
    | "buff"
    | "salmon"
    | "cherry";
  locked?: boolean;
}

export interface ScreenplayDraft {
  id: string;
  projectId: string;
  form: ScriptForm;
  mode: CompilationMode;
  titlePage: TitlePage;
  /** Elements before the first scene heading (rare; e.g. FADE IN). */
  frontMatter: ScreenplayElement[];
  scenes: ScreenplayScene[];
  revision: RevisionMetadata;
  createdAt: number;
}

let elementCounter = 0;
export function makeElement(
  type: ElementType,
  text: string,
  extra?: Partial<ScreenplayElement>,
): ScreenplayElement {
  elementCounter += 1;
  return { id: `el-${elementCounter}`, type, text, ...extra };
}

export function formatHeading(h: SceneHeadingParts): string {
  const base = `${h.prefix}. ${h.location}`;
  return h.timeOfDay ? `${base} - ${h.timeOfDay}` : base;
}

export function allElements(draft: ScreenplayDraft): ScreenplayElement[] {
  return [...draft.frontMatter, ...draft.scenes.flatMap((s) => s.elements)];
}

/** Assign production scene numbers (Production Draft mode). */
export function numberScenes(draft: ScreenplayDraft): ScreenplayDraft {
  return {
    ...draft,
    scenes: draft.scenes.map((s, i) => ({ ...s, number: String(i + 1) })),
  };
}
