import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import type { GenericDataModel, GenericQueryCtx } from "convex/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import { assertProjectAccess } from "./identity";
import { compileDocument } from "./domain/compiler/compose";
import { isReadyToDeliver, runQualityGates } from "./domain/compiler/gates";
import { getProfile } from "./domain/compiler/profiles";
import { COMPILER_VERSION } from "./domain/compiler/types";
import type { CompiledSection } from "./domain/compiler/types";
import type { CanonSnapshot } from "./domain/graph/types";

type QueryCtx = GenericQueryCtx<GenericDataModel>;

/** Loosely-typed row shapes for the generic-ctx retrieval helpers. */
type CompiledDocRow = {
  _id: GenericId<"compiledDocuments">;
  sourceProject: GenericId<"projects">;
  canonSnapshot: GenericId<"canonSnapshots">;
  [key: string]: unknown;
};

/**
 * Authoritative compilation pipeline (Milestone 1.1).
 *
 * Finalized artifacts are produced ONLY here: the server loads the exact
 * immutable Canon Snapshot, runs the existing pure compiler and quality gates,
 * and persists the run, document, sections, section sources, dependencies,
 * warnings, and gate results through a single owner-authorized path. The client
 * never supplies compiled content or the requesting identity; `requestedBy` is
 * derived from `ctx.auth`. Each compile appends a NEW compiled document — it
 * never rewrites a delivered document or a frozen `documentVersion`.
 */

/**
 * Derive persisted section sources from block-level provenance. Origin and
 * inference live on each ContentBlock; the object reference lives on its
 * SourceRef. `section.sources` is exactly the deduped union of block sources
 * (see builders.ts), so iterating blocks captures every citation while
 * preserving the origin/inference the flattened section list drops.
 */
function sectionSourceRows(section: CompiledSection) {
  const seen = new Map<
    string,
    {
      sourceObjectKey: string;
      sourceVersion: number;
      sourceField?: string;
      origin: string;
      inference: boolean;
    }
  >();
  for (const block of section.blocks) {
    for (const source of block.sources) {
      const inference = block.inference ?? false;
      const key = `${source.objectId}|${source.objectVersion}|${source.field ?? ""}|${block.origin}|${inference ? 1 : 0}`;
      if (!seen.has(key)) {
        seen.set(key, {
          sourceObjectKey: source.objectId,
          sourceVersion: source.objectVersion,
          ...(source.field !== undefined ? { sourceField: source.field } : {}),
          origin: block.origin,
          inference,
        });
      }
    }
  }
  return [...seen.values()];
}

