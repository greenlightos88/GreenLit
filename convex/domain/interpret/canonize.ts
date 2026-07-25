/**
 * Candidate → canonical object mapping (pure, Milestone 1 Phase 6).
 *
 * Maps an approved (or edited-and-approved) candidate onto the fields of a
 * canonical `projectObjects` row, reusing the existing ProjectObject model. This
 * is the canon-approval boundary in pure form: given a candidate + optional
 * creator edits, produce exactly the canonical object to persist. It never
 * decides approval — the caller (an explicit creator decision) does.
 */

import type { CandidateOrigin, CandidateType } from "./types";

export type CanonObjectOrigin = "user" | "generated" | "source-quotation";

export interface CanonicalObjectDraft {
  kind: string;
  name: string;
  truthStatus: "canonical";
  origin: CanonObjectOrigin;
  data: Record<string, unknown>;
  /** Premise flows into snapshot meta (logline/synopsis), not snapshot.objects. */
  isMeta: boolean;
}

const KIND: Record<CandidateType, string> = {
  premise: "premise",
  character: "character",
  relationship: "relationship",
  location: "location",
  "story-beat": "story-beat",
  theme: "theme",
  "world-rule": "world-rule",
  "production-note": "production-note",
};

/** Edited-and-approved content is creator-authored; otherwise map the interpreter origin. */
export function mapOrigin(origin: CandidateOrigin, edited: boolean): CanonObjectOrigin {
  if (edited) return "user";
  return origin === "extracted" ? "source-quotation" : "generated";
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function nameFor(
  candidateType: CandidateType,
  merged: Record<string, unknown>,
): string {
  if (candidateType === "premise") return "Premise";
  const explicit = str(merged.name) ?? str(merged.descriptor) ?? str(merged.role);
  if (explicit) return explicit;
  if (candidateType === "world-rule") {
    const statement = str(merged.statement);
    if (statement) return statement.length > 60 ? `${statement.slice(0, 57)}…` : statement;
  }
  return `Unnamed ${candidateType.replace("-", " ")}`;
}

export function buildCanonicalObject(params: {
  candidateType: CandidateType;
  proposedObject: Record<string, unknown>;
  origin: CandidateOrigin;
  edits?: Record<string, unknown>;
}): CanonicalObjectDraft {
  const edited = params.edits !== undefined && Object.keys(params.edits).length > 0;
  const merged = { ...params.proposedObject, ...(params.edits ?? {}) };
  return {
    kind: KIND[params.candidateType],
    name: nameFor(params.candidateType, merged),
    truthStatus: "canonical",
    origin: mapOrigin(params.origin, edited),
    data: merged,
    isMeta: params.candidateType === "premise",
  };
}
