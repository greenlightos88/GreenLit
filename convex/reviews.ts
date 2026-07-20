import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";

export const recordReviewNote = mutation({
  args: {
    roomId: v.optional(v.id("deliveryRooms")),
    documentVersionId: v.id("documentVersions"),
    author: v.string(),
    source: v.string(),
    page: v.optional(v.number()),
    scene: v.optional(v.string()),
    section: v.optional(v.string()),
    quotedTargetText: v.optional(v.string()),
    note: v.string(),
    category: v.string(),
    severity: v.string(),
    requestedChange: v.optional(v.string()),
    inferredIntent: v.optional(v.string()),
    targetObjectKeys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const noteId = await ctx.db.insert("reviewNotes", {
      roomId: args.roomId,
      author: args.author,
      source: args.source,
      documentVersionId: args.documentVersionId,
      page: args.page,
      scene: args.scene,
      section: args.section,
      quotedTargetText: args.quotedTargetText,
      note: args.note,
      category: args.category,
      severity: args.severity,
      requestedChange: args.requestedChange,
      inferredIntent: args.inferredIntent,
      acceptanceStatus: "pending",
      createdAt: Date.now(),
    });
    for (const objectKey of args.targetObjectKeys) {
      await ctx.db.insert("reviewNoteTargets", { reviewNoteId: noteId, objectKey });
    }
    return noteId;
  },
});

export const decideReviewNote = mutation({
  args: {
    reviewNoteId: v.id("reviewNotes"),
    action: v.string(),
    response: v.optional(v.string()),
    resultingDecisionKey: v.optional(v.string()),
    resultingArtifactVersion: v.optional(v.string()),
    decidedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.reviewNoteId);
    if (!note) throw new Error("Review note not found.");
    const decidedAt = Date.now();
    const decisionId = await ctx.db.insert("reviewDecisions", {
      reviewNoteId: args.reviewNoteId,
      action: args.action,
      response: args.response,
      resultingDecisionKey: args.resultingDecisionKey,
      resultingArtifactVersion: args.resultingArtifactVersion,
      decidedBy: args.decidedBy,
      decidedAt,
    });
    await ctx.db.patch(args.reviewNoteId, {
      acceptanceStatus: args.action,
      response: args.response,
    });
    return decisionId;
  },
});

export const listReviewNotes = query({
  args: { documentVersionId: v.id("documentVersions") },
  handler: async (ctx, { documentVersionId }) =>
    ctx.db
      .query("reviewNotes")
      .withIndex("by_document_version", (q) =>
        q.eq("documentVersionId", documentVersionId),
      )
      .collect(),
});
