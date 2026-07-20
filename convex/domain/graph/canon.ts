import type { CanonSnapshot, ProjectObject } from "./types";

/** A single field-level difference between two versions of an object. */
export interface ObjectDiff {
  objectId: string;
  objectName: string;
  kind: ProjectObject["kind"];
  change: "added" | "removed" | "modified";
  changedFields: string[];
}

const IGNORED_FIELDS = new Set(["updatedAt", "version"]);

/**
 * Structural diff between two snapshots. Drives staleness propagation
 * (section 58) and delivered-package divergence reports (section 68, step 22).
 */
export function diffSnapshots(before: CanonSnapshot, after: CanonSnapshot): ObjectDiff[] {
  const beforeMap = new Map(before.objects.map((o) => [o.id, o]));
  const afterMap = new Map(after.objects.map((o) => [o.id, o]));
  const diffs: ObjectDiff[] = [];

  for (const [id, prev] of beforeMap) {
    const next = afterMap.get(id);
    if (!next) {
      diffs.push({
        objectId: id,
        objectName: prev.name,
        kind: prev.kind,
        change: "removed",
        changedFields: [],
      });
      continue;
    }
    const changedFields = diffFields(prev, next);
    if (changedFields.length > 0) {
      diffs.push({
        objectId: id,
        objectName: next.name,
        kind: next.kind,
        change: "modified",
        changedFields,
      });
    }
  }

  for (const [id, next] of afterMap) {
    if (!beforeMap.has(id)) {
      diffs.push({
        objectId: id,
        objectName: next.name,
        kind: next.kind,
        change: "added",
        changedFields: [],
      });
    }
  }

  return diffs;
}

function diffFields(a: ProjectObject, b: ProjectObject): string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (IGNORED_FIELDS.has(key)) continue;
    const av = (a as unknown as Record<string, unknown>)[key];
    const bv = (b as unknown as Record<string, unknown>)[key];
    if (JSON.stringify(av) !== JSON.stringify(bv)) changed.push(key);
  }
  return changed;
}

let snapshotCounter = 0;

/** Create an immutable snapshot of the current graph state. */
export function createSnapshot(
  base: Omit<CanonSnapshot, "id" | "createdAt" | "objects"> & { objects: ProjectObject[] },
  now: number = Date.now(),
): CanonSnapshot {
  snapshotCounter += 1;
  return {
    ...base,
    id: `snapshot-${now}-${snapshotCounter}`,
    createdAt: now,
    // Deep-copy so later graph mutations can never reach into a snapshot.
    objects: structuredClone(base.objects),
  };
}
