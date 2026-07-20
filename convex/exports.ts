import { mutationGeneric as mutation } from "convex/server";
import { v } from "convex/values";

export const queueExport = mutation({
  args: {
    documentId: v.id("compiledDocuments"),
    format: v.string(),
    options: v.optional(v.any()),
  },
  handler: async (ctx, args) =>
    ctx.db.insert("exportJobs", {
      documentId: args.documentId,
      format: args.format,
      status: "queued",
      options: args.options,
      requestedAt: Date.now(),
    }),
});

export const completeExport = mutation({
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
    await ctx.db.patch(job.documentId, {
      exportStatus: "exported",
      updatedAt: Date.now(),
    });
    return fileId;
  },
});
