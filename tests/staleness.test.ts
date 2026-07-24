import { describe, expect, test } from "bun:test";
import { analyzeSectionStaleness } from "../convex/domain/compiler/staleness";
import type { CompiledSection } from "../convex/domain/compiler/types";
import type { CanonSnapshot, ProjectObject, SourceRef } from "../convex/domain/graph/types";
import { createSnapshot } from "../convex/domain/graph/canon";

/**
 * Section-level staleness classification (staleness.ts). ARCHITECTURE.md §
 * "Staleness and historical delivery": stale when a cited field changes,
 * potentially-stale when a non-cited field on a cited object changes,
 * conflicted when a source is removed, awaiting-approval when a protected edit
 * sits over changed sources.
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

function snap(objects: ProjectObject[]): CanonSnapshot {
  return createSnapshot({ projectId: "p", meta: { id: "p", title: "T" }, objects }, 0);
}

function section(sources: SourceRef[], extra: Partial<CompiledSection> = {}): CompiledSection {
  return {
    id: "sec",
    sectionType: "test",
    title: "Test Section",
    blocks: [],
    sources,
    missing: [],
    staleStatus: "current",
    lastCompiledAt: 0,
    ...extra,
  };
}

const CITE_NAME: SourceRef[] = [{ objectId: "o1", objectVersion: 1, field: "name" }];
const before = snap([frag("o1", "Original")]);

describe("analyzeSectionStaleness", () => {
  test("current when no cited source changed", () => {
    const result = analyzeSectionStaleness(section(CITE_NAME), before, before);
    expect(result.status).toBe("current");
    expect(result.reasons).toHaveLength(0);
  });

  test("stale when the exact cited field changes", () => {
    const after = snap([frag("o1", "Renamed")]);
    const result = analyzeSectionStaleness(section(CITE_NAME), before, after);
    expect(result.status).toBe("stale");
    expect(result.reasons[0]).toContain("name");
  });

  test("potentially-stale when a non-cited field on the source changes", () => {
    const after = snap([frag("o1", "Original", { text: "changed body" })]);
    const result = analyzeSectionStaleness(section(CITE_NAME), before, after);
    expect(result.status).toBe("potentially-stale");
  });

  test("conflicted when a cited source is removed", () => {
    const after = snap([]);
    const result = analyzeSectionStaleness(section(CITE_NAME), before, after);
    expect(result.status).toBe("conflicted");
  });

  test("awaiting-approval when a protected override sits over a changed source", () => {
    const after = snap([frag("o1", "Renamed")]);
    const overridden = section(CITE_NAME, {
      userOverride: { blocks: [], overriddenAt: 1 },
    });
    const result = analyzeSectionStaleness(overridden, before, after);
    expect(result.status).toBe("awaiting-approval");
  });

  test("missing-required when the section reports missing information", () => {
    const result = analyzeSectionStaleness(
      section(CITE_NAME, { missing: ["Short synopsis"] }),
      before,
      before,
    );
    expect(result.status).toBe("missing-required");
  });

  test("conflicted (highest severity) wins over a concurrent stale change", () => {
    // One cited source removed, another cited source's field changed.
    const twoBefore = snap([frag("o1", "Original"), frag("o2", "Second")]);
    const twoAfter = snap([frag("o2", "Second Renamed")]);
    const sources: SourceRef[] = [
      { objectId: "o1", objectVersion: 1, field: "name" },
      { objectId: "o2", objectVersion: 1, field: "name" },
    ];
    const result = analyzeSectionStaleness(section(sources), twoBefore, twoAfter);
    expect(result.status).toBe("conflicted");
  });
});
