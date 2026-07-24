import { describe, expect, test } from "bun:test";
import { anyApi, makeFunctionReference } from "convex/server";
import type { FunctionReference } from "convex/server";
import type { GenericId } from "convex/values";
import { convexTest } from "convex-test";
import schema from "../convex/schema";

/**
 * PR-1 identity/authorization integration tests (ADR-0002 §10.5), driven
 * through the REAL exported Convex functions and the REAL schema with
 * convex-test. Clerk is never mocked: identity claims are supplied through the
 * harness's withIdentity() mechanism, so code still enters via
 * ctx.auth.getUserIdentity(). Seeding uses convex-test's real in-memory db
 * (t.run) — no hand-rolled database or query-builder mocks.
 *
 * Bun has no import.meta.glob, so the module map is passed explicitly with a
 * stub _generated entry for convex-test's root detection; the functions use the
 * generic builders and never import _generated, so the suite runs without
 * codegen.
 */

// Typed facade over the untyped anyApi (no codegen in this repo).
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
const backfillProjectOwner = makeFunctionReference<"mutation">(
  "identity:backfillProjectOwner",
);

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
type T = ReturnType<typeof setup>;

const project = (title: string) => ({ title, meta: {}, objects: [] });

const userBySubject = (t: T, subject: string) =>
  t.run(async (ctx) =>
    ctx.db
      .query("users")
      .withIndex("by_subject", (q) => q.eq("subject", subject))
      .unique(),
  );

// Casting the id to a concrete table lets ctx.db.get infer that table's doc
// type (the untyped facade returns ids as `any`).
const getProject = (t: T, id: unknown) =>
  t.run((ctx) => ctx.db.get(id as GenericId<"projects">));
const getCompiledDoc = (t: T, id: unknown) =>
  t.run((ctx) => ctx.db.get(id as GenericId<"compiledDocuments">));

