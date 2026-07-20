/**
 * Canonical project graph — the single living source of truth.
 *
 * Every compiled document derives from these objects. Nothing in a compiled
 * output may exist without either a source reference into this graph or an
 * explicit "generated" label (see provenance.ts).
 */

/** Section 49: the system must distinguish these truth statuses. */
export type TruthStatus =
  | "canonical"
  | "creative-direction"
  | "approved-interpretation"
  | "production-recommendation"
  | "speculative"
  | "unresolved"
  | "archived-alternative";

/** Who authored a piece of content. Generated prose never silently becomes canon. */
export type ContentOrigin = "user" | "generated" | "source-quotation";

export type ObjectKind =
  | "project"
  | "fragment"
  | "character"
  | "relationship"
  | "scene"
  | "sequence"
  | "location"
  | "prop"
  | "world-rule"
  | "lore-entry"
  | "theme"
  | "tone-law"
  | "cultural-law"
  | "project-law"
  | "story-beat"
  | "human-mechanics"
  | "production-note"
  | "knowledge-fact"
  | "decision";

/** A reference from any derived material back into the graph. */
export interface SourceRef {
  objectId: string;
  objectVersion: number;
  /** Optional pointer to a specific field of the object. */
  field?: string;
}

export interface ProvenanceRecord {
  origin: ContentOrigin;
  sources: SourceRef[];
  /** True when the claim is an inference rather than a stated fact. */
  inference: boolean;
}

export interface BaseObject {
  id: string;
  kind: ObjectKind;
  projectId: string;
  version: number;
  truthStatus: TruthStatus;
  origin: ContentOrigin;
  /** Fragments / decisions / user material this object was derived from. */
  sources: SourceRef[];
  createdAt: number;
  updatedAt: number;
  /** Free-form name/title used in navigation and cross-references. */
  name: string;
  /** Confidentiality: restricted objects are stripped by the Confidentiality Gate. */
  confidential?: boolean;
  /** Material belonging to sequels/future installments; excludable per package. */
  sequelMaterial?: boolean;
}

/** Raw creative input before translation into structure. */
export interface Fragment extends BaseObject {
  kind: "fragment";
  text: string;
  capturedFrom?: "conversation" | "note" | "import" | "voice";
}

export interface CharacterObject extends BaseObject {
  kind: "character";
  role?: string;
  ageRange?: string;
  background?: string;
  /** Only ever populated from established material — never invented. */
  culturalIdentity?: string;
  physicalPresentation?: string;
  personality?: string;
  worldview?: string;
  consciousWant?: string;
  unconsciousNeed?: string;
  fear?: string;
  wound?: string;
  contradiction?: string;
  secret?: string;
  flaw?: string;
  strength?: string;
  behaviorUnderStress?: string;
  speechPatterns?: string;
  visualMotifs?: string;
  emotionalArc?: string;
  endingState?: string;
  castingConsiderations?: string;
  definingMoments?: string[];
  unresolvedDetails?: string[];
}

export interface RelationshipObject extends BaseObject {
  kind: "relationship";
  characterIds: [string, string];
  history?: string;
  currentState?: string;
  hiddenTension?: string;
  powerBalance?: string;
  conflictPattern?: string;
  arc?: string;
  finalState?: string;
  alteringSceneIds?: string[];
}

export type TimeOfDay =
  | "DAY"
  | "NIGHT"
  | "MORNING"
  | "EVENING"
  | "DAWN"
  | "DUSK"
  | "CONTINUOUS"
  | "LATER"
  | "SAME";

export interface SceneObject extends BaseObject {
  kind: "scene";
  /** Position in story order (1-based). */
  storyOrder: number;
  /** Position in chronological order when it differs (flashbacks, dual timelines). */
  chronologicalOrder?: number;
  interior: boolean;
  exterior?: boolean;
  locationId?: string;
  timeOfDay?: TimeOfDay;
  purpose?: string;
  emotionalPurpose?: string;
  synopsis?: string;
  characterIds: string[];
  propIds?: string[];
  /** Knowledge-fact ids this scene reveals or depends on. */
  revealsFactIds?: string[];
  requiresFactIds?: string[];
  setupForSceneIds?: string[];
  payoffOfSceneIds?: string[];
  /** User-authored screenplay content for this scene, in Fountain body syntax. */
  scriptText?: string;
}

