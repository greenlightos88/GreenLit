import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import { assertProjectAccess } from "./identity";

/**
 * Delivery-room review notes (ADR-0002 §10).
 *
 * Every function here is owner-authorized against the project that owns the
 * document version the note targets. The ownership chain is:
 *   reviewNote → documentVersion → compiledDocument → project (owner).
 * Authorship of a creator decision (`decidedBy`) is derived from the
 * authenticated identity, never accepted from the client.
 *
 * Note on external recipients: a review note's `author`/`source` are descriptive
 * content — the external reviewer being transcribed — not an authorization
 * identity. Today only the owning creator may read or write these notes. A
 * future external-recipient portal (recipients are NOT `users`, ADR-0002) would
 * add a separate room-scoped access path; that recipient-authorization model is
 * a distinct, unapproved design decision and is intentionally not built here.
 */

/** Resolve the project that owns a document version and authorize the caller. */
async function assertDocumentVersionAccess(
  ctx: Parameters<typeof assertProjectAccess>[0],
  documentVersionId: GenericId<"documentVersions">,
) {
  const documentVersion = await ctx.db.get(documentVersionId);
  if (!documentVersion) throw new Error("Document version not found.");
  const document = await ctx.db.get(
    documentVersion.documentId as GenericId<"compiledDocuments">,
  );
  if (!document) throw new Error("Compiled document not found.");
  const access = await assertProjectAccess(
    ctx,
    document.sourceProject as GenericId<"projects">,
  );
  return { ...access, documentVersion, document };
}

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
    const { project } = await assertDocumentVersionAccess(ctx, args.documentVersionId);
    // If a room is supplied it must belong to the same authorized project, so a
    // note can never be cross-linked into another project's room.
    if (args.roomId !== undefined) {
      const room = await ctx.db.get(args.roomId);
      if (!room || room.projectId !== project._id) {
        throw new Error("Delivery room does not belong to this project.");
      }
    }
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
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.reviewNoteId);
    if (!note) throw new Error("Review note not found.");
    // Authorize against the owning project; derive the decider from identity.
    const { user } = await assertDocumentVersionAccess(
      ctx,
      note.documentVersionId as GenericId<"documentVersions">,
    );
    const decidedAt = Date.now();
    const decisionId = await ctx.db.insert("reviewDecisions", {
      reviewNoteId: args.reviewNoteId,
      action: args.action,
      response: args.response,
      resultingDecisionKey: args.resultingDecisionKey,
      resultingArtifactVersion: args.resultingArtifactVersion,
      decidedBy: String(user._id),
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
  handler: async (ctx, { documentVersionId }) => {
    await assertDocumentVersionAccess(ctx, documentVersionId);
    return ctx.db
      .query("reviewNotes")
      .withIndex("by_document_version", (q) =>
        q.eq("documentVersionId", documentVersionId),
      )
      .collect();
  },
});