describe("PR-1 identity and project authorization", () => {
  test("unauthenticated project access is rejected", async () => {
    const t = setup();
    await expect(t.mutation(api.projects.saveProjectSnapshot, project("P"))).rejects.toThrow(
      /authenticated/i,
    );
    await expect(t.query(api.projects.listProjects, {})).rejects.toThrow(/authenticated/i);
  });

  test("an authenticated but unprovisioned user is rejected by read-only helpers", async () => {
    const t = setup();
    // Identity present (Clerk), but no users row exists yet.
    const asGhost = t.withIdentity({ subject: "ghost" });
    await expect(asGhost.query(api.projects.listProjects, {})).rejects.toThrow(/provisioned/i);
  });

  test("ensureCurrentUser provisions on first write and updates changed claims", async () => {
    const t = setup();
    const first = t.withIdentity({ subject: "u1", email: "old@x.test", name: "Old Name" });
    await first.mutation(api.projects.saveProjectSnapshot, project("first"));
    const created = await userBySubject(t, "u1");
    expect(created?.email).toBe("old@x.test");
    expect(created?.displayName).toBe("Old Name");

    const second = t.withIdentity({ subject: "u1", email: "new@x.test", name: "New Name" });
    await second.mutation(api.projects.saveProjectSnapshot, project("second"));
    const updated = await userBySubject(t, "u1"); // .unique() also proves no duplicate row
    expect(updated?._id).toBe(created?._id);
    expect(updated?.email).toBe("new@x.test");
    expect(updated?.displayName).toBe("New Name");
  });

  test("project creation stamps ownerUserId server-side", async () => {
    const t = setup();
    const asA = t.withIdentity({ subject: "user-a" });
    const { projectId } = await asA.mutation(api.projects.saveProjectSnapshot, project("A"));
    const user = await userBySubject(t, "user-a");
    const stored = await getProject(t, projectId);
    expect(stored?.ownerUserId).toBe(user?._id);
  });

  test("owner access succeeds and listProjects returns only the owner's projects", async () => {
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

  test("cross-owner project access is rejected", async () => {
    const t = setup();
    const asA = t.withIdentity({ subject: "user-a" });
    const asB = t.withIdentity({ subject: "user-b" });
    const { projectId } = await asA.mutation(api.projects.saveProjectSnapshot, project("A-secret"));
    await asB.mutation(api.projects.saveProjectSnapshot, project("B-own"));
    await expect(asB.query(api.projects.getLatestSnapshot, { projectId })).rejects.toThrow(
      /forbidden/i,
    );
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
});

describe("PR-1 approval", () => {
  test("approval derives the approver from identity and persists status/approver/time atomically", async () => {
    const t = setup();
    const documentId = await seedReadyDocument(t);
    const asApprover = t.withIdentity({ subject: "approver" });

    const before = await getCompiledDoc(t, documentId);
    expect(before?.approvalStatus).toBe("draft");

    const result = await asApprover.mutation(api.quality.approveCompiledDocument, { documentId });
    const approver = await userBySubject(t, "approver");
    const after = await getCompiledDoc(t, documentId);

    // Approver is derived from the authenticated identity, not a caller string.
    expect(result.approvedByUserId).toBe(approver?._id);
    // Status, approver, and time are all persisted together.
    expect(after?.approvalStatus).toBe("approved");
    expect(after?.approvedByUserId).toBe(approver?._id);
    expect(typeof after?.approvedAt).toBe("number");
  });

  test("accidental re-approval is rejected", async () => {
    const t = setup();
    const documentId = await seedReadyDocument(t);
    const asApprover = t.withIdentity({ subject: "approver" });
    await asApprover.mutation(api.quality.approveCompiledDocument, { documentId });
    await expect(
      asApprover.mutation(api.quality.approveCompiledDocument, { documentId }),
    ).rejects.toThrow(/already been approved/i);
  });

  test("approval is human-only: a call with no identity is rejected", async () => {
    const t = setup();
    const documentId = await seedReadyDocument(t);
    // No withIdentity — an internal/agent caller carries no ctx.auth identity.
    await expect(
      t.mutation(api.quality.approveCompiledDocument, { documentId }),
    ).rejects.toThrow(/authenticated/i);
  });

  test("a provisioned non-owner cannot approve another owner's document", async () => {
    const t = setup();
    const documentId = await seedReadyDocument(t); // source project owned by "approver"
    // The intruder is authenticated and provisioned (owns their own project),
    // but does not own the document's source project.
    const asIntruder = t.withIdentity({ subject: "intruder" });
    await asIntruder.mutation(api.projects.saveProjectSnapshot, project("intruder-own"));
    await expect(
      asIntruder.mutation(api.quality.approveCompiledDocument, { documentId }),
    ).rejects.toThrow(/forbidden/i);
  });

  test("a caller-supplied actor string cannot bypass approval", async () => {
    const t = setup();
    const documentId = await seedReadyDocument(t);
    const asApprover = t.withIdentity({ subject: "approver" });
    // The function takes no approver argument; supplying one is rejected by
    // argument validation, so a caller cannot inject the approver identity.
    await expect(
      asApprover.mutation(api.quality.approveCompiledDocument, {
        documentId,
        approvedBy: "ATTACKER",
      }),
    ).rejects.toThrow();
  });
});

describe("PR-1 constrained ownership backfill", () => {
  test("backfill assigns an existing user to an ownerless project", async () => {
    const t = setup();
    const { projectId, userId } = await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", { subject: "owner-x", createdAt: 0 });
      const pid = await ctx.db.insert("projects", {
        title: "Orphan",
        currentVersion: 1,
        createdAt: 0,
        updatedAt: 0,
      });
      return { projectId: pid, userId: uid };
    });
    await t.mutation(backfillProjectOwner, { projectId, subject: "owner-x" });
    const stored = await getProject(t, projectId);
    expect(stored?.ownerUserId).toBe(userId);
  });

  test("backfill refuses to reassign an already-owned project", async () => {
    const t = setup();
    const projectId = await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", { subject: "owner-x", createdAt: 0 });
      await ctx.db.insert("users", { subject: "owner-y", createdAt: 0 });
      return ctx.db.insert("projects", {
        title: "Owned",
        currentVersion: 1,
        ownerUserId: uid,
        createdAt: 0,
        updatedAt: 0,
      });
    });
    await expect(
      t.mutation(backfillProjectOwner, { projectId, subject: "owner-y" }),
    ).rejects.toThrow(/refusing to overwrite/i);
  });

  test("backfill rejects a subject with no existing user", async () => {
    const t = setup();
    const projectId = await t.run((ctx) =>
      ctx.db.insert("projects", {
        title: "Orphan",
        currentVersion: 1,
        createdAt: 0,
        updatedAt: 0,
      }),
    );
    await expect(
      t.mutation(backfillProjectOwner, { projectId, subject: "nobody" }),
    ).rejects.toThrow(/no user exists/i);
  });
});

/** Seed a gate-passed compiled document owned (via its source project) by "approver". */
async function seedReadyDocument(t: T) {
  return t.run(async (ctx) => {
    // The approver owns the document's source project — approval is authorized
    // against that project, not merely against being authenticated.
    const approverId = await ctx.db.insert("users", { subject: "approver", createdAt: 0 });
    const projectId = await ctx.db.insert("projects", {
      title: "P",
      currentVersion: 1,
      ownerUserId: approverId,
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
