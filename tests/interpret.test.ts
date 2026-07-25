import { describe, expect, test } from "bun:test";
import { deterministicInterpreter, interpretText } from "../convex/domain/interpret/deterministic";
import type { CandidateProposal, InterpreterInput } from "../convex/domain/interpret/types";

const TIDEWRACK =
  "A deaf lighthouse keeper on a drowning coast realizes the tide is ringing messages through the wreck-bells.";

function input(text: string): InterpreterInput {
  return { fragmentId: "frag-1", fragmentText: text, projectId: "proj-1", canonContext: [] };
}

const ORIGINS = new Set(["extracted", "inferred", "generated"]);

describe("deterministic interpreter — contract", () => {
  test("every proposal exposes origin, evidence, explanation, confidence, uncertainty", () => {
    const proposals = interpretText(input(TIDEWRACK));
    expect(proposals.length).toBeGreaterThan(0);
    for (const p of proposals) {
      expect(typeof p.candidateType).toBe("string");
      expect(typeof p.proposedObject).toBe("object");
      expect(p.explanation.length).toBeGreaterThan(0);
      expect(ORIGINS.has(p.origin)).toBe(true);
      expect(p.confidence).toBeGreaterThanOrEqual(0);
      expect(p.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(p.uncertainty)).toBe(true);
      expect(p.evidence.length).toBeGreaterThan(0);
      for (const e of p.evidence) {
        expect(e.fragmentId).toBe("frag-1");
        // The quoted evidence is present in the source text.
        expect(TIDEWRACK.toLowerCase()).toContain(e.quote.toLowerCase());
      }
    }
  });

  test("is deterministic — same input yields identical proposals", () => {
    expect(interpretText(input(TIDEWRACK))).toEqual(interpretText(input(TIDEWRACK)));
  });

  test("always proposes a premise for non-empty text, and nothing for empty", () => {
    expect(interpretText(input(TIDEWRACK)).some((p) => p.candidateType === "premise")).toBe(true);
    expect(interpretText(input("   \n  ")).length).toBe(0);
  });

  test("interprets the Tidewrack premise into a character, location, and world rule", () => {
    const byType = (ps: CandidateProposal[], t: string) => ps.filter((p) => p.candidateType === t);
    const proposals = interpretText(input(TIDEWRACK));

    const character = byType(proposals, "character")[0];
    expect(String(character?.proposedObject.descriptor)).toContain("keeper");

    expect(byType(proposals, "location").map((p) => p.proposedObject.name)).toContain("lighthouse");
    expect(byType(proposals, "world-rule").length).toBeGreaterThan(0);
    // Inferred proposals carry visible uncertainty.
    expect(byType(proposals, "world-rule")[0]?.uncertainty.length).toBeGreaterThan(0);
  });

  test("the Interpreter interface returns the same proposals as the pure function", async () => {
    expect(deterministicInterpreter.id).toBe("deterministic");
    const viaInterface = await deterministicInterpreter.interpret(input(TIDEWRACK));
    expect(viaInterface).toEqual(interpretText(input(TIDEWRACK)));
  });
});
