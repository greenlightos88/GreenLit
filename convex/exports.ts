import {
  internalMutationGeneric as internalMutation,
  mutationGeneric as mutation,
} from "convex/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import { assertProjectAccess } from "./identity";

/**
 * Export pipeline (ADR-0002 §10).
 *
 * `queueExport` is a creator action: it is owner-authorized against the project
 * that owns the compiled document. `completeExport` is a service-side completion
 * that records a generated file and marks the job succeeded; it carries a
 * storage id produced by server-side generation and is therefore an
 * internalMutation — not part of the public API surface, so no external caller
 * can forge an export completion.
 */

export const queueExport = mutation({
  args: {
    documentId: v.id("compiledDocuments"),
    format: v.string(),
    options: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("Compiled document not found.");
    await assertProjectAccess(ctx, document.sourceProject as GenericId<"projects">);
    return ctx.db.insert("exportJobs", {
      documentId: args.documentId,
      format: args.format,
      status: "queued",
      options: args.options,
      requestedAt: Date.now(),
    });
  },
});

export const completeExport = internalMutation({
  args: {
    exportJobId: v.id("exportJobs"),
    storageId: v.id("_storage"),
    filename: v.string(),
    mediaType: v.string(),
    byteLength: v.number(),
    checksum: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.exportJobId);
    if (!job) throw new Error("Export job not found.");
    const fileId = await ctx.db.insert("exportedFiles", {
      exportJobId: args.exportJobId,
      storageId: args.storageId,
      filename: args.filename,
      mediaType: args.mediaType,
      byteLength: args.byteLength,
      checksum: args.checksum,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.exportJobId, {
      status: "succeeded",
      completedAt: Date.now(),
    });
    await ctx.db.patch(job.documentId as GenericId<"compiledDocuments">, {
      exportStatus: "exported",
      updatedAt: Date.now(),
    });
    return fileId;
  },
});
