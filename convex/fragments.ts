import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import { assertProjectAccess } from "./identity";

/**
 * Fragment capture (Creative Kernel; CANON.md "Fragment").
 *
 * A Fragment is preserved source material. It is attributable (createdByUserId
 * from ctx.auth), authorized (owner of the project only), and immutable: there
 * is deliberately no update/rewrite path, and sourceVersion fixes the captured
 * version. Interpretation reads Fragments but never rewrites them.
 */
export const captureFragment = mutation({
  args: {
    projectId: v.id("projects"),
    text: v.string(),
    sourceType: v.string(),
    provenance: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { user } = await assertProjectAccess(ctx, args.projectId);
    const now = Date.now();
    const fragmentId = await ctx.db.insert("fragments", {
      projectId: args.projectId,
      text: args.text,
      sourceType: args.sourceType,
      createdByUserId: user._id,
      provenance: args.provenance,
      sourceVersion: 1,
      createdAt: now,
    });
    return { fragmentId, sourceVersion: 1 };
  },
});

export const listFragments = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await assertProjectAccess(ctx, projectId);
    return ctx.db
      .query("fragments")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
  },
});

export const getFragment = query({
  args: { fragmentId: v.id("fragments") },
  handler: async (ctx, { fragmentId }) => {
    const fragment = await ctx.db.get(fragmentId);
    if (!fragment) return null;
    // Authorize against the fragment's project.
    await assertProjectAccess(ctx, fragment.projectId as GenericId<"projects">);
    return fragment;
  },
});
