/**
 * Document profile registry (sections 51–55).
 *
 * Every professional output — bibles, department packets, pitch materials,
 * the Studio Review Package — is a profile over the same canonical graph.
 */

import type { DocumentProfile, SectionDefinition } from "./types";
import {
  buildCharacterSections,
  buildLoreSections,
  buildNarrativeArchitecture,
  buildProjectOverview,
  buildRelationshipSections,
  buildSceneBreakdown,
  buildSetupsPayoffs,
  buildThemes,
  buildUnresolvedQuestions,
  buildWorldSections,
} from "./sections";
import {
  buildCastingRoles,
  buildComplexitySection,
  buildDepartmentRequirements,
  buildHumanMechanics,
  buildProductionNotes,
  buildProductionRequirementsSection,
  buildProjectLaws,
  buildRiskRegister,
} from "./production";

function def(
  id: string,
  title: string,
  required: boolean,
  build: SectionDefinition["build"],
): SectionDefinition {
  return { id, title, required, build };
}

const OVERVIEW = def("overview", "Project Overview", true, buildProjectOverview);
const THEMES = def("themes", "Themes", false, buildThemes);
const LAWS = def("laws", "Project Laws", false, buildProjectLaws);
const MECHANICS = def("human-mechanics", "Human Mechanics", false, buildHumanMechanics);
const UNRESOLVED = def(
  "unresolved",
  "Unresolved Questions",
  false,
  buildUnresolvedQuestions,
);

export const storyBible: DocumentProfile = {
  id: "story-bible",
  title: "Story Bible",
  kind: "bible",
  defaultAudience: "studio",
  defaultConfidentiality: "trusted",
  description: "Comprehensive narrative source of truth.",
  sections: [
    OVERVIEW,
    THEMES,
    def("architecture", "Narrative Architecture", true, buildNarrativeArchitecture),
    def("scenes", "Scene-Level Summary", true, buildSceneBreakdown),
    def("setups", "Setups and Payoffs", false, buildSetupsPayoffs),
    UNRESOLVED,
  ],
};

export const characterBible: DocumentProfile = {
  id: "character-bible",
  title: "Character Bible",
  kind: "bible",
  defaultAudience: "studio",
  defaultConfidentiality: "trusted",
  description: "Every major and supporting character, from canon only.",
  sections: [
    OVERVIEW,
    def("characters", "Characters", true, buildCharacterSections),
    def("relationships", "Relationships", false, buildRelationshipSections),
  ],
};

export const relationshipBible: DocumentProfile = {
  id: "relationship-bible",
  title: "Relationship Bible",
  kind: "bible",
  defaultAudience: "internal",
  defaultConfidentiality: "internal",
  description: "Relationship dynamics, arcs, and altering scenes.",
  sections: [OVERVIEW, def("relationships", "Relationships", true, buildRelationshipSections)],
};

export const worldBible: DocumentProfile = {
  id: "world-bible",
  title: "World Bible",
  kind: "bible",
  defaultAudience: "studio",
  defaultConfidentiality: "trusted",
  description: "Setting, rules, locations, and cultural foundation.",
  sections: [OVERVIEW, def("world", "The World", true, buildWorldSections), LAWS],
};

export const loreBible: DocumentProfile = {
  id: "lore-bible",
  title: "Lore and Mythology Bible",
  kind: "bible",
  defaultAudience: "internal",
  defaultConfidentiality: "internal",
  description: "Known, believed, and concealed truths with reveal schedule.",
  sections: [OVERVIEW, def("lore", "Lore", true, buildLoreSections)],
};

export const productionBible: DocumentProfile = {
  id: "production-bible",
  title: "Production Bible",
  kind: "bible",
  defaultAudience: "department",
  defaultConfidentiality: "trusted",
  description: "Creative intention translated into actionable production understanding.",
  sections: [
    OVERVIEW,
    LAWS,
    def("requirements", "Production Requirements", true, buildProductionRequirementsSection),
    def("complexity", "Complexity and Pressure", false, buildComplexitySection),
    MECHANICS,
    def("notes", "Production Notes", false, buildProductionNotes),
    def("risks", "Risk Register", false, buildRiskRegister),
    UNRESOLVED,
  ],
};

function departmentPacket(
  id: string,
  title: string,
  extra: SectionDefinition[] = [],
): DocumentProfile {
  return {
    id,
    title,
    kind: "packet",
    defaultAudience: "department",
    defaultConfidentiality: "trusted",
    description: `${title} generated from the master production bible.`,
    sections: [
      OVERVIEW,
      LAWS,
      def("requirements", "Scene-Level Requirements", true, buildDepartmentRequirements(id)),
      ...extra,
      UNRESOLVED,
    ],
  };
}

