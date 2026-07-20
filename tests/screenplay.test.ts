import { describe, expect, test } from "bun:test";
import { compileScreenplay } from "../convex/domain/screenplay/compile";
import { serializeFdx } from "../convex/domain/screenplay/fdx";
import { parseFountain, serializeFountain } from "../convex/domain/screenplay/fountain";
import { validateDraft } from "../convex/domain/screenplay/validate";
import { fixtureSnapshot } from "../src/data/fixture";

describe("screenplay compiler", () => {
  test("preserves user-authored material while imposing standard headings", () => {
    const draft = compileScreenplay(fixtureSnapshot, { mode: "preserve" });
    const fountain = serializeFountain(draft);

    expect(fountain).toContain("EXT. ORU LAGOON - DAWN");
    expect(fountain).toContain("Metal doesn't remember. People do.");
    expect(draft.mode).toBe("preserve");
  });

  test("creates a numbered production draft", () => {
    const draft = compileScreenplay(fixtureSnapshot, { mode: "production-draft" });
    const fountain = serializeFountain(draft);

    expect(draft.scenes.every((scene) => Boolean(scene.number))).toBe(true);
    expect(fountain).toContain("#1#");
  });

  test("submission mode strips development annotations", () => {
    const draft = compileScreenplay(fixtureSnapshot, { mode: "submission" });
    const elements = draft.scenes.flatMap((scene) => scene.elements);

    expect(elements.some((element) => element.type === "note" || element.type === "synopsis")).toBe(false);
  });

  test("Fountain parser round-trips typed screenplay elements", () => {
    const source = `Title: A Test\nAuthor: Writer\n\nINT. ROOM - NIGHT\n\nA clock stops.\n\nMARA\n(whispering)\nNot again.\n`;
    const parsed = parseFountain(source);
    const reparsed = parseFountain(serializeFountain(parsed));

    expect(reparsed.titlePage.title).toBe("A Test");
    expect(reparsed.scenes[0]?.heading.location).toBe("ROOM");
    expect(reparsed.scenes[0]?.elements.some((element) => element.type === "dialogue")).toBe(true);
  });

  test("generates well-formed FDX interchange structure", () => {
    const draft = compileScreenplay(fixtureSnapshot, { mode: "production-draft" });
    const fdx = serializeFdx(draft);

    expect(fdx).toStartWith("<?xml version=");
    expect(fdx).toContain('<FinalDraft DocumentType="Script"');
    expect(fdx).toContain('Type="Scene Heading" Number="1"');
    expect(fdx).toContain("</FinalDraft>");
  });

  test("reports issue, consequence, proposed fix, and downstream impact", () => {
    const draft = compileScreenplay(fixtureSnapshot, { mode: "preserve" });
    const issues = validateDraft(draft, fixtureSnapshot);
    const prematureKnowledge = issues.find((issue) => issue.code === "premature-knowledge");
    const propContinuity = issues.find((issue) => issue.code === "prop-before-introduction");

    expect(prematureKnowledge?.consequence).toBeTruthy();
    expect(prematureKnowledge?.proposedFix).toBeTruthy();
    expect(prematureKnowledge?.affectedDocuments).toContain("screenplay");
    expect(propContinuity?.requiresApproval).toBe(true);
  });
});
