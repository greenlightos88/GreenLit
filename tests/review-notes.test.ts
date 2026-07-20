import { describe, expect, test } from "bun:test";
import { decideReviewNote, ingestReviewNote } from "../convex/domain/delivery/reviewNotes";

describe("external review-note ingestion", () => {
  test("validates and classifies a note without applying it", () => {
    const note = ingestReviewNote({
      author: "Producer",
      source: "Studio Review Package",
      documentVersion: "v3",
      page: 18,
      scene: "The interrupted crossing",
      note: "Can this storm and crowd sequence fit the schedule?",
    });

    expect(note.category).toBe("production-concern");
    expect(note.acceptanceStatus).toBe("pending");
    expect(note.affectedObjectIds).toEqual([]);
  });

  test("requires an explicit authorship decision", () => {
    const note = ingestReviewNote({
      author: "Story editor",
      source: "Screenplay",
      documentVersion: "v2",
      note: "The character motivation changes too quickly in act two.",
    });
    const decided = decideReviewNote(
      note,
      "convert-to-experiment",
      "Test an alternate bridge scene without changing canon.",
      ["char-amara"],
    );

    expect(decided.acceptanceStatus).toBe("convert-to-experiment");
    expect(decided.affectedObjectIds).toEqual(["char-amara"]);
  });
});
