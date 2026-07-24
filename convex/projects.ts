import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import {
  assertProjectAccess,
  ensureCurrentUser,
  requireAuthenticatedUser,
} from "./identity";

/** Store a project graph and create the immutable snapshot used by compilers. */
export const saveProjectSnapshot = mutation({
  args: {
    projectId: v.optional(v.id("projects")),
    title: v.string(),
    format: v.optional(v.string()),
    genre: v.optional(v.string()),
    developmentStatus: v.optional(v.string()),
    label: v.optional(v.string()),
    meta: v.any(),
    objects: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // Provision (or resolve) the authenticated human, then verify ownership of
    // an existing project before touching it. New projects are stamped with the
    // caller as owner.
    const user = await ensureCurrentUser(ctx);
    const existing = args.projectId
      ? (await assertProjectAccess(ctx, args.projectId)).project
      : null;
    // `existing` is a loosely typed generic document; currentVersion is a
    // number per the schema.
    const projectVersion = ((existing?.currentVersion as number | undefined) ?? 0) + 1;
    const projectId = args.projectId ?? await ctx.db.insert("projects", {
      title: args.title,
      format: args.format,
      genre: args.genre,
      developmentStatus: args.developmentStatus,
      currentVersion: projectVersion,
      ownerUserId: user._id,
      createdAt: now,
      updatedAt: now,
    });
    if (existing) {
      await ctx.db.patch(projectId, {
        title: args.title,
        format: args.format,
        genre: args.genre,
        developmentStatus: args.developmentStatus,
        currentVersion: projectVersion,
        updatedAt: now,
      });
    }

    for (const object of args.objects) {
      const prior = await ctx.db
        .query("projectObjects")
        .withIndex("by_project_key", (q) => q.eq("projectId", projectId))
        .filter((q) => q.eq(q.field("objectKey"), object.id))
        .unique();
      const value = {
        projectId,
        objectKey: object.id,
        kind: object.kind,
        name: object.name,
        version: object.version,
        truthStatus: object.truthStatus,
        origin: object.origin,
        data: object,
        sourceObjectKeys: (object.sources ?? []).map(
          (source: { objectId: string }) => source.objectId,
        ),
        confidential: object.confidential,
        sequelMaterial: object.sequelMaterial,
        createdAt: prior?.createdAt ?? now,
        updatedAt: now,
      };
      if (prior) await ctx.db.replace(prior._id, value);
      else await ctx.db.insert("projectObjects", value);
    }

    const snapshotId = await ctx.db.insert("canonSnapshots", {
      projectId,
      projectVersion,
      label: args.label,
      meta: args.meta,
      objects: args.objects,
      createdAt: now,
    });
    return { projectId, snapshotId, projectVersion };
  },
});

export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    // Scoped to the authenticated owner — no longer returns every project.
    const user = await requireAuthenticatedUser(ctx);
    return ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", user._id))
      .order("desc")
      .collect();
  },
});

export const getLatestSnapshot = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await assertProjectAccess(ctx, projectId);
    return ctx.db
      .query("canonSnapshots")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .first();
  },
});
