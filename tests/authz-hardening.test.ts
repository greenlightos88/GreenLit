import { describe, expect, test } from "bun:test";
import { anyApi } from "convex/server";
import type { FunctionReference } from "convex/server";
import type { GenericId } from "convex/values";
import { convexTest } from "convex-test";
import schema from "../convex/schema";

/**
 * Milestone 2 — Critical authorization hardening (Issue #11).
 *
 * Owner-isolation coverage for the previously-unauthorized server functions in
 * reviews.ts and exports.ts, plus authorship-identity derivation. Drives the
 * REAL exported Convex functions and REAL schema through convex-test; Clerk
 * identity is supplied via withIdentity(), never mocked. Seeding uses the real
 * in-memory db (t.run).
 */

const api = anyApi as unknown as {
  reviews: {
    recordReviewNote: FunctionReference<"mutation">;
    decideReviewNote: FunctionReference<"mutation">;
    listReviewNotes: FunctionReference<"query">;
  };
  exports: {
    queueExport: FunctionReference<"mutation">;
  };
};

const modules: Record<string, () => Promise<unknown>> = {
  "./_generated/api.js": () => Promise.resolve({}),
  "./reviews.js": () => import("../convex/reviews"),
  "./exports.js": () => import("../convex/exports"),
  "./identity.js": () => import("../convex/identity"),
};

const setup = () => convexTest(schema, modules);
type T = ReturnType<typeof setup>;

/**
 * Seed an owner ("owner-a") with a project, a compiled document, and a delivered
 * document version. Also provisions a non-owner ("owner-b") and, optionally, a
 * second project + delivery room owned by owner-b for cross-project checks.
 */
async function seed(t: T) {
  return t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { subject: "owner-a", createdAt: 0 });
    const otherId = await ctx.db.insert("users", { subject: "owner-b", createdAt: 0 });
    const projectId = await ctx.db.insert("projects", {
      title: "P", currentVersion: 1, ownerUserId: ownerId, createdAt: 0, updatedAt: 0,
    });
    const snapshotId = await ctx.db.insert("canonSnapshots", {
      projectId, projectVersion: 1, meta: {}, objects: [], createdAt: 0,
    });
    const documentId = await ctx.db.insert("compiledDocuments", {
      sourceProject: projectId, projectVersion: 1, canonSnapshot: snapshotId,
      intendedAudience: "producer", compilationProfile: "pitch-document",
      compilerVersion: "0.1.0", sourceObjects: [], title: "Doc", confidentiality: "internal",
      qualityGateStatus: "ready", approvalStatus: "approved", exportStatus: "not-exported",
      deliveryStatus: "not-delivered", createdAt: 0, updatedAt: 0,
    });
    const documentVersionId = await ctx.db.insert("documentVersions", {
      documentId, version: 1, snapshotId, frozenDocument: {}, label: "v1",
      delivered: true, createdAt: 0,
    });
    // A second project + room owned by the OTHER user, for cross-project checks.
    const otherProjectId = await ctx.db.insert("projects", {
      title: "Other", currentVersion: 1, ownerUserId: otherId, createdAt: 0, updatedAt: 0,
    });
    const otherRoomId = await ctx.db.insert("deliveryRooms", {
      projectId: otherProjectId, name: "Other room", visibleVersion: 1,
      accessLevel: "read-only", downloadPermission: false, commentPermission: false,
      createdAt: 0,
    });
    return { ownerId, otherId, projectId, documentId, documentVersionId, otherRoomId };
  });
}

const NOTE = {
  author: "Producer",
  source: "Studio Review Package",
  note: "Can this sequence fit the schedule?",
  category: "production-concern",
  severity: "warning",
  targetObjectKeys: [] as string[],
};

