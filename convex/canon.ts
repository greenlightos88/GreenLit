import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import { assertProjectAccess } from "./identity";
import { buildCanonicalObject } from "./domain/interpret/canonize";
import type { CandidateOrigin, CandidateType } from "./domain/interpret/types";

/**
 * Creator review decision (Phases 5 & 6). The ONLY path from Candidate to Canon.
 *
 * Records an immutable, attributable Canon Event for every decision
 * (approve / edit-approve / reject / defer). Approvals additionally create a new
 * versioned canonical projectObject with provenance back to the candidate and
 * fragment. Reject/defer are auditable but never touch Canon. A candidate can
 * only be decided from an open state (proposed/deferred) — deciding an already
 * resolved candidate is rejected (idempotency).
 */
export const decideCandidate = mutation({
  args: {
    candidateId: v.id("candidates"),
    action: v.union(
      v.literal("approve"),
      v.literal("edit-approve"),
      v.literal("reject"),
      v.literal("defer"),
    ),
    edits: v.optional(v.any()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("Candidate not found.");
    const projectId = candidate.projectId as GenericId<"projects">;
    const { user } = await assertProjectAccess(ctx, projectId);

    const status = String(candidate.status);
    if (status !== "proposed" && status !== "deferred") {
      throw new Error("Candidate has already been decided.");
    }
    if (args.action === "edit-approve" && args.edits === undefined) {
      throw new Error("edit-approve requires edits.");
    }

    const now = Date.now();
    const canonizing = args.action === "approve" || args.action === "edit-approve";
    let resultingObjectKey: string | undefined;

    if (canonizing) {
      const draft = buildCanonicalObject({
        candidateType: candidate.candidateType as CandidateType,
        proposedObject: (candidate.proposedObject ?? {}) as Record<string, unknown>,
        origin: candidate.origin as CandidateOrigin,
        edits: args.action === "edit-approve" ? (args.edits as Record<string, unknown>) : undefined,
      });
      resultingObjectKey = `${draft.kind}-${String(args.candidateId)}`;
      await ctx.db.insert("projectObjects", {
        projectId,
        objectKey: resultingObjectKey,
        kind: draft.kind,
        name: draft.name,
        version: 1,
        truthStatus: draft.truthStatus,
        origin: draft.origin,
        data: {
          ...draft.data,
          __provenance: {
            candidateId: String(args.candidateId),
            fragmentId: String(candidate.fragmentId),
            evidence: candidate.evidence,
            interpreterOrigin: candidate.origin,
            isMeta: draft.isMeta,
          },
        },
        sourceObjectKeys: [String(candidate.fragmentId)],
        confidential: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    const canonEventId = await ctx.db.insert("canonEvents", {
      projectId,
      candidateId: args.candidateId,
      action: args.action,
      decidedByUserId: user._id,
      decidedAt: now,
      ...(args.note !== undefined ? { note: args.note } : {}),
      ...(resultingObjectKey !== undefined
        ? { resultingObjectKey, resultingObjectVersion: 1 }
        : {}),
    });

    const newStatus =
      args.action === "approve"
        ? "approved"
        : args.action === "edit-approve"
          ? "edited-approved"
          : args.action === "reject"
            ? "rejected"
            : "deferred";
    await ctx.db.patch(args.candidateId, {
      status: newStatus,
      reviewedByUserId: user._id,
      reviewedAt: now,
      canonEventId,
    });

    return { canonEventId, status: newStatus, resultingObjectKey };
  },
});

export const listCanonObjects = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await assertProjectAccess(ctx, projectId);
    return ctx.db
      .query("projectObjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
  },
});

export const listCanonEvents = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await assertProjectAccess(ctx, projectId);
    return ctx.db
      .query("canonEvents")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
  },
});
