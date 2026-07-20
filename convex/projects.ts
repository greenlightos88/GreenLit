import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";

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
    const existing = args.projectId ? await ctx.db.get(args.projectId) : null;
    const projectVersion = (existing?.currentVersion ?? 0) + 1;
    const projectId = args.projectId ?? await ctx.db.insert("projects", {
      title: args.title,
      format: args.format,
      genre: args.genre,
      developmentStatus: args.developmentStatus,
      currentVersion: projectVersion,
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
  handler: async (ctx) =>
    ctx.db.query("projects").withIndex("by_updated").order("desc").collect(),
});

export const getLatestSnapshot = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) =>
    ctx.db
      .query("canonSnapshots")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .first(),
});
