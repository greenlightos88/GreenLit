import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";

const sectionInput = v.object({
  sectionKey: v.string(),
  sectionType: v.string(),
  title: v.string(),
  order: v.number(),
  structuredData: v.optional(v.any()),
  generatedProse: v.array(v.any()),
  validationStatus: v.string(),
  staleStatus: v.string(),
  sources: v.array(
    v.object({
      sourceObjectKey: v.string(),
      sourceVersion: v.number(),
      sourceField: v.optional(v.string()),
      origin: v.string(),
      inference: v.boolean(),
    }),
  ),
});

/** Persist a compiler run and all structured sections as one mutation. */
export const persistCompilation = mutation({
  args: {
    projectId: v.id("projects"),
    projectVersion: v.number(),
    snapshotId: v.id("canonSnapshots"),
    profileKey: v.string(),
    title: v.string(),
    intendedAudience: v.string(),
    confidentiality: v.string(),
    compilerVersion: v.string(),
    requestedBy: v.string(),
    sections: v.array(sectionInput),
    warnings: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const runId = await ctx.db.insert("compilationRuns", {
      projectId: args.projectId,
      snapshotId: args.snapshotId,
      profileKey: args.profileKey,
      compilerVersion: args.compilerVersion,
      status: "running",
      requestedBy: args.requestedBy,
      startedAt: now,
    });

    const sourceObjects = [
      ...new Set(
        args.sections.flatMap((section) =>
          section.sources.map((source) => source.sourceObjectKey),
        ),
      ),
    ];
    const documentId = await ctx.db.insert("compiledDocuments", {
      sourceProject: args.projectId,
      projectVersion: args.projectVersion,
      canonSnapshot: args.snapshotId,
      intendedAudience: args.intendedAudience,
      compilationProfile: args.profileKey,
      compilerVersion: args.compilerVersion,
      sourceObjects,
      title: args.title,
      confidentiality: args.confidentiality,
      qualityGateStatus: "pending",
      approvalStatus: "draft",
      exportStatus: "not-exported",
      deliveryStatus: "not-delivered",
      createdAt: now,
      updatedAt: now,
    });

    for (const section of args.sections) {
      const sectionId = await ctx.db.insert("compiledDocumentSections", {
        documentId,
        sectionKey: section.sectionKey,
        sectionType: section.sectionType,
        title: section.title,
        order: section.order,
        structuredData: section.structuredData,
        generatedProse: section.generatedProse,
        validationStatus: section.validationStatus,
        staleStatus: section.staleStatus as
          | "current"
          | "potentially-stale"
          | "stale"
          | "conflicted"
          | "missing-required"
          | "awaiting-approval",
        lastCompiledAt: now,
      });
      for (const source of section.sources) {
        await ctx.db.insert("sectionSources", { sectionId, ...source });
        await ctx.db.insert("documentDependencies", {
          documentId,
          sectionId,
          sourceObjectKey: source.sourceObjectKey,
          sourceVersion: source.sourceVersion,
          dependencyType: source.sourceField ? "field" : "object",
        });
      }
    }

    for (const warning of args.warnings) {
      await ctx.db.insert("compilationWarnings", {
        runId,
        documentId,
        sectionKey: warning.sectionKey,
        code: warning.code ?? "compiler-warning",
        severity: warning.severity ?? "warning",
        issue: warning.issue ?? String(warning),
        consequence: warning.consequence ?? "Requires review before delivery.",
        proposedFix: warning.proposedFix,
        affectedDocuments: warning.affectedDocuments ?? [],
        approvalRequired: warning.approvalRequired ?? false,
      });
    }

    await ctx.db.patch(runId, {
      documentId,
      status: "succeeded",
      completedAt: Date.now(),
    });
    await ctx.db.insert("compilationEvents", {
      runId,
      type: "compilation-completed",
      message: `Compiled ${args.title}`,
      data: { documentId, sectionCount: args.sections.length },
      createdAt: Date.now(),
    });
    return { runId, documentId };
  },
});

export const getCompiledDocument = query({
  args: { documentId: v.id("compiledDocuments") },
  handler: async (ctx, { documentId }) => {
    const document = await ctx.db.get(documentId);
    if (!document) return null;
    const sections = await ctx.db
      .query("compiledDocumentSections")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .collect();
    return { document, sections };
  },
});

/** Freeze the approved artifact before placing it in a Delivery Room. */
export const createDeliveryRoom = mutation({
  args: {
    projectId: v.id("projects"),
    documentId: v.id("compiledDocuments"),
    frozenDocument: v.any(),
    snapshotId: v.id("canonSnapshots"),
    label: v.string(),
    roomName: v.string(),
    recipientName: v.string(),
    recipientEmail: v.optional(v.string()),
    commentPermission: v.boolean(),
    downloadPermission: v.boolean(),
    confidentialityNotice: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("Compiled document not found.");
    if (document.approvalStatus !== "approved") {
      throw new Error("Only approved documents can be delivered.");
    }
    const existing = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();
    const version = existing.reduce((max, item) => Math.max(max, item.version), 0) + 1;
    const now = Date.now();
    const documentVersionId = await ctx.db.insert("documentVersions", {
      documentId: args.documentId,
      version,
      snapshotId: args.snapshotId,
      frozenDocument: args.frozenDocument,
      label: args.label,
      delivered: true,
      createdAt: now,
    });
    const roomId = await ctx.db.insert("deliveryRooms", {
      projectId: args.projectId,
      name: args.roomName,
      visibleVersion: version,
      accessLevel: args.commentPermission ? "comment-enabled" : "read-only",
      downloadPermission: args.downloadPermission,
      commentPermission: args.commentPermission,
      confidentialityNotice: args.confidentialityNotice,
      createdAt: now,
    });
    await ctx.db.insert("deliveryRoomRecipients", {
      roomId,
      name: args.recipientName,
      email: args.recipientEmail,
      accessLevel: args.commentPermission ? "comment-enabled" : "read-only",
    });
    await ctx.db.insert("deliveryRoomDocuments", {
      roomId,
      documentVersionId,
      order: 0,
    });
    await ctx.db.patch(args.documentId, {
      approvalStatus: "delivered",
      deliveryStatus: "delivered",
      updatedAt: now,
    });
    return { roomId, documentVersionId, version };
  },
});
