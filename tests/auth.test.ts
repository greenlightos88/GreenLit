import { describe, expect, test } from "bun:test";
import { anyApi } from "convex/server";
import type { FunctionReference } from "convex/server";
import { convexTest } from "convex-test";
import schema from "../convex/schema";

// Typed facade over the untyped anyApi (no codegen in this repo). Casting to
// concrete FunctionReferences keeps the calls type-checked without `any`.
const api = anyApi as unknown as {
  projects: {
    saveProjectSnapshot: FunctionReference<"mutation">;
    listProjects: FunctionReference<"query">;
    getLatestSnapshot: FunctionReference<"query">;
  };
  quality: {
    approveCompiledDocument: FunctionReference<"mutation">;
  };
};

/**
 * PR-1 identity/authorization tests (ADR-0002 §10.5), driven through the real
 * Convex functions with convex-test. Clerk identity is simulated via
 * withIdentity(); authorization is enforced by the functions themselves.
 *
 * Bun has no import.meta.glob, so the module map is provided explicitly. A stub
 * "_generated" key lets convex-test compute its module root; our functions use
 * the generic builders and never import _generated, so the stub is never loaded.
 */
const modules: Record<string, () => Promise<unknown>> = {
  "./_generated/api.js": () => Promise.resolve({}),
  "./projects.js": () => import("../convex/projects"),
  "./quality.js": () => import("../convex/quality"),
  "./identity.js": () => import("../convex/identity"),
  "./reviews.js": () => import("../convex/reviews"),
  "./exports.js": () => import("../convex/exports"),
  "./compilerPersistence.js": () => import("../convex/compilerPersistence"),
};

function setup() {
  return convexTest(schema, modules);
}

const project = (title: string) => ({ title, meta: {}, objects: [] });

describe("PR-1 identity and project authorization", () => {
  test("unauthenticated calls are rejected", async () => {
    const t = setup();
    await expect(t.mutation(api.projects.saveProjectSnapshot, project("P"))).rejects.toThrow(
      /authenticated/i,
    );
    await expect(t.query(api.projects.listProjects, {})).rejects.toThrow(/authenticated/i);
  });

  test("an owner sees only their own projects", async () => {
    const t = setup();
    const asA = t.withIdentity({ subject: "user-a" });
    const asB = t.withIdentity({ subject: "user-b" });

    await asA.mutation(api.projects.saveProjectSnapshot, project("A-one"));
    await asA.mutation(api.projects.saveProjectSnapshot, project("A-two"));
    await asB.mutation(api.projects.saveProjectSnapshot, project("B-one"));

    const aList = await asA.query(api.projects.listProjects, {});
    const bList = await asB.query(api.projects.listProjects, {});
    expect(aList.map((p: { title: string }) => p.title).sort()).toEqual(["A-one", "A-two"]);
    expect(bList.map((p: { title: string }) => p.title)).toEqual(["B-one"]);
  });

  test("cross-project access is forbidden", async () => {
    const t = setup();
    const asA = t.withIdentity({ subject: "user-a" });
    const asB = t.withIdentity({ subject: "user-b" });
    const { projectId } = await asA.mutation(
      api.projects.saveProjectSnapshot,
      project("A-secret"),
    );
    // B must be provisioned (has their own project) yet still be denied A's.
    await asB.mutation(api.projects.saveProjectSnapshot, project("B-own"));
    await expect(asB.query(api.projects.getLatestSnapshot, { projectId })).rejects.toThrow(
      /forbidden/i,
    );
    // Owner still reaches it.
    expect(await asA.query(api.projects.getLatestSnapshot, { projectId })).not.toBeNull();
  });

  test("an ownerless project is inaccessible (no silent ownership)", async () => {
    const t = setup();
    const projectId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("projects", {
        title: "Orphan",
        currentVersion: 1,
        createdAt: 0,
        updatedAt: 0,
      });
      await ctx.db.insert("users", { subject: "user-a", createdAt: 0 });
      return id;
    });
    const asA = t.withIdentity({ subject: "user-a" });
    await expect(asA.query(api.projects.getLatestSnapshot, { projectId })).rejects.toThrow(
      /forbidden/i,
    );
  });

  test("approval is single-shot: re-approval is rejected", async () => {
    const t = setup();
    const documentId = await seedReadyDocument(t);
    const asApprover = t.withIdentity({ subject: "approver" });

    const result = await asApprover.mutation(api.quality.approveCompiledDocument, {
      documentId,
    });
    expect(result.approvedByUserId).toBeDefined();
    await expect(
      asApprover.mutation(api.quality.approveCompiledDocument, { documentId }),
    ).rejects.toThrow(/already been approved/i);
  });

  test("approval is human-only: a call with no identity is rejected", async () => {
    const t = setup();
    const documentId = await seedReadyDocument(t);
    // No withIdentity — mirrors an internal/agent caller, which carries no
    // ctx.auth identity. No fabricated agent principal is needed.
    await expect(
      t.mutation(api.quality.approveCompiledDocument, { documentId }),
    ).rejects.toThrow(/authenticated/i);
  });
});

/** Seed a gate-passed compiled document plus its approver user. */
async function seedReadyDocument(t: ReturnType<typeof setup>) {
  return t.run(async (ctx) => {
    const projectId = await ctx.db.insert("projects", {
      title: "P",
      currentVersion: 1,
      createdAt: 0,
      updatedAt: 0,
    });
    const canonSnapshot = await ctx.db.insert("canonSnapshots", {
      projectId,
      projectVersion: 1,
      meta: {},
      objects: [],
      createdAt: 0,
    });
    await ctx.db.insert("users", { subject: "approver", createdAt: 0 });
    return ctx.db.insert("compiledDocuments", {
      sourceProject: projectId,
      projectVersion: 1,
      canonSnapshot,
      intendedAudience: "producer",
      compilationProfile: "story-bible",
      compilerVersion: "0.1.0",
      sourceObjects: [],
      title: "Doc",
      confidentiality: "internal",
      qualityGateStatus: "ready",
      approvalStatus: "draft",
      exportStatus: "not-exported",
      deliveryStatus: "not-delivered",
      createdAt: 0,
      updatedAt: 0,
    });
  });
}
