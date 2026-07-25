import { describe, expect, test } from "bun:test";
import { anyApi } from "convex/server";
import type { FunctionReference } from "convex/server";
import { convexTest } from "convex-test";
import schema from "../convex/schema";

/**
 * Phase 1 — Fragment persistence & provenance (Implementation Milestone 1).
 * Drives the real Convex functions with convex-test; identity via withIdentity().
 */
const api = anyApi as unknown as {
  projects: { saveProjectSnapshot: FunctionReference<"mutation"> };
  fragments: {
    captureFragment: FunctionReference<"mutation">;
    listFragments: FunctionReference<"query">;
  };
};

const modules: Record<string, () => Promise<unknown>> = {
  "./_generated/api.js": () => Promise.resolve({}),
  "./projects.js": () => import("../convex/projects"),
  "./fragments.js": () => import("../convex/fragments"),
  "./identity.js": () => import("../convex/identity"),
};

function setup() {
  return convexTest(schema, modules);
}
type T = ReturnType<typeof setup>;

const project = (title: string) => ({ title, meta: {}, objects: [] });

async function newProject(t: T, subject: string) {
  const as = t.withIdentity({ subject });
  const { projectId } = await as.mutation(api.projects.saveProjectSnapshot, project("P"));
  return { as, projectId };
}

describe("Phase 1 — fragment capture", () => {
  test("preserves the exact source text, attribution, and immutable version", async () => {
    const t = setup();
    const { as, projectId } = await newProject(t, "owner");
    const source = "  A deaf lighthouse keeper.\nThe tide RINGS the wreck-bells.\t";

    const { fragmentId, sourceVersion } = await as.mutation(api.fragments.captureFragment, {
      projectId,
      text: source,
      sourceType: "premise",
    });
    expect(sourceVersion).toBe(1);

    const list = await as.query(api.fragments.listFragments, { projectId });
    expect(list).toHaveLength(1);
    const stored = list[0] as { text: string; sourceVersion: number; createdByUserId: string };
    // Exact text preserved verbatim (whitespace, newlines, tabs, case).
    expect(stored.text).toBe(source);
    expect(stored.sourceVersion).toBe(1);
    const user = await t.run(async (ctx) =>
      ctx.db.query("users").withIndex("by_subject", (q) => q.eq("subject", "owner")).unique(),
    );
    expect(stored.createdByUserId).toBe(String(user?._id));
    expect(String(fragmentId)).toBeTruthy();
  });

  test("unauthenticated capture is rejected", async () => {
    const t = setup();
    const { projectId } = await newProject(t, "owner");
    await expect(
      t.mutation(api.fragments.captureFragment, { projectId, text: "x", sourceType: "note" }),
    ).rejects.toThrow(/authenticated/i);
  });

  test("a non-owner cannot capture into or read another owner's project", async () => {
    const t = setup();
    const { projectId } = await newProject(t, "owner-a");
    // owner-b is provisioned (owns their own project) but not project A.
    await newProject(t, "owner-b");
    const asB = t.withIdentity({ subject: "owner-b" });
    await expect(
      asB.mutation(api.fragments.captureFragment, { projectId, text: "x", sourceType: "note" }),
    ).rejects.toThrow(/forbidden/i);
    await expect(asB.query(api.fragments.listFragments, { projectId })).rejects.toThrow(/forbidden/i);
  });
});
