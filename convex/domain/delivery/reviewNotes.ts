/**
 * External review and notes ingestion (section 62).
 *
 * Notes are validated at the boundary with Zod, classified, and routed to an
 * explicit human decision. External notes are never applied automatically —
 * the user retains authorship and final authority.
 */

import { z } from "zod";

export const reviewNoteCategories = [
  "question",
  "correction",
  "preference",
  "concern",
  "continuity-issue",
  "budget-concern",
  "production-concern",
  "character-note",
  "story-note",
  "dialogue-note",
  "cultural-note",
  "legal-clearance-flag",
  "visual-note",
  "sound-note",
  "marketing-note",
] as const;

export const reviewNoteSchema = z.object({
  author: z.string().min(1),
  source: z.string().min(1),
  documentVersion: z.string().min(1),
  page: z.number().int().positive().optional(),
  scene: z.string().optional(),
  section: z.string().optional(),
  quotedTarget: z.string().optional(),
  note: z.string().min(1),
  category: z.enum(reviewNoteCategories).optional(),
  severity: z.enum(["low", "medium", "high", "blocking"]).default("medium"),
  requestedChange: z.string().optional(),
});

export type ReviewNoteInput = z.input<typeof reviewNoteSchema>;

export type ReviewDecisionAction =
  | "accept"
  | "partially-accept"
  | "reject"
  | "defer"
  | "ask-for-clarification"
  | "convert-to-experiment";

export interface ReviewNote extends z.output<typeof reviewNoteSchema> {
  id: string;
  category: (typeof reviewNoteCategories)[number];
  inferredIntent?: string;
  acceptanceStatus: "pending" | ReviewDecisionAction;
  response?: string;
  affectedObjectIds: string[];
  createdAt: number;
}

const CLASSIFICATION_RULES: [RegExp, (typeof reviewNoteCategories)[number]][] = [
  [/\b(budget|cost|expensive|afford)\b/i, "budget-concern"],
  [/\b(schedule|shoot|location|logistics|permit)\b/i, "production-concern"],
  [/\b(continuity|timeline|already|earlier scene|contradicts)\b/i, "continuity-issue"],
  [/\b(clearance|rights|legal|trademark|likeness)\b/i, "legal-clearance-flag"],
  [/\b(culture|cultural|igbo|yoruba|authentic|tradition)\b/i, "cultural-note"],
  [/\b(dialogue|line|speech|says)\b/i, "dialogue-note"],
  [/\b(character|arc|motivation)\b/i, "character-note"],
  [/\b(sound|score|music|silence)\b/i, "sound-note"],
  [/\b(look|visual|color|frame|lighting)\b/i, "visual-note"],
  [/\b(market|audience|poster|trailer)\b/i, "marketing-note"],
  [/\b(story|plot|structure|act|ending)\b/i, "story-note"],
  // A specific concern remains more useful than the note's sentence form.
  [/\?\s*$/, "question"],
];

let noteCounter = 0;

/** Validate, classify, and register an incoming note. Throws on invalid input. */
export function ingestReviewNote(
  input: ReviewNoteInput,
  now: number = Date.now(),
): ReviewNote {
  const parsed = reviewNoteSchema.parse(input);
  noteCounter += 1;
  let category = parsed.category;
  if (!category) {
    category =
      CLASSIFICATION_RULES.find(([pattern]) => pattern.test(parsed.note))?.[1] ??
      "concern";
  }
  return {
    ...parsed,
    id: `note-${noteCounter}`,
    category,
    acceptanceStatus: "pending",
    affectedObjectIds: [],
    createdAt: now,
  };
}

export function decideReviewNote(
  note: ReviewNote,
  action: ReviewDecisionAction,
  response?: string,
  affectedObjectIds: string[] = [],
): ReviewNote {
  return {
    ...note,
    acceptanceStatus: action,
    response,
    affectedObjectIds,
  };
}
