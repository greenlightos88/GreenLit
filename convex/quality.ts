import { mutationGeneric as mutation } from "convex/server";
import { v } from "convex/values";

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
    approvedBy: v.string(),
  },
  handler: async (ctx, { documentId, approvedBy }) => {
    const document = await ctx.db.get(documentId);
    if (!document) throw new Error("Compiled document not found.");
    if (document.qualityGateStatus !== "ready") {
      throw new Error("Quality gates must pass or be overridden before approval.");
    }
    const now = Date.now();
    await ctx.db.patch(documentId, { approvalStatus: "approved", updatedAt: now });
    return { documentId, approvedBy, approvedAt: now };
  },
});
