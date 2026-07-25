import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import { assertProjectAccess } from "./identity";

/**
 * Immutable Canon Snapshot creation (Phase 7). Freezes the approved canonical
 * objects into the shape the existing compiler consumes: the approved premise
 * populates snapshot meta (logline/short synopsis); the other approved objects
 * become snapshot.objects. Snapshots are frozen inputs — compilers never read
 * mutable live state.
 */

type Row = Record<string, unknown>;

function toSnapshotObject(o: Row): Row {
  const data = (o.data ?? {}) as Record<string, unknown>;
  const { __provenance, ...fields } = data;
  return {
    id: String(o.objectKey),
    kind: String(o.kind),
    projectId: String(o.projectId),
    version: Number(o.version),
    truthStatus: String(o.truthStatus),
    origin: String(o.origin),
    sources: [],
    createdAt: Number(o.createdAt),
    updatedAt: Number(o.updatedAt),
    name: String(o.name),
    ...fields,
    __provenance,
  };
}

export const createCanonSnapshot = mutation({
  args: { projectId: v.id("projects"), label: v.optional(v.string()) },
  handler: async (ctx, { projectId, label }) => {
    const { project } = await assertProjectAccess(ctx, projectId);
    const objects = await ctx.db
      .query("projectObjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    const canonical = objects.filter((o) => o.truthStatus === "canonical");
    const premise = canonical.find((o) => o.kind === "premise");
    const premiseText = premise
      ? String(((premise.data ?? {}) as Record<string, unknown>).text ?? "")
      : undefined;
    const graphObjects = canonical
      .filter((o) => o.kind !== "premise")
      .map((o) => toSnapshotObject(o as Row));

    const meta: Record<string, unknown> = {
      id: String(projectId),
      title: String(project.title),
      ...(project.format ? { format: project.format } : {}),
      ...(project.genre ? { genre: project.genre } : {}),
      ...(premiseText ? { logline: premiseText, shortSynopsis: premiseText } : {}),
    };

    const now = Date.now();
    const snapshotId = await ctx.db.insert("canonSnapshots", {
      projectId,
      projectVersion: Number(project.currentVersion ?? 1),
      ...(label !== undefined ? { label } : {}),
      meta,
      objects: graphObjects,
      createdAt: now,
    });
    return { snapshotId, objectCount: graphObjects.length, hasPremise: premiseText !== undefined };
  },
});

export const getCanonSnapshot = query({
  args: { snapshotId: v.id("canonSnapshots") },
  handler: async (ctx, { snapshotId }) => {
    const snap = await ctx.db.get(snapshotId);
    if (!snap) return null;
    await assertProjectAccess(ctx, snap.projectId as GenericId<"projects">);
    return snap;
  },
});
