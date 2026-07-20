/**
 * Document composition engine types (section 57).
 *
 * A compiled section is never an opaque block of text: it carries structured
 * data, labeled content blocks with provenance, missing-information records,
 * and staleness state.
 */

import type { CanonSnapshot, ContentOrigin, SourceRef, TruthStatus } from "../graph/types";

export type Audience =
  | "internal"
  | "producer"
  | "studio"
  | "financier"
  | "director"
  | "department"
  | "casting"
  | "festival"
  | "press";

export type Confidentiality = "internal" | "trusted" | "external";

/** Section 58 staleness states. */
export type StaleStatus =
  | "current"
  | "potentially-stale"
  | "stale"
  | "conflicted"
  | "missing-required"
  | "awaiting-approval";

export interface ContentBlock {
  origin: ContentOrigin;
  /** Field label, e.g. "Conscious want". Absent for connective prose. */
  label?: string;
  text: string;
  sources: SourceRef[];
  /** True when the claim is assembled/inferred rather than quoted from source. */
  inference?: boolean;
  truthStatus?: TruthStatus;
}

export interface CompiledSection {
  id: string;
  sectionType: string;
  title: string;
  blocks: ContentBlock[];
  structured?: Record<string, unknown>;
  /** Union of all block sources, for staleness analysis. */
  sources: SourceRef[];
  /** Required information that could not be found in the graph. */
  missing: string[];
  /** Direct user edit that protects this section from regeneration. */
  userOverride?: { blocks: ContentBlock[]; overriddenAt: number; note?: string };
  staleStatus: StaleStatus;
  lastCompiledAt: number;
}

export interface CompileContext {
  audience: Audience;
  confidentiality: Confidentiality;
  /** "Create a pitch package without revealing the ending." */
  excludeEnding?: boolean;
  /** "Exclude sequel material from this producer package." */
  excludeSequelMaterial?: boolean;
  includeProvenance?: boolean;
  now: number;
}

export type SectionBuilder = (
  snapshot: CanonSnapshot,
  ctx: CompileContext,
) => CompiledSection[];

export interface SectionDefinition {
  id: string;
  title: string;
  required: boolean;
  build: SectionBuilder;
}

export type ProfileKind = "bible" | "packet" | "pitch" | "package" | "screenplay";

export interface DocumentProfile {
  id: string;
  title: string;
  kind: ProfileKind;
  defaultAudience: Audience;
  defaultConfidentiality: Confidentiality;
  description: string;
  sections: SectionDefinition[];
}

export type ApprovalStatus = "draft" | "approved" | "delivered";

export interface CompiledDocument {
  id: string;
  profileId: string;
  title: string;
  projectId: string;
  snapshotId: string;
  context: CompileContext;
  sections: CompiledSection[];
  /** Required sections that produced no content. */
  missingSections: string[];
  approvalStatus: ApprovalStatus;
  compilerVersion: string;
  createdAt: number;
}

export const COMPILER_VERSION = "0.1.0";

let sectionCounter = 0;
export function nextSectionId(): string {
  sectionCounter += 1;
  return `section-${sectionCounter}`;
}

let documentCounter = 0;
export function nextDocumentId(): string {
  documentCounter += 1;
  return `doc-${documentCounter}`;
}
