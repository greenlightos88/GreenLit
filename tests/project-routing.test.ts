import { describe, expect, test } from "bun:test";
import type { Id } from "../convex/_generated/dataModel";
import { projectFromSearch, resolveActiveProject } from "../src/pages/projectRouting";

const id = (value: string) => value as unknown as Id<"projects">;
const project = (value: string) => ({ _id: id(value), title: value });

describe("resolveActiveProject", () => {
  test("returns nulls while the authorized list is still loading", () => {
    const resolved = resolveActiveProject(undefined, id("A"));
    expect(resolved.activeProjectId).toBeNull();
    expect(resolved.requestedProject).toBeUndefined();
    expect(resolved.requestedUnavailable).toBe(false);
  });

  test("with no requested project, the first authorized project is active", () => {
    const resolved = resolveActiveProject([project("A"), project("B")], null);
    expect(resolved.activeProjectId).toBe(id("A"));
    expect(resolved.requestedUnavailable).toBe(false);
  });

  test("a requested authorized project is restored exactly (open / refresh / back)", () => {
    const resolved = resolveActiveProject([project("A"), project("B")], id("B"));
    expect(resolved.activeProjectId).toBe(id("B"));
    expect(resolved.requestedProject?._id).toBe(id("B"));
    expect(resolved.requestedUnavailable).toBe(false);
  });

  test("an unavailable/unauthorized id never becomes active and is flagged", () => {
    const resolved = resolveActiveProject([project("A")], id("UNAUTHORIZED"));
    expect(resolved.activeProjectId).toBe(id("A")); // fallback, never the unauthorized id
    expect(resolved.requestedProject).toBeUndefined();
    expect(resolved.requestedUnavailable).toBe(true);
  });

  test("an unavailable id with an empty list defers to the empty state, not a notice", () => {
    const resolved = resolveActiveProject([], id("ANYTHING"));
    expect(resolved.activeProjectId).toBeNull();
    expect(resolved.requestedUnavailable).toBe(false);
  });

  test("resolution is deterministic across reloads for the same inputs", () => {
    const list = [project("A"), project("B")];
    expect(resolveActiveProject(list, id("B")).activeProjectId).toBe(
      resolveActiveProject(list, id("B")).activeProjectId,
    );
  });
});

describe("projectFromSearch", () => {
  test("reads a non-empty project string", () => {
    expect(projectFromSearch({ project: "P1" })).toBe(id("P1"));
  });

  test("treats missing, empty, or non-string project as none", () => {
    expect(projectFromSearch({})).toBeNull();
    expect(projectFromSearch({ project: "" })).toBeNull();
    expect(projectFromSearch({ project: 42 as unknown as string })).toBeNull();
  });
});