describe("Issue #11 — reviews.ts owner authorization", () => {
  test("the owner can record, list, and decide review notes", async () => {
    const t = setup();
    const { documentVersionId, ownerId } = await seed(t);
    const asOwner = t.withIdentity({ subject: "owner-a" });

    const noteId = await asOwner.mutation(api.reviews.recordReviewNote, {
      documentVersionId,
      ...NOTE,
    });
    const listed = await asOwner.query(api.reviews.listReviewNotes, { documentVersionId });
    expect(listed).toHaveLength(1);

    const decisionId = await asOwner.mutation(api.reviews.decideReviewNote, {
      reviewNoteId: noteId,
      action: "accept",
    });
    // The decider is derived from identity and persisted; the note is updated.
    const decision = await t.run((ctx) =>
      ctx.db.get(decisionId as GenericId<"reviewDecisions">),
    );
    expect(decision?.decidedBy).toBe(String(ownerId));
    const note = await t.run((ctx) => ctx.db.get(noteId as GenericId<"reviewNotes">));
    expect(note?.acceptanceStatus).toBe("accept");
  });

  test("a non-owner cannot record, list, or decide review notes", async () => {
    const t = setup();
    const { documentVersionId } = await seed(t);
    const asOwner = t.withIdentity({ subject: "owner-a" });
    const noteId = await asOwner.mutation(api.reviews.recordReviewNote, {
      documentVersionId,
      ...NOTE,
    });

    const asIntruder = t.withIdentity({ subject: "owner-b" });
    await expect(
      asIntruder.mutation(api.reviews.recordReviewNote, { documentVersionId, ...NOTE }),
    ).rejects.toThrow(/forbidden/i);
    await expect(
      asIntruder.query(api.reviews.listReviewNotes, { documentVersionId }),
    ).rejects.toThrow(/forbidden/i);
    await expect(
      asIntruder.mutation(api.reviews.decideReviewNote, { reviewNoteId: noteId, action: "accept" }),
    ).rejects.toThrow(/forbidden/i);
  });

  test("unauthenticated review access is rejected", async () => {
    const t = setup();
    const { documentVersionId } = await seed(t);
    await expect(
      t.mutation(api.reviews.recordReviewNote, { documentVersionId, ...NOTE }),
    ).rejects.toThrow(/authenticated/i);
    await expect(
      t.query(api.reviews.listReviewNotes, { documentVersionId }),
    ).rejects.toThrow(/authenticated/i);
  });

  test("decidedBy cannot be injected by the caller", async () => {
    const t = setup();
    const { documentVersionId } = await seed(t);
    const asOwner = t.withIdentity({ subject: "owner-a" });
    const noteId = await asOwner.mutation(api.reviews.recordReviewNote, {
      documentVersionId,
      ...NOTE,
    });
    // The function takes no decidedBy argument; supplying one fails validation.
    await expect(
      asOwner.mutation(api.reviews.decideReviewNote, {
        reviewNoteId: noteId,
        action: "accept",
        decidedBy: "ATTACKER",
      }),
    ).rejects.toThrow();
  });

  test("a note cannot be cross-linked into another project's delivery room", async () => {
    const t = setup();
    const { documentVersionId, otherRoomId } = await seed(t);
    const asOwner = t.withIdentity({ subject: "owner-a" });
    // documentVersionId is owned by owner-a, but the room belongs to owner-b's project.
    await expect(
      asOwner.mutation(api.reviews.recordReviewNote, {
        documentVersionId,
        roomId: otherRoomId,
        ...NOTE,
      }),
    ).rejects.toThrow(/does not belong/i);
  });
});

describe("Issue #11 — exports.ts owner authorization", () => {
  test("the owner can queue an export of their document", async () => {
    const t = setup();
    const { documentId } = await seed(t);
    const asOwner = t.withIdentity({ subject: "owner-a" });
    const jobId = await asOwner.mutation(api.exports.queueExport, {
      documentId,
      format: "pdf",
    });
    const job = await t.run((ctx) => ctx.db.get(jobId as GenericId<"exportJobs">));
    expect(job?.status).toBe("queued");
    expect(String(job?.documentId)).toBe(String(documentId));
  });

  test("a non-owner cannot queue an export", async () => {
    const t = setup();
    const { documentId } = await seed(t);
    await expect(
      t.withIdentity({ subject: "owner-b" }).mutation(api.exports.queueExport, {
        documentId,
        format: "pdf",
      }),
    ).rejects.toThrow(/forbidden/i);
  });

  test("unauthenticated export is rejected", async () => {
    const t = setup();
    const { documentId } = await seed(t);
    await expect(
      t.mutation(api.exports.queueExport, { documentId, format: "pdf" }),
    ).rejects.toThrow(/authenticated/i);
  });
});
