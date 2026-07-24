import { describe, expect, test } from "bun:test";
import {
  filterSnapshot,
  visibleBlocks,
  overrideSection,
  restoreGenerated,
} from "../convex/domain/compiler/compose";
import type {
  CompileContext,
  CompiledDocument,
  CompiledSection,
} from "../convex/domain/compiler/types";
import type { CanonSnapshot, ProjectObject } from "../convex/domain/graph/types";
import { createSnapshot } from "../convex/domain/graph/canon";

/**
 * Confidentiality/scoping filter (filterSnapshot) and the document editing law
 * (visibleBlocks / overrideSection / restoreGenerated) from compose.ts.
 * ARCHITECTURE.md invariant 4: a direct edit becomes a protected override and
 * the generated version is never destroyed.
 */

function frag(id: string, name: string, fields: Record<string, unknown> = {}): ProjectObject {
  return {
    id,
    kind: "fragment",
    projectId: "p",
    version: 1,
    truthStatus: "canonical",
    origin: "user",
    sources: [],
    createdAt: 0,
    updatedAt: 0,
    name,
    text: "body",
    ...fields,
  } as ProjectObject;
}

function ctx(confidentiality: CompileContext["confidentiality"], extra: Partial<CompileContext> = {}): CompileContext {
  return { audience: "producer", confidentiality, now: 0, ...extra };
}

const snapshot: CanonSnapshot = createSnapshot(
  {
    projectId: "p",
    meta: { id: "p", title: "T" },
    objects: [
      frag("open", "Open"),
      frag("secret", "Secret", { confidential: true }),
      frag("sequel", "Sequel Hook", { sequelMaterial: true }),
    ],
  },
  0,
);

describe("filterSnapshot", () => {
  test("strips confidential objects for an external package", () => {
    const ids = filterSnapshot(snapshot, ctx("external")).objects.map((o) => o.id);
    expect(ids).toContain("open");
    expect(ids).not.toContain("secret");
    expect(ids).toContain("sequel");
  });

  test("keeps confidential objects for an internal package", () => {
    const ids = filterSnapshot(snapshot, ctx("internal")).objects.map((o) => o.id);
    expect(ids).toContain("secret");
  });

  test("excludes sequel material only when requested", () => {
    const withSequel = filterSnapshot(snapshot, ctx("internal")).objects.map((o) => o.id);
    expect(withSequel).toContain("sequel");
    const withoutSequel = filterSnapshot(
      snapshot,
      ctx("internal", { excludeSequelMaterial: true }),
    ).objects.map((o) => o.id);
    expect(withoutSequel).not.toContain("sequel");
  });

  test("returns a new snapshot object and preserves non-object fields", () => {
    const filtered = filterSnapshot(snapshot, ctx("external"));
    expect(filtered).not.toBe(snapshot);
    expect(filtered.id).toBe(snapshot.id);
    expect(snapshot.objects).toHaveLength(3); // original untouched
  });
});

describe("document editing law", () => {
  function makeDoc(): CompiledDocument {
    const section: CompiledSection = {
      id: "sec-1",
      sectionType: "overview",
      title: "Overview",
      blocks: [
        { origin: "generated", text: "Generated summary.", sources: [], inference: true },
      ],
      sources: [{ objectId: "open", objectVersion: 1 }],
      missing: [],
      staleStatus: "current",
      lastCompiledAt: 0,
    };
    return {
      id: "doc-1",
      profileId: "story-bible",
      title: "T",
      projectId: "p",
      snapshotId: snapshot.id,
      context: ctx("internal"),
      sections: [section],
      missingSections: [],
      approvalStatus: "draft",
      compilerVersion: "0.1.0",
      createdAt: 0,
    };
  }

  test("visibleBlocks shows generated content until an override exists", () => {
    const doc = makeDoc();
    const section = doc.sections[0];
    if (!section) throw new Error("section");
    expect(visibleBlocks(section)[0]?.origin).toBe("generated");
  });

  test("overrideSection protects the edit while preserving the generated version", () => {
    const doc = makeDoc();
    const edited = overrideSection(doc, "sec-1", "Producer-approved wording.", "Locked", 42);
    const editedSection = edited.sections[0];
    const originalSection = doc.sections[0];
    if (!editedSection || !originalSection) throw new Error("section");

    // Override is visible and marked user-authored.
    expect(visibleBlocks(editedSection)[0]?.text).toBe("Producer-approved wording.");
    expect(visibleBlocks(editedSection)[0]?.origin).toBe("user");
    expect(editedSection.userOverride?.note).toBe("Locked");
    expect(editedSection.userOverride?.overriddenAt).toBe(42);
    // Override inherits the section's sources (provenance is retained).
    expect(editedSection.userOverride?.blocks[0]?.sources).toEqual(originalSection.sources);
    // The generated version is never destroyed.
    expect(editedSection.blocks[0]?.origin).toBe("generated");
    // The original document object is not mutated in place.
    expect(originalSection.userOverride).toBeUndefined();
  });

  test("restoreGenerated removes the override and returns to generated content", () => {
    const doc = makeDoc();
    const edited = overrideSection(doc, "sec-1", "Temp edit", undefined, 1);
    const restored = restoreGenerated(edited, "sec-1");
    const section = restored.sections[0];
    if (!section) throw new Error("section");
    expect(section.userOverride).toBeUndefined();
    expect(visibleBlocks(section)[0]?.origin).toBe("generated");
  });
});
