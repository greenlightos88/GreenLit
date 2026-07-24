import { mutationGeneric as mutation } from "convex/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import { assertProjectAccess } from "./identity";

export const persistQualityGateRun = mutation({
  args: {
    documentId: v.id("compiledDocuments"),
    results: v.array(
      v.object({
        gate: v.string(),
        status: v.string(),
        findings: v.array(v.string()),
      }),
    ),
    overrides: v.array(
      v.object({
        gate: v.string(),
        reason: v.string(),
        overriddenBy: v.string(),
        overriddenAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const overridden = new Set(args.overrides.map((override) => override.gate));
    const ready = args.results.every(
      (result) => result.status !== "fail" || overridden.has(result.gate),
    );
    const ranAt = Date.now();
    const gateRunId = await ctx.db.insert("qualityGateRuns", {
      documentId: args.documentId,
      status: ready ? "ready" : "blocked",
      overrides: args.overrides,
      ranAt,
    });
    for (const result of args.results) {
      await ctx.db.insert("qualityGateResults", { gateRunId, ...result });
    }
    await ctx.db.patch(args.documentId, {
      qualityGateStatus: ready ? "ready" : "blocked",
      approvalStatus: ready ? "awaiting-approval" : "draft",
      updatedAt: ranAt,
    });
    return { gateRunId, ready };
  },
});

export const approveCompiledDocument = mutation({
  args: {
    documentId: v.id("compiledDocuments"),
  },
  handler: async (ctx, { documentId }) => {
    const document = await ctx.db.get(documentId);
    if (!document) throw new Error("Compiled document not found.");
    // Authorize the caller against the document's source project: only that
    // project's owner may approve it. assertProjectAccess resolves the
    // authenticated human and checks ownership in one place, so an
    // internal/agent caller (no ctx.auth identity) and any non-owner are both
    // rejected. The approver is derived from identity, never supplied.
    const { user } = await assertProjectAccess(
      ctx,
      document.sourceProject as GenericId<"projects">,
    );
    if (document.qualityGateStatus !== "ready") {
      throw new Error("Quality gates must pass or be overridden before approval.");
    }
    // Single-shot: an already-approved (or delivered) document is not re-approved.
    if (document.approvalStatus === "approved" || document.approvalStatus === "delivered") {
      throw new Error("Document has already been approved.");
    }
    const now = Date.now();
    // Status and approver are written atomically in one patch.
    await ctx.db.patch(documentId, {
      approvalStatus: "approved",
      approvedByUserId: user._id,
      approvedAt: now,
      updatedAt: now,
    });
    return { documentId, approvedByUserId: user._id, approvedAt: now };
  },
});
