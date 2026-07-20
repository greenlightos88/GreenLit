import { describe, expect, test } from "bun:test";
import { compileDocument, overrideSection, traceSection } from "../convex/domain/compiler/compose";
import {
  characterBible,
  productionBible,
  storyBible,
  studioReviewPackage,
} from "../convex/domain/compiler/profiles";
import {
  isReadyToDeliver,
  overrideGate,
  runQualityGates,
} from "../convex/domain/compiler/gates";
import {
  analyzeDocumentImpact,
  markStaleness,
} from "../convex/domain/compiler/staleness";
import { extractProductionRequirements } from "../convex/domain/compiler/breakdown";
import { createSnapshot } from "../convex/domain/graph/canon";
import type { CanonSnapshot } from "../convex/domain/graph/types";
import { createDeliveryPackage } from "../convex/domain/delivery/types";
import { correctedFixtureSnapshot, fixtureSnapshot } from "../src/data/fixture";
import { exportHtml, exportMarkdown } from "../src/export/markdown";
import { exportPdf } from "../src/export/pdf";
import { exportDocx } from "../src/export/docx";

const NOW = Date.UTC(2026, 6, 19, 15);

describe("Production Intelligence Compiler", () => {
  test("compiles a complete Studio Review Package from one canon snapshot", () => {
    const document = compileDocument(fixtureSnapshot, studioReviewPackage, { now: NOW });

    expect(document.profileId).toBe("studio-review-package");
    expect(document.snapshotId).toBe(fixtureSnapshot.id);
    expect(document.sections.length).toBeGreaterThanOrEqual(9);
    expect(document.missingSections).toEqual([]);
    expect(document.sections.some((section) => section.sources.length > 0)).toBe(true);
  });

  test("detects missing required sections instead of inventing prose", () => {
    const sparse = createSnapshot(
      {
        projectId: "sparse-project",
        meta: { id: "sparse-project", title: "Untitled Development" },
        objects: [],
      },
      NOW,
    );
    const document = compileDocument(sparse, storyBible, { now: NOW });

    expect(document.missingSections).toContain("Project Overview");
    expect(document.missingSections).toContain("Narrative Architecture");
    expect(document.missingSections).toContain("Scene-Level Summary");
    expect(document.sections.flatMap((section) => section.missing).length).toBeGreaterThan(0);
  });

  test("fails the canon gate when a document cites an archived alternative", () => {
    const objects = fixtureSnapshot.objects.map((object) =>
      object.kind === "theme"
        ? { ...object, truthStatus: "archived-alternative" as const }
        : object,
    );
    const archivedSnapshot: CanonSnapshot = { ...fixtureSnapshot, id: "archived", objects };
    const document = compileDocument(archivedSnapshot, storyBible, { now: NOW });
    const gateRun = runQualityGates(document, archivedSnapshot, undefined, NOW);

    expect(gateRun.results.find((result) => result.gate === "canon")?.status).toBe("fail");
  });

  test("propagates a character correction only to dependent draft sections", () => {
    const document = compileDocument(fixtureSnapshot, characterBible, { now: NOW });
    const report = analyzeDocumentImpact(
      document,
      fixtureSnapshot,
      correctedFixtureSnapshot(),
    );
    const characterSection = report.sections.find((section) =>
      section.sectionTitle.includes("Amara Okoye"),
    );

    expect(characterSection?.status).toBe("stale");
    expect(report.sections.some((section) => section.status === "current")).toBe(true);
    expect(markStaleness(document, report).sections.some((section) => section.staleStatus === "stale")).toBe(true);
  });

  test("protects overrides while preserving the generated source version", () => {
    const document = compileDocument(fixtureSnapshot, studioReviewPackage, { now: NOW });
    const section = document.sections[0];
    expect(section).toBeDefined();
    if (!section) return;
    const edited = overrideSection(document, section.id, "A deliberately protected producer-facing statement.", "Approved wording", NOW);
    const trace = traceSection(edited, section.id, fixtureSnapshot);

    expect(edited.sections[0]?.userOverride?.blocks[0]?.text).toContain("protected");
    expect(section.userOverride).toBeUndefined();
    expect(trace?.userAuthoredShare).toBe(1);
  });

  test("extracts reviewable scene-level requirements and never auto-confirms them", () => {
    const requirements = extractProductionRequirements(fixtureSnapshot);

    expect(requirements.some((item) => item.category === "water")).toBe(true);
    expect(requirements.some((item) => item.category === "night-exterior")).toBe(true);
    expect(requirements.some((item) => item.category === "cultural-consultation")).toBe(true);
    expect(requirements.every((item) => item.confirmed === false)).toBe(true);
  });

  test("records a quality-gate override before allowing delivery", () => {
    const sparse = createSnapshot(
      { projectId: "sparse", meta: { id: "sparse", title: "Sparse" }, objects: [] },
      NOW,
    );
    const document = compileDocument(sparse, storyBible, { now: NOW });
    const run = runQualityGates(document, sparse, undefined, NOW);
    expect(isReadyToDeliver(run)).toBe(false);

    const overridden = overrideGate(run, "completeness", "Recipient requested an early development view.", "creator", NOW);
    expect(isReadyToDeliver(overridden)).toBe(true);
    expect(overridden.overrides[0]?.reason).toContain("early development");
  });

  test("freezes delivered packages against future draft edits", () => {
    const document = compileDocument(fixtureSnapshot, productionBible, { now: NOW });
    const gates = runQualityGates(document, fixtureSnapshot, undefined, NOW);
    const delivered = createDeliveryPackage(
      {
        projectId: fixtureSnapshot.projectId,
        label: "Producer delivery",
        recipient: "North Star Pictures",
        documents: [document],
        gateRuns: [gates],
        snapshotId: fixtureSnapshot.id,
      },
      NOW,
    );
    const firstSection = document.sections[0];
    if (!firstSection) throw new Error("Fixture must compile a section.");
    const laterDraft = overrideSection(document, firstSection.id, "Changed after delivery", undefined, NOW + 1);

    expect(delivered.documents[0]?.approvalStatus).toBe("delivered");
    expect(delivered.documents[0]?.sections[0]?.userOverride).toBeUndefined();
    expect(laterDraft.sections[0]?.userOverride).toBeDefined();
  });

  test("creates traceable Markdown and navigable HTML", () => {
    const document = compileDocument(fixtureSnapshot, studioReviewPackage, { now: NOW });
    const markdown = exportMarkdown(document, { includeProvenance: true });
    const html = exportHtml(document);

    expect(markdown).toContain("# The Salt Keepers");
    expect(markdown).toContain("inference");
    expect(html).toContain('aria-label="Table of contents"');
    expect(html).toContain("Project Overview");
  });

  test("generates non-empty PDF and editable DOCX files", async () => {
    const document = compileDocument(fixtureSnapshot, studioReviewPackage, { now: NOW });
    const pdf = new Uint8Array(await exportPdf(document));
    const docx = await exportDocx(document);

    expect(new TextDecoder().decode(pdf.slice(0, 4))).toBe("%PDF");
    expect(docx.size).toBeGreaterThan(1_000);
  });
});
