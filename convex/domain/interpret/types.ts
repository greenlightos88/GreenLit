/**
 * Interpreter contract (Implementation Milestone 1; INTELLIGENCE.md).
 *
 * A replaceable interface: persistence and review logic must never depend on a
 * particular interpreter implementation (deterministic, LLM, specialist agent).
 * Every proposal is Candidate state — never Canon — and must expose origin,
 * evidence, explanation, confidence, and uncertainty so no proposal is opaque.
 */

/** The deliberately narrow ontology for Milestone 1. Do not expand until the
 * full vertical slice works. */
export type CandidateType =
  | "premise"
  | "character"
  | "relationship"
  | "location"
  | "story-beat"
  | "theme"
  | "world-rule"
  | "production-note";

/** How the interpreter arrived at the proposal. Not truth — approval is truth. */
export type CandidateOrigin = "extracted" | "inferred" | "generated";

/** A reference from a proposal back to the exact source it derives from. */
export interface EvidenceRef {
  fragmentId: string;
  /** The exact snippet quoted from the fragment text. */
  quote: string;
  /** Optional character offsets into the fragment text. */
  start?: number;
  end?: number;
}

/** Bounded approved-Canon context supplied to the interpreter (read-only). */
export interface CanonContextItem {
  objectKey: string;
  kind: string;
  name: string;
}

export interface InterpreterInput {
  fragmentId: string;
  fragmentText: string;
  projectId: string;
  canonContext: readonly CanonContextItem[];
}

export interface CandidateProposal {
  candidateType: CandidateType;
  /** The proposed structured object's fields (shape depends on candidateType). */
  proposedObject: Record<string, unknown>;
  explanation: string;
  evidence: readonly EvidenceRef[];
  origin: CandidateOrigin;
  /** Interpreter's self-assessment in [0, 1]. High confidence still requires approval. */
  confidence: number;
  /** Visible ambiguity, missing evidence, or contradiction. Never hidden. */
  uncertainty: readonly string[];
}

export interface Interpreter {
  readonly id: string;
  readonly version: string;
  interpret(input: InterpreterInput): Promise<readonly CandidateProposal[]>;
}