export const compileSnapshot = mutation({
  args: {
    snapshotId: v.id("canonSnapshots"),
    profileKey: v.string(),
  },
  handler: async (ctx, { snapshotId, profileKey }) => {
    // 1. Load the exact immutable snapshot and authorize the caller against its
    //    owning project. Identity and authorization are established here — never
    //    trusted from the client.
    const snapRow = await ctx.db.get(snapshotId);
    if (!snapRow) throw new Error("Canon snapshot not found.");
    const projectId = snapRow.projectId as GenericId<"projects">;
    const { user } = await assertProjectAccess(ctx, projectId);

    // 2. Resolve the profile from the server-owned registry; a client cannot
    //    inject an arbitrary document shape.
    const profile = getProfile(profileKey);
    if (!profile) throw new Error(`Unknown compilation profile: ${profileKey}`);

    const now = Date.now();
    // Open the run before compiling so it anchors the artifact's provenance.
    // requestedBy is the authenticated user's stable id, not a caller string.
    const runId = await ctx.db.insert("compilationRuns", {
      projectId,
      snapshotId,
      profileKey: profile.id,
      compilerVersion: COMPILER_VERSION,
      status: "running",
      requestedBy: String(user._id),
      startedAt: now,
    });

    // Reconstruct the immutable snapshot shape the pure compiler consumes. The
    // compiler reads frozen snapshot state only — never live project objects.
    const snapshot = {
      id: String(snapRow._id),
      projectId: String(snapRow.projectId),
      projectVersion: snapRow.projectVersion,
      meta: snapRow.meta,
      objects: snapRow.objects,
      createdAt: snapRow.createdAt,
    } as unknown as CanonSnapshot;

    // 3. Run the EXISTING pure compiler and quality gates. No compiler logic is
    //    duplicated here — this is the authoritative execution of that logic.
    const compiled = compileDocument(snapshot, profile, { now });
    const gateRun = runQualityGates(compiled, snapshot, undefined, now);
    const ready = isReadyToDeliver(gateRun);

    // 4. Persist a NEW compiled document. Every explicit compile is a fresh,
    //    traceable version: this only ever inserts, so a delivered document or a
    //    frozen documentVersion is never rewritten.
    const perSectionSources = compiled.sections.map((section) => ({
      section,
      sources: sectionSourceRows(section),
    }));
    const sourceObjects = [
      ...new Set(
        perSectionSources.flatMap(({ sources }) => sources.map((s) => s.sourceObjectKey)),
      ),
    ];

    const documentId = await ctx.db.insert("compiledDocuments", {
      sourceProject: projectId,
      projectVersion: Number(snapRow.projectVersion),
      canonSnapshot: snapshotId,
      intendedAudience: compiled.context.audience,
      compilationProfile: profile.id,
      compilerVersion: compiled.compilerVersion,
      sourceObjects,
      title: compiled.title,
      confidentiality: compiled.context.confidentiality,
      qualityGateStatus: ready ? "ready" : "blocked",
      approvalStatus: ready ? "awaiting-approval" : "draft",
      exportStatus: "not-exported",
      deliveryStatus: "not-delivered",
      createdAt: now,
      updatedAt: now,
    });

    for (let index = 0; index < perSectionSources.length; index += 1) {
      const { section, sources } = perSectionSources[index]!;
      const sectionId = await ctx.db.insert("compiledDocumentSections", {
        documentId,
        sectionKey: section.id,
        sectionType: section.sectionType,
        title: section.title,
        order: index,
        ...(section.structured !== undefined ? { structuredData: section.structured } : {}),
        generatedProse: section.blocks,
        validationStatus: section.missing.length > 0 ? "incomplete" : "valid",
        staleStatus: section.staleStatus,
        lastCompiledAt: now,
      });
      for (const source of sources) {
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

    // 5. Persist compiler warnings (visible gaps) durably against run+document.
    for (const missingSection of compiled.missingSections) {
      await ctx.db.insert("compilationWarnings", {
        runId,
        documentId,
        code: "missing-required-section",
        severity: "error",
        issue: `Required section missing: ${missingSection}`,
        consequence: "Document is incomplete and not ready for delivery.",
        affectedDocuments: [],
        approvalRequired: true,
      });
    }
    for (const section of compiled.sections) {
      for (const missing of section.missing) {
        await ctx.db.insert("compilationWarnings", {
          runId,
          documentId,
          sectionKey: section.id,
          code: "missing-information",
          severity: "warning",
          issue: `Missing information in "${section.title}": ${missing}`,
          consequence: "Section has a visible gap requiring creator input.",
          affectedDocuments: [],
          approvalRequired: false,
        });
      }
    }

    // 6. Persist the quality-gate run and each gate result.
    const gateRunId = await ctx.db.insert("qualityGateRuns", {
      documentId,
      status: ready ? "ready" : "blocked",
      overrides: [],
      ranAt: now,
    });
    for (const result of gateRun.results) {
      await ctx.db.insert("qualityGateResults", {
        gateRunId,
        gate: result.gate,
        status: result.status,
        findings: result.findings,
      });
    }

    // 7. Close the run as succeeded and record a completion event.
    const completedAt = Date.now();
    await ctx.db.patch(runId, { documentId, status: "succeeded", completedAt });
    await ctx.db.insert("compilationEvents", {
      runId,
      type: "compilation-completed",
      message: `Compiled ${compiled.title}`,
      data: { documentId, sectionCount: compiled.sections.length, ready },
      createdAt: completedAt,
    });

    return { runId, documentId, gateRunId, ready };
  },
});

/**
 * Assemble the full durable artifact for retrieval: the document row, ordered
 * sections with their persisted sources, warnings, the compilation run metadata,
 * the quality-gate run with results, and the snapshot identity it was compiled
 * from. Callers must authorize before invoking this.
 */
async function assembleDocument(ctx: QueryCtx, document: CompiledDocRow) {
  const documentId = document._id;
  const sectionRows = await ctx.db
    .query("compiledDocumentSections")
    .withIndex("by_document", (q) => q.eq("documentId", documentId))
    .collect();
  const sections = [];
  for (const section of sectionRows) {
    const sources = await ctx.db
      .query("sectionSources")
      .withIndex("by_section", (q) =>
        q.eq("sectionId", section._id as GenericId<"compiledDocumentSections">),
      )
      .collect();
    sections.push({ ...section, sources });
  }

  // The run that produced this document (compilationRuns is indexed by project).
  const runs = await ctx.db
    .query("compilationRuns")
    .withIndex("by_project", (q) => q.eq("projectId", document.sourceProject))
    .collect();
  const run =
    runs
      .filter((r) => r.documentId === documentId)
      .sort((a, b) => Number(b.startedAt) - Number(a.startedAt))[0] ?? null;
  const warnings = run
    ? await ctx.db
        .query("compilationWarnings")
        .withIndex("by_run", (q) => q.eq("runId", run._id as GenericId<"compilationRuns">))
        .collect()
    : [];

  const gateRun = await ctx.db
    .query("qualityGateRuns")
    .withIndex("by_document", (q) => q.eq("documentId", documentId))
    .order("desc")
    .first();
  const gateResults = gateRun
    ? await ctx.db
        .query("qualityGateResults")
        .withIndex("by_run", (q) =>
          q.eq("gateRunId", gateRun._id as GenericId<"qualityGateRuns">),
        )
        .collect()
    : [];

  const snapshot = await ctx.db.get(document.canonSnapshot);

  return {
    document,
    sections,
    warnings,
    run,
    gateRun: gateRun ? { ...gateRun, results: gateResults } : null,
    snapshot: snapshot
      ? {
          id: snapshot._id,
          projectId: snapshot.projectId,
          projectVersion: snapshot.projectVersion,
          label: snapshot.label,
          createdAt: snapshot.createdAt,
        }
      : null,
  };
}

/** Durable retrieval of a compiled document by id, owner-authorized. */
export const getCompiledDocument = query({
  args: { documentId: v.id("compiledDocuments") },
  handler: async (ctx, { documentId }) => {
    const document = await ctx.db.get(documentId);
    if (!document) return null;
    await assertProjectAccess(ctx, document.sourceProject as GenericId<"projects">);
    return assembleDocument(ctx, document as unknown as CompiledDocRow);
  },
});

/** The latest compiled document for a project, owner-authorized. */
export const getLatestCompilation = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await assertProjectAccess(ctx, projectId);
    const latest = await ctx.db
      .query("compiledDocuments")
      .withIndex("by_project", (q) => q.eq("sourceProject", projectId))
      .order("desc")
      .first();
    if (!latest) return null;
    return assembleDocument(ctx, latest as unknown as CompiledDocRow);
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
    // Only the owning creator may deliver, and only their own document.
    await assertProjectAccess(ctx, args.projectId);
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("Compiled document not found.");
    if (document.sourceProject !== args.projectId) {
      throw new Error("Document does not belong to this project.");
    }
    if (document.approvalStatus !== "approved") {
      throw new Error("Only approved documents can be delivered.");
    }
    const snapshot = await ctx.db.get(args.snapshotId);
    if (!snapshot || snapshot.projectId !== args.projectId) {
      throw new Error("Snapshot does not belong to this project.");
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
