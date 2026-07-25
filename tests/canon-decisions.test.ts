import { describe, expect, test } from "bun:test";
import { anyApi } from "convex/server";
import type { FunctionReference } from "convex/server";
import type { GenericId } from "convex/values";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { buildCanonicalObject } from "../convex/domain/interpret/canonize";

const api = anyApi as unknown as {
  projects: { saveProjectSnapshot: FunctionReference<"mutation"> };
  fragments: { captureFragment: FunctionReference<"mutation"> };
  interpret: {
    runInterpretation: FunctionReference<"mutation">;
    listCandidates: FunctionReference<"query">;
  };
  canon: {
    decideCandidate: FunctionReference<"mutation">;
    listCanonObjects: FunctionReference<"query">;
    listCanonEvents: FunctionReference<"query">;
  };
};

const modules: Record<string, () => Promise<unknown>> = {
  "./_generated/api.js": () => Promise.resolve({}),
  "./projects.js": () => import("../convex/projects"),
  "./fragments.js": () => import("../convex/fragments"),
  "./interpret.js": () => import("../convex/interpret"),
  "./canon.js": () => import("../convex/canon"),
  "./identity.js": () => import("../convex/identity"),
};

function setup() {
  return convexTest(schema, modules);
}
type T = ReturnType<typeof setup>;
type Candidate = { _id: string; candidateType: string; status: string };

const TIDEWRACK =
  "A deaf lighthouse keeper on a drowning coast realizes the tide is ringing messages through the wreck-bells.";

async function interpreted(t: T, subject: string) {
  const as = t.withIdentity({ subject });
  const { projectId } = await as.mutation(api.projects.saveProjectSnapshot, { title: "P", meta: {}, objects: [] });
  const { fragmentId } = await as.mutation(api.fragments.captureFragment, {
    projectId,
    text: TIDEWRACK,
    sourceType: "premise",
  });
  await as.mutation(api.interpret.runInterpretation, { fragmentId });
  const candidates = (await as.query(api.interpret.listCandidates, { projectId })) as Candidate[];
  return { as, projectId, candidates };
}

const pick = (cs: Candidate[], type: string) => cs.find((c) => c.candidateType === type)!;
const canonCount = (t: T, projectId: string) =>
  t.run(async (ctx) =>
    (
      await ctx.db
        .query("projectObjects")
        .withIndex("by_project", (q) => q.eq("projectId", projectId as GenericId<"projects">))
        .collect()
    ).length,
  );

describe("Phase 6 — buildCanonicalObject (pure)", () => {
  test("maps candidate types to kinds and sets origin; edits take authorship", () => {
    const approved = buildCanonicalObject({
      candidateType: "character",
      proposedObject: { name: "Mara" },
      origin: "extracted",
    });
    expect(approved.kind).toBe("character");
    expect(approved.name).toBe("Mara");
    expect(approved.origin).toBe("source-quotation");
    expect(approved.truthStatus).toBe("canonical");

    const edited = buildCanonicalObject({
      candidateType: "character",
      proposedObject: { name: "Mara" },
      origin: "inferred",
      edits: { name: "Nara" },
    });
    expect(edited.name).toBe("Nara");
    expect(edited.origin).toBe("user"); // creator edited → authorship
  });
});

describe("Phase 5 & 6 — review transitions", () => {
  test("approve creates a versioned canonical object and a Canon Event", async () => {
    const t = setup();
    const { as, projectId, candidates } = await interpreted(t, "owner");
    const premise = pick(candidates, "premise");

    const res = (await as.mutation(api.canon.decideCandidate, {
      candidateId: premise._id,
      action: "approve",
    })) as { status: string; resultingObjectKey: string };
    expect(res.status).toBe("approved");
    expect(res.resultingObjectKey).toBeTruthy();

    expect(await canonCount(t, projectId)).toBe(1);
    const events = (await as.query(api.canon.listCanonEvents, { projectId })) as Array<{
      action: string;
      decidedByUserId: string;
      resultingObjectKey?: string;
    }>;
    expect(events).toHaveLength(1);
    expect(events[0]?.action).toBe("approve");
    expect(events[0]?.decidedByUserId).toBeTruthy();
    const objs = (await as.query(api.canon.listCanonObjects, { projectId })) as Array<{
      version: number;
      truthStatus: string;
    }>;
    expect(objs[0]?.version).toBe(1);
    expect(objs[0]?.truthStatus).toBe("canonical");
  });

  test("edit-approve applies edits and records edited-approved", async () => {
    const t = setup();
    const { as, projectId, candidates } = await interpreted(t, "owner");
    const character = pick(candidates, "character");
    const res = (await as.mutation(api.canon.decideCandidate, {
      candidateId: character._id,
      action: "edit-approve",
      edits: { name: "Nerin" },
    })) as { status: string };
    expect(res.status).toBe("edited-approved");
    const objs = (await as.query(api.canon.listCanonObjects, { projectId })) as Array<{
      name: string;
      origin: string;
    }>;
    expect(objs.map((o) => o.name)).toContain("Nerin");
    expect(objs[0]?.origin).toBe("user");
  });

  test("reject and defer never write Canon; defer can later be approved", async () => {
    const t = setup();
    const { as, projectId, candidates } = await interpreted(t, "owner");
    const theme = pick(candidates, "theme") ?? pick(candidates, "location");

    await as.mutation(api.canon.decideCandidate, { candidateId: theme._id, action: "reject" });
    expect(await canonCount(t, projectId)).toBe(0);

    const loc = candidates.find((c) => c.candidateType === "location" && c._id !== theme._id) ?? pick(candidates, "world-rule");
    await as.mutation(api.canon.decideCandidate, { candidateId: loc._id, action: "defer" });
    expect(await canonCount(t, projectId)).toBe(0);
    // A deferred candidate can still be approved.
    await as.mutation(api.canon.decideCandidate, { candidateId: loc._id, action: "approve" });
    expect(await canonCount(t, projectId)).toBe(1);
  });

  test("deciding an already-resolved candidate is rejected (idempotency)", async () => {
    const t = setup();
    const { as, candidates, projectId } = await interpreted(t, "owner");
    const premise = pick(candidates, "premise");
    await as.mutation(api.canon.decideCandidate, { candidateId: premise._id, action: "approve" });
    await expect(
      as.mutation(api.canon.decideCandidate, { candidateId: premise._id, action: "approve" }),
    ).rejects.toThrow(/already been decided/i);
    expect(await canonCount(t, projectId)).toBe(1); // no duplicate object
  });

  test("a non-owner cannot decide another owner's candidate", async () => {
    const t = setup();
    const { candidates } = await interpreted(t, "owner-a");
    const premise = pick(candidates, "premise");
    await t.withIdentity({ subject: "owner-b" }).mutation(api.projects.saveProjectSnapshot, { title: "B", meta: {}, objects: [] });
    await expect(
      t.withIdentity({ subject: "owner-b" }).mutation(api.canon.decideCandidate, {
        candidateId: premise._id,
        action: "approve",
      }),
    ).rejects.toThrow(/forbidden/i);
  });
});