export interface LocationObject extends BaseObject {
  kind: "location";
  description?: string;
  emotionalPurpose?: string;
  practicalRequirements?: string;
  /** Canonical scene-heading spelling, e.g. "MAMA NKECHI'S KITCHEN". */
  headingName: string;
}

export interface PropObject extends BaseObject {
  kind: "prop";
  description?: string;
  hero?: boolean;
  /** Scene where the prop is first established. */
  introducedInSceneId?: string;
}

export interface WorldRuleObject extends BaseObject {
  kind: "world-rule";
  rule: string;
  limitations?: string;
  costs?: string;
  taboos?: string;
}

export interface LoreEntryObject extends BaseObject {
  kind: "lore-entry";
  body: string;
  knownTruth?: string;
  believedTruth?: string;
  concealedTruth?: string;
  revealSceneId?: string;
}

export interface ThemeObject extends BaseObject {
  kind: "theme";
  statement: string;
}

/** Tone, cultural, and project laws are non-negotiable constraints. */
export interface LawObject extends BaseObject {
  kind: "tone-law" | "cultural-law" | "project-law";
  law: string;
  rationale?: string;
  /** Terms/claims that violate the law, used by gates for detection. */
  forbidden?: string[];
  /** Required canonical terminology, e.g. correct spellings of cultural terms. */
  requiredTerms?: string[];
}

export interface StoryBeatObject extends BaseObject {
  kind: "story-beat";
  act?: number;
  description: string;
  sceneIds?: string[];
}

/** Section 65: structured creative intention, not neurological certainty. */
export interface HumanMechanicsObject extends BaseObject {
  kind: "human-mechanics";
  sequenceName: string;
  intendedAudienceState?: string;
  startingEmotionalState?: string;
  escalationPattern?: string;
  sensoryMechanisms?: string;
  emotionalPeak?: string;
  release?: string;
  aftereffect?: string;
  sceneIds?: string[];
}

export interface ProductionNoteObject extends BaseObject {
  kind: "production-note";
  body: string;
  department?: string;
  /** Estimates must be labeled — never presented as fact. */
  isEstimate?: boolean;
  sceneIds?: string[];
}

/** A discrete fact a character comes to know at a specific point in the story. */
export interface KnowledgeFactObject extends BaseObject {
  kind: "knowledge-fact";
  fact: string;
  characterId: string;
  /** Scene (story order) at which the character learns the fact. */
  learnedInSceneId: string;
}

/** An approved decision — the unit of canon formation. */
export interface DecisionObject extends BaseObject {
  kind: "decision";
  question: string;
  resolution: string;
  approvedBy?: string;
  affectedObjectIds: string[];
}

export type ProjectObject =
  | Fragment
  | CharacterObject
  | RelationshipObject
  | SceneObject
  | LocationObject
  | PropObject
  | WorldRuleObject
  | LoreEntryObject
  | ThemeObject
  | LawObject
  | StoryBeatObject
  | HumanMechanicsObject
  | ProductionNoteObject
  | KnowledgeFactObject
  | DecisionObject;

export interface ProjectMeta {
  id: string;
  title: string;
  format?: string;
  genre?: string;
  subgenre?: string;
  tone?: string;
  logline?: string;
  hook?: string;
  shortSynopsis?: string;
  fullSynopsis?: string;
  thematicStatement?: string;
  audience?: string;
  developmentStatus?: string;
}

/**
 * An immutable snapshot of the project graph at a moment in time.
 * Compilation always runs against a snapshot, never live state, so delivered
 * packages remain historically preserved (section 68, step 21).
 */
export interface CanonSnapshot {
  id: string;
  projectId: string;
  createdAt: number;
  label?: string;
  meta: ProjectMeta;
  objects: ProjectObject[];
}

/** Convenience lookup over a snapshot. */
export function indexSnapshot(snapshot: CanonSnapshot): Map<string, ProjectObject> {
  return new Map(snapshot.objects.map((o) => [o.id, o]));
}

export function objectsOfKind<K extends ObjectKind>(
  snapshot: CanonSnapshot,
  kind: K,
): Extract<ProjectObject, { kind: K }>[] {
  return snapshot.objects.filter(
    (o): o is Extract<ProjectObject, { kind: K }> => o.kind === kind,
  );
}

/** Canon = objects whose truth status has been explicitly approved. */
export function isCanonical(o: ProjectObject): boolean {
  return o.truthStatus === "canonical";
}

export function canonicalObjects(snapshot: CanonSnapshot): ProjectObject[] {
  return snapshot.objects.filter(isCanonical);
}
