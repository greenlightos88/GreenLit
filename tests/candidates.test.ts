import { describe, expect, test } from "bun:test";
import { anyApi } from "convex/server";
import type { FunctionReference } from "convex/server";
import type { GenericId } from "convex/values";
import { convexTest } from "convex-test";
import schema from "../convex/schema";

/** Phase 4 — Candidate persistence & interpretation runs. */
const api = anyApi as unknown as {
  projects: { saveProjectSnapshot: FunctionReference<"mutation"> };
  fragments: { captureFragment: FunctionReference<"mutation"> };
  interpret: {
    runInterpretation: FunctionReference<"mutation">;
    listCandidates: FunctionReference<"query">;
  };
};

const modules: Record<string, () => Promise<unknown>> = {
  "./_generated/api.js": () => Promise.resolve({}),
  "./projects.js": () => import("../convex/projects"),
  "./fragments.js": () => import("../convex/fragments"),
  "./interpret.js": () => import("../convex/interpret"),
  "./identity.js": () => import("../convex/identity"),
};

function setup() {
  return convexTest(schema, modules);
}
type T = ReturnType<typeof setup>;

const TIDEWRACK =
  "A deaf lighthouse keeper on a drowning coast realizes the tide is ringing messages through the wreck-bells.";

async function ownerWithFragment(t: T, subject: string) {
  const as = t.withIdentity({ subject });
  const { projectId } = await as.mutation(api.projects.saveProjectSnapshot, {
    title: "P",
    meta: {},
    objects: [],
  });
  const { fragmentId } = await as.mutation(api.fragments.captureFragment, {
    projectId,
    text: TIDEWRACK,
    sourceType: "premise",
  });
  return { as, projectId, fragmentId };
}

describe("Phase 4 — interpretation produces persisted candidates", () => {
  test("persists candidates with full explainability and status 'proposed'", async () => {
    const t = setup();
    const { as, projectId, fragmentId } = await ownerWithFragment(t, "owner");

    const { candidateCount } = await as.mutation(api.interpret.runInterpretation, { fragmentId });
    expect(candidateCount).toBeGreaterThan(0);

    const candidates = (await as.query(api.interpret.listCandidates, { projectId })) as Array<{
      candidateType: string;
      explanation: string;
      evidence: unknown[];
      origin: string;
      confidence: number;
      uncertainty: unknown[];
      status: string;
    }>;
    expect(candidates.length).toBe(candidateCount);
    for (const c of candidates) {
      expect(c.status).toBe("proposed");
      expect(c.explanation.length).toBeGreaterThan(0);
      expect(c.evidence.length).toBeGreaterThan(0);
      expect(["extracted", "inferred", "generated"]).toContain(c.origin);
      expect(c.confidence).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(c.uncertainty)).toBe(true);
    }
    expect(candidates.map((c) => c.candidateType)).toContain("premise");

    // The run is attributable.
    const run = await t.run(async (ctx) =>
      ctx.db.query("interpretationRuns").withIndex("by_fragment", (q) =>
        q.eq("fragmentId", fragmentId as GenericId<"fragments">),
      ).unique(),
    );
    expect(run?.requestedByUserId).toBeTruthy();
    expect(run?.interpreterId).toBe("deterministic");
  });

  test("writes NO Canon — projectObjects remain empty after interpretation", async () => {
    const t = setup();
    const { as, projectId, fragmentId } = await ownerWithFragment(t, "owner");
    await as.mutation(api.interpret.runInterpretation, { fragmentId });

    const canonCount = await t.run(async (ctx) =>
      (
        await ctx.db
          .query("projectObjects")
          .withIndex("by_project", (q) => q.eq("projectId", projectId as GenericId<"projects">))
          .collect()
      ).length,
    );
    expect(canonCount).toBe(0);
  });

  test("a non-owner cannot interpret another owner's fragment", async () => {
    const t = setup();
    const { fragmentId } = await ownerWithFragment(t, "owner-a");
    // provision owner-b
    await t
      .withIdentity({ subject: "owner-b" })
      .mutation(api.projects.saveProjectSnapshot, { title: "B", meta: {}, objects: [] });
    await expect(
      t.withIdentity({ subject: "owner-b" }).mutation(api.interpret.runInterpretation, { fragmentId }),
    ).rejects.toThrow(/forbidden/i);
    await expect(
      t.mutation(api.interpret.runInterpretation, { fragmentId }),
    ).rejects.toThrow(/authenticated/i);
  });
});
