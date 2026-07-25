/**
 * Deterministic Interpreter (Implementation Milestone 1, Phase 3).
 *
 * A transparent, rule-based interpreter behind the `Interpreter` interface. It
 * never writes Canon — it only proposes Candidate state, each with evidence,
 * origin, confidence, and uncertainty. Same input → same output.
 *
 * The rules are intentionally simple and explainable; a semantic/LLM interpreter
 * can replace this without any change to persistence or review.
 */

import type {
  CandidateOrigin,
  CandidateProposal,
  CandidateType,
  EvidenceRef,
  Interpreter,
  InterpreterInput,
} from "./types";

const CHARACTER_ROLES = [
  "keeper", "hydrologist", "detective", "teacher", "soldier", "doctor", "nurse",
  "mother", "father", "daughter", "son", "child", "king", "queen", "thief",
  "priest", "sailor", "captain", "farmer", "scientist", "engineer", "writer",
  "artist", "hunter", "warrior", "widow", "orphan", "smuggler", "fugitive",
  "stranger", "pilot", "miner", "fisherman", "guard", "spy", "nun", "monk",
];
const LOCATION_NOUNS = [
  "lighthouse", "coast", "island", "city", "town", "village", "forest", "house",
  "kitchen", "market", "lagoon", "archive", "harbor", "harbour", "station",
  "desert", "mountain", "river", "sea", "ocean", "cave", "castle", "temple",
  "school", "hospital", "prison", "ship", "bridge", "tower", "mine", "farm",
  "border", "camp", "bunker",
];
const THEME_WORDS = [
  "memory", "loss", "belonging", "grief", "betrayal", "identity", "survival",
  "redemption", "family", "power", "freedom", "guilt", "forgiveness", "revenge",
  "faith", "truth",
];
const WORLD_SIGNALS = [
  "tide", "bell", "bells", "spell", "magic", "curse", "prophecy", "ritual",
  "ghost", "spirit", "signal", "current", "drown", "drowning", "wreck",
];

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function evidence(fragmentId: string, text: string, quote: string): EvidenceRef {
  const start = text.toLowerCase().indexOf(quote.toLowerCase());
  return start >= 0
    ? { fragmentId, quote, start, end: start + quote.length }
    : { fragmentId, quote };
}

function proposal(
  candidateType: CandidateType,
  proposedObject: Record<string, unknown>,
  explanation: string,
  ev: EvidenceRef[],
  origin: CandidateOrigin,
  confidence: number,
  uncertainty: string[],
): CandidateProposal {
  return { candidateType, proposedObject, explanation, evidence: ev, origin, confidence, uncertainty };
}

/** Pure interpretation. Deterministic: same input yields the same proposals. */
export function interpretText(input: InterpreterInput): CandidateProposal[] {
  const { fragmentId, fragmentText: text } = input;
  const out: CandidateProposal[] = [];
  const known = new Set(input.canonContext.map((c) => c.name.toLowerCase()));
  const trimmed = text.trim();
  if (trimmed.length === 0) return out;

  // 1) Premise — always, from the full fragment (extracted).
  out.push(
    proposal(
      "premise",
      { text: trimmed },
      "Captured the submitted text as the project premise.",
      [evidence(fragmentId, text, trimmed.slice(0, 200))],
      "extracted",
      trimmed.length >= 40 ? 0.9 : 0.6,
      trimmed.length < 40
        ? ["Premise is very short; more detail would strengthen interpretation."]
        : [],
    ),
  );

  // 2) Characters — "a/an <…> <role>" descriptors and proper names.
  const seenChar = new Set<string>();
  const roleRe = new RegExp(
    `\\b(?:a|an)\\s+([a-z]+(?:\\s+[a-z]+){0,3}?\\s+(?:${CHARACTER_ROLES.join("|")}))\\b`,
    "gi",
  );
  for (const m of text.matchAll(roleRe)) {
    const phrase = m[1]!.trim();
    const key = `d:${phrase.toLowerCase()}`;
    if (seenChar.has(key)) continue;
    seenChar.add(key);
    out.push(
      proposal(
        "character",
        { name: null, descriptor: phrase, role: phrase },
        `Inferred a character from the descriptive phrase "${phrase}". No explicit name was given.`,
        [evidence(fragmentId, text, m[0]!.trim())],
        "inferred",
        0.6,
        ["No proper name provided — the creator should name this character."],
      ),
    );
  }
  const sentenceStarts = new Set(sentences(text).map((s) => s.match(/^([A-Z][a-z]+)/)?.[1] ?? ""));
  for (const m of text.matchAll(/\b([A-Z][a-z]{2,})\b/g)) {
    const name = m[1]!;
    const low = name.toLowerCase();
    if (LOCATION_NOUNS.includes(low) || THEME_WORDS.includes(low) || WORLD_SIGNALS.includes(low)) continue;
    if (sentenceStarts.has(name)) continue;
    const key = `n:${low}`;
    if (seenChar.has(key)) continue;
    seenChar.add(key);
    out.push(
      proposal(
        "character",
        { name, descriptor: null },
        `Detected the proper name "${name}" and proposed it as a character.`,
        [evidence(fragmentId, text, name)],
        "extracted",
        0.7,
        known.has(low) ? [] : ["Confirm this is a character (not a place or organization)."],
      ),
    );
  }

  // 3) Locations — lexicon terms present in the text.
  for (const noun of LOCATION_NOUNS) {
    if (new RegExp(`\\b${noun}\\b`, "i").test(text)) {
      out.push(
        proposal(
          "location",
          { name: noun },
          `Recognized "${noun}" as a candidate location referenced in the text.`,
          [evidence(fragmentId, text, noun)],
          "extracted",
          0.55,
          ["Confirm this is a distinct location and give it a canonical name."],
        ),
      );
    }
  }

  // 4) Themes — lexicon terms present.
  for (const word of THEME_WORDS) {
    if (new RegExp(`\\b${word}\\b`, "i").test(text)) {
      out.push(
        proposal(
          "theme",
          { name: word },
          `The word "${word}" suggests a possible theme.`,
          [evidence(fragmentId, text, word)],
          "inferred",
          0.4,
          ["Themes are interpretive; confirm this reflects the intended meaning."],
        ),
      );
    }
  }

  // 5) World rule — the first sentence carrying a speculative/mechanic signal.
  for (const s of sentences(text)) {
    if (WORLD_SIGNALS.some((sig) => new RegExp(`\\b${sig}\\b`, "i").test(s))) {
      out.push(
        proposal(
          "world-rule",
          { statement: s },
          "This sentence describes a possible world rule or speculative mechanic.",
          [evidence(fragmentId, text, s)],
          "inferred",
          0.45,
          ["Confirm whether this is a literal rule of the world or a figure of speech."],
        ),
      );
      break;
    }
  }

  return out;
}

export const deterministicInterpreter: Interpreter = {
  id: "deterministic",
  version: "1.0.0",
  interpret(input: InterpreterInput): Promise<readonly CandidateProposal[]> {
    return Promise.resolve(interpretText(input));
  },
};
