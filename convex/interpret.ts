import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import { assertProjectAccess } from "./identity";
import { deterministicInterpreter } from "./domain/interpret/deterministic";
import type { CanonContextItem } from "./domain/interpret/types";

/**
 * Interpretation run (Phase 4). Loads a preserved Fragment, supplies bounded
 * approved-Canon context, runs the configured Interpreter (via its interface —
 * persistence does not depend on the implementation), and persists the run plus
 * Candidate rows. Candidates are NEVER Canon: they are stored with status
 * "proposed" and carry origin, evidence, explanation, confidence, uncertainty.
 * There is no Canon write here — approval (Phase 6) is the only Canon path.
 */
export const runInterpretation = mutation({
  args: { fragmentId: v.id("fragments") },
  handler: async (ctx, { fragmentId }) => {
    const fragment = await ctx.db.get(fragmentId);
    if (!fragment) throw new Error("Fragment not found.");
    const projectId = fragment.projectId as GenericId<"projects">;
    const { user } = await assertProjectAccess(ctx, projectId);

    // Bounded context: existing approved canonical objects (names/kinds only).
    const objects = await ctx.db
      .query("projectObjects")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    const canonContext: CanonContextItem[] = objects
      .filter(
        (o) => o.truthStatus === "canonical" || o.truthStatus === "approved-interpretation",
      )
      .map((o) => ({
        objectKey: String(o.objectKey),
        kind: String(o.kind),
        name: String(o.name),
      }));

    const proposals = await deterministicInterpreter.interpret({
      fragmentId: String(fragmentId),
      fragmentText: String(fragment.text),
      projectId: String(projectId),
      canonContext,
    });

    const now = Date.now();
    const runId = await ctx.db.insert("interpretationRuns", {
      projectId,
      fragmentId,
      interpreterId: deterministicInterpreter.id,
      interpreterVersion: deterministicInterpreter.version,
      requestedByUserId: user._id,
      candidateCount: proposals.length,
      createdAt: now,
    });

    const candidateIds: GenericId<"candidates">[] = [];
    for (const p of proposals) {
      const id = await ctx.db.insert("candidates", {
        projectId,
        runId,
        fragmentId,
        candidateType: p.candidateType,
        proposedObject: p.proposedObject,
        explanation: p.explanation,
        evidence: [...p.evidence],
        origin: p.origin,
        confidence: p.confidence,
        uncertainty: [...p.uncertainty],
        status: "proposed",
        createdAt: now,
      });
      candidateIds.push(id);
    }
    return { runId, candidateCount: proposals.length, candidateIds };
  },
});

export const listCandidates = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await assertProjectAccess(ctx, projectId);
    return ctx.db
      .query("candidates")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
  },
});