export const producerPacket: DocumentProfile = {
  id: "producer-packet",
  title: "Producer Packet",
  kind: "packet",
  defaultAudience: "producer",
  defaultConfidentiality: "external",
  description: "Executive summary, status, scope, risks, and next steps.",
  sections: [
    OVERVIEW,
    THEMES,
    def("architecture", "Story Summary", true, buildNarrativeArchitecture),
    def("complexity", "Production Scope", false, buildComplexitySection),
    def("risks", "Primary Risks", false, buildRiskRegister),
    UNRESOLVED,
  ],
};

export const directorPacket: DocumentProfile = {
  id: "director-packet",
  title: "Director Packet",
  kind: "packet",
  defaultAudience: "director",
  defaultConfidentiality: "trusted",
  description: "Creative thesis, tone, mechanics, and non-negotiable laws.",
  sections: [
    OVERVIEW,
    THEMES,
    LAWS,
    MECHANICS,
    def("scenes", "Key Sequences", false, buildSceneBreakdown),
    UNRESOLVED,
  ],
};

export const castingPacket: DocumentProfile = {
  id: "casting-packet",
  title: "Casting Packet",
  kind: "packet",
  defaultAudience: "casting",
  defaultConfidentiality: "trusted",
  description: "Roles, ranges, authenticity requirements, no stereotyping.",
  sections: [
    OVERVIEW,
    def("roles", "Roles", true, buildCastingRoles),
    def("requirements", "Scene-Level Requirements", false, buildDepartmentRequirements("casting-packet")),
  ],
};

export const departmentPackets: DocumentProfile[] = [
  producerPacket,
  directorPacket,
  castingPacket,
  departmentPacket("location-packet", "Location Packet"),
  departmentPacket("production-design-packet", "Production Design Packet"),
  departmentPacket("costume-packet", "Costume Packet"),
  departmentPacket("hair-makeup-packet", "Hair and Makeup Packet"),
  departmentPacket("sound-packet", "Sound Packet", [MECHANICS]),
  departmentPacket("music-packet", "Music Packet"),
  departmentPacket("vfx-packet", "VFX and SFX Packet"),
  departmentPacket("stunts-packet", "Stunts and Safety Packet"),
];

export const oneSheet: DocumentProfile = {
  id: "one-sheet",
  title: "One-Sheet",
  kind: "pitch",
  defaultAudience: "producer",
  defaultConfidentiality: "external",
  description: "Single-page outward-facing summary.",
  sections: [OVERVIEW, THEMES],
};

export const pitchDocument: DocumentProfile = {
  id: "pitch-document",
  title: "Pitch Document",
  kind: "pitch",
  defaultAudience: "producer",
  defaultConfidentiality: "external",
  description: "Concise pitch traceable to the master project.",
  sections: [
    OVERVIEW,
    THEMES,
    def("architecture", "Story", true, buildNarrativeArchitecture),
    def("characters", "Main Characters", true, buildCharacterSections),
  ],
};

/** Section 54: the Studio Review Package preset. */
export const studioReviewPackage: DocumentProfile = {
  id: "studio-review-package",
  title: "Studio Review Package",
  kind: "package",
  defaultAudience: "studio",
  defaultConfidentiality: "external",
  description:
    "Complete producer-facing package: story, characters, world, structure, mechanics, scope, status.",
  sections: [
    OVERVIEW,
    THEMES,
    def("characters", "Main Characters", true, buildCharacterSections),
    def("relationships", "Character Relationships", false, buildRelationshipSections),
    def("world", "World Overview", false, buildWorldSections),
    def("architecture", "Story Structure", true, buildNarrativeArchitecture),
    def("scenes", "Key Sequences", false, buildSceneBreakdown),
    MECHANICS,
    def("complexity", "Production Scope", false, buildComplexitySection),
    UNRESOLVED,
  ],
};

export const ALL_PROFILES: DocumentProfile[] = [
  storyBible,
  characterBible,
  relationshipBible,
  worldBible,
  loreBible,
  productionBible,
  ...departmentPackets,
  oneSheet,
  pitchDocument,
  studioReviewPackage,
];

export function getProfile(id: string): DocumentProfile | undefined {
  return ALL_PROFILES.find((p) => p.id === id);
}
