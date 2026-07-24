import { describe, expect, test } from "bun:test";
import { diffSnapshots, createSnapshot } from "../convex/domain/graph/canon";
import {
  indexSnapshot,
  objectsOfKind,
  isCanonical,
  canonicalObjects,
} from "../convex/domain/graph/types";
import type { CanonSnapshot, ProjectObject } from "../convex/domain/graph/types";
import { fixtureSnapshot } from "../src/data/fixture";

/**
 * Invariants for the canon diff and snapshot constructor (graph/canon.ts) and
 * the snapshot query helpers (graph/types.ts). Pure functions only.
 */

function frag(
  id: string,
  name: string,
  fields: Record<string, unknown> = {},
): ProjectObject {
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

describe("diffSnapshots", () => {
  test("reports an added object", () => {
    const before = snap([frag("a", "A")]);
    const after = snap([frag("a", "A"), frag("b", "B")]);
    const diffs = diffSnapshots(before, after);
    const added = diffs.find((d) => d.objectId === "b");
    expect(added?.change).toBe("added");
    expect(diffs).toHaveLength(1);
  });

  test("reports a removed object", () => {
    const before = snap([frag("a", "A"), frag("b", "B")]);
    const after = snap([frag("a", "A")]);
    const removed = diffSnapshots(before, after).find((d) => d.objectId === "b");
    expect(removed?.change).toBe("removed");
  });

  test("reports a modified object with the exact changed field", () => {
    const before = snap([frag("a", "A", { text: "one" })]);
    const after = snap([frag("a", "A", { text: "two" })]);
    const modified = diffSnapshots(before, after).find((d) => d.objectId === "a");
    expect(modified?.change).toBe("modified");
    expect(modified?.changedFields).toEqual(["text"]);
  });

  test("ignores version and updatedAt churn (no false staleness)", () => {
    const before = snap([frag("a", "A", { version: 1, updatedAt: 100 })]);
    const after = snap([frag("a", "A", { version: 9, updatedAt: 999 })]);
    expect(diffSnapshots(before, after)).toHaveLength(0);
  });

  test("detects a nested-field change via deep comparison", () => {
    const before = snap([frag("a", "A", { sources: [] })]);
    const after = snap([
      frag("a", "A", { sources: [{ objectId: "x", objectVersion: 1 }] }),
    ]);
    const modified = diffSnapshots(before, after).find((d) => d.objectId === "a");
    expect(modified?.changedFields).toContain("sources");
  });
});

describe("createSnapshot", () => {
  test("deep-copies objects so later graph mutation cannot reach the snapshot", () => {
    const source = frag("a", "A", { text: "original" });
    const snapshot = createSnapshot(
      { projectId: "p", meta: { id: "p", title: "T" }, objects: [source] },
      123,
    );
    // Mutate the original object after snapshotting.
    (source as unknown as Record<string, unknown>).text = "mutated";
    const snapped = snapshot.objects[0] as unknown as Record<string, unknown>;
    expect(snapped.text).toBe("original");
    expect(snapshot.createdAt).toBe(123);
  });
});

describe("snapshot query helpers", () => {
  test("objectsOfKind returns only the requested kind", () => {
    const characters = objectsOfKind(fixtureSnapshot, "character");
    expect(characters.length).toBeGreaterThan(0);
    expect(characters.every((o) => o.kind === "character")).toBe(true);
  });

  test("canonicalObjects and isCanonical select only canonical truth status", () => {
    const canon = canonicalObjects(fixtureSnapshot);
    expect(canon.every(isCanonical)).toBe(true);
    expect(canon.every((o) => o.truthStatus === "canonical")).toBe(true);
    const nonCanon = frag("z", "Z", { truthStatus: "speculative" });
    expect(isCanonical(nonCanon)).toBe(false);
  });

  test("indexSnapshot maps every object id to its object", () => {
    const index = indexSnapshot(fixtureSnapshot);
    expect(index.size).toBe(fixtureSnapshot.objects.length);
    const first = fixtureSnapshot.objects[0];
    if (first) expect(index.get(first.id)?.id).toBe(first.id);
  });
});
