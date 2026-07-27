import { describe, expect, test } from "bun:test";
import { anyApi } from "convex/server";
import type { FunctionReference } from "convex/server";
import type { GenericId } from "convex/values";
import { convexTest } from "convex-test";
import schema from "../convex/schema";

/**
 * Milestone 1.1 — the authoritative, persisted compilation pipeline.
 *
 * Every finalized artifact is produced server-side from the exact immutable
 * Canon Snapshot and persisted through one owner-authorized path. These tests
 * drive the REAL exported Convex functions and the REAL schema with convex-test
 * (Clerk identity supplied via withIdentity, never mocked), asserting:
 * authorization isolation, exact snapshot linkage, run state, persisted
 * provenance, reload retrieval, repeat compilation, and delivered immutability.
 */

const api = anyApi as unknown as {
  projects: { saveProjectSnapshot: FunctionReference<"mutation"> };
  fragments: { captureFragment: FunctionReference<"mutation"> };
  interpret: {
    runInterpretation: FunctionReference<"mutation">;
    listCandidates: FunctionReference<"query">;
  };
  canon: { decideCandidate: FunctionReference<"mutation"> };
  snapshot: { createCanonSnapshot: FunctionReference<"mutation"> };
  compilerPersistence: {
    compileSnapshot: FunctionReference<"mutation">;
    getCompiledDocument: FunctionReference<"query">;
    getLatestCompilation: FunctionReference<"query">;
    createDeliveryRoom: FunctionReference<"mutation">;
  };
};

const modules: Record<string, () => Promise<unknown>> = {
  "./_generated/api.js": () => Promise.resolve({}),
  "./projects.js": () => import("../convex/projects"),
  "./fragments.js": () => import("../convex/fragments"),
  "./interpret.js": () => import("../convex/interpret"),
  "./canon.js": () => import("../convex/canon"),
  "./snapshot.js": () => import("../convex/snapshot"),
  "./compilerPersistence.js": () => import("../convex/compilerPersistence"),
  "./identity.js": () => import("../convex/identity"),
};

const setup = () => convexTest(schema, modules);
type Ident = ReturnType<ReturnType<typeof setup>["withIdentity"]>;
const TIDEWRACK =
  "A deaf lighthouse keeper on a drowning coast realizes the tide is ringing messages through the wreck-bells.";
type Candidate = { _id: string; candidateType: string };

/** Build a project with approved Canon and freeze it into a snapshot. */
async function seedSnapshot(as: Ident) {
  const { projectId } = await as.mutation(api.projects.saveProjectSnapshot, {
    title: "Tidewrack",
    meta: {},
    objects: [],
  });
  const { fragmentId } = await as.mutation(api.fragments.captureFragment, {
    projectId,
    text: TIDEWRACK,
    sourceType: "premise",
  });
  await as.mutation(api.interpret.runInterpretation, { fragmentId });
  const candidates = (await as.query(api.interpret.listCandidates, { projectId })) as Candidate[];
  const premise = candidates.find((c) => c.candidateType === "premise")!;
  const character = candidates.find((c) => c.candidateType === "character")!;
  await as.mutation(api.canon.decideCandidate, { candidateId: premise._id, action: "approve" });
  await as.mutation(api.canon.decideCandidate, {
    candidateId: character._id,
    action: "edit-approve",
    edits: { name: "Nerin" },
  });
  const { snapshotId } = (await as.mutation(api.snapshot.createCanonSnapshot, {
    projectId,
    label: "v1",
  })) as { snapshotId: string };
  return { projectId, snapshotId };
}

const userIdFor = (t: ReturnType<typeof setup>, subject: string) =>
  t.run(async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_subject", (q) => q.eq("subject", subject))
      .unique();
    return user?._id;
  });

describe("Milestone 1.1 — persisted authoritative compilation", () => {
  test("authorization isolation: only the owner may compile or read", async () => {
    const t = setup();
    const asA = t.withIdentity({ subject: "owner-a" });
    const { projectId, snapshotId } = await seedSnapshot(asA);
    const { documentId } = (await asA.mutation(api.compilerPersistence.compileSnapshot, {
      snapshotId,
      profileKey: "pitch-document",
    })) as { documentId: string };

    // A different provisioned user owns nothing here.
    const asB = t.withIdentity({ subject: "owner-b" });
    await asB.mutation(api.projects.saveProjectSnapshot, { title: "B", meta: {}, objects: [] });

    await expect(
      asB.mutation(api.compilerPersistence.compileSnapshot, {
        snapshotId: snapshotId as GenericId<"canonSnapshots">,
        profileKey: "pitch-document",
      }),
    ).rejects.toThrow(/forbidden/i);
    await expect(
      asB.query(api.compilerPersistence.getCompiledDocument, {
        documentId: documentId as GenericId<"compiledDocuments">,
      }),
    ).rejects.toThrow(/forbidden/i);
    await expect(
      asB.query(api.compilerPersistence.getLatestCompilation, {
        projectId: projectId as GenericId<"projects">,
      }),
    ).rejects.toThrow(/forbidden/i);

    // An internal/agent caller with no identity is rejected outright.
    await expect(
      t.mutation(api.compilerPersistence.compileSnapshot, {
        snapshotId: snapshotId as GenericId<"canonSnapshots">,
        profileKey: "pitch-document",
      }),
    ).rejects.toThrow(/authenticated/i);
  });

  test("requestedBy is derived from identity, never accepted from the client", async () => {
    const t = setup();
    const asA = t.withIdentity({ subject: "owner-a" });
    const { snapshotId } = await seedSnapshot(asA);

    // A caller cannot inject requestedBy: the arg is not part of the validator.
    await expect(
      asA.mutation(api.compilerPersistence.compileSnapshot, {
        snapshotId,
        profileKey: "pitch-document",
        requestedBy: "ATTACKER",
      }),
    ).rejects.toThrow();

    const { runId } = (await asA.mutation(api.compilerPersistence.compileSnapshot, {
      snapshotId,
      profileKey: "pitch-document",
    })) as { runId: string };
    const ownerId = await userIdFor(t, "owner-a");
    const run = await t.run((ctx) => ctx.db.get(runId as GenericId<"compilationRuns">));
    // requestedBy is the authenticated user's stable id, not a caller string.
    expect(run?.requestedBy).toBe(String(ownerId));
  });

  test("exact snapshot linkage and succeeded run state", async () => {
    const t = setup();
    const asA = t.withIdentity({ subject: "owner-a" });
    const { snapshotId } = await seedSnapshot(asA);
    const { runId, documentId } = (await asA.mutation(
      api.compilerPersistence.compileSnapshot,
      { snapshotId, profileKey: "pitch-document" },
    )) as { runId: string; documentId: string };

    const doc = await t.run((ctx) => ctx.db.get(documentId as GenericId<"compiledDocuments">));
    const run = await t.run((ctx) => ctx.db.get(runId as GenericId<"compilationRuns">));

    // The document and run both cite the exact immutable snapshot compiled from.
    expect(String(doc?.canonSnapshot)).toBe(String(snapshotId));
    expect(String(run?.snapshotId)).toBe(String(snapshotId));
    // Run state transitions running → succeeded, linked to the document.
    expect(run?.status).toBe("succeeded");
    expect(String(run?.documentId)).toBe(String(documentId));
    expect(typeof run?.completedAt).toBe("number");
    expect(typeof run?.startedAt).toBe("number");
  });

  test("persisted provenance: sections, sources, dependencies, gate run", async () => {
    const t = setup();
    const asA = t.withIdentity({ subject: "owner-a" });
    const { projectId, snapshotId } = await seedSnapshot(asA);
    const { documentId } = (await asA.mutation(api.compilerPersistence.compileSnapshot, {
      snapshotId,
      profileKey: "pitch-document",
    })) as { documentId: string };

    const persisted = await t.run(async (ctx) => {
      const docId = documentId as GenericId<"compiledDocuments">;
      const sections = await ctx.db
        .query("compiledDocumentSections")
        .withIndex("by_document", (q) => q.eq("documentId", docId))
        .collect();
      const sources = await ctx.db.query("sectionSources").collect();
      const deps = await ctx.db
        .query("documentDependencies")
        .withIndex("by_document", (q) => q.eq("documentId", docId))
        .collect();
      const gateRuns = await ctx.db
        .query("qualityGateRuns")
        .withIndex("by_document", (q) => q.eq("documentId", docId))
        .collect();
      const gateResults = await ctx.db.query("qualityGateResults").collect();
      return { sections, sources, deps, gateRuns, gateResults };
    });

    expect(persisted.sections.length).toBeGreaterThan(0);
    expect(persisted.sources.length).toBeGreaterThan(0);
    expect(persisted.deps.length).toBeGreaterThan(0);
    // The approved premise reaches the overview as a user-origin, non-inferred
    // citation into the snapshot's project meta (objectKey === projectId).
    const projectMetaSource = persisted.sources.find(
      (s) => s.sourceObjectKey === String(projectId),
    );
    expect(projectMetaSource?.origin).toBe("user");
    expect(projectMetaSource?.inference).toBe(false);
    // One gate run with a result per gate is persisted.
    expect(persisted.gateRuns).toHaveLength(1);
    expect(persisted.gateResults.length).toBeGreaterThan(0);
  });

  test("reload retrieval returns the full durable artifact", async () => {
    const t = setup();
    const asA = t.withIdentity({ subject: "owner-a" });
    const { projectId, snapshotId } = await seedSnapshot(asA);
    const { documentId } = (await asA.mutation(api.compilerPersistence.compileSnapshot, {
      snapshotId,
      profileKey: "pitch-document",
    })) as { documentId: string };

    const byId = (await asA.query(api.compilerPersistence.getCompiledDocument, {
      documentId,
    })) as {
      document: { _id: string };
      sections: unknown[];
      warnings: unknown[];
      run: { status: string } | null;
      gateRun: { results: unknown[] } | null;
      snapshot: { id: string } | null;
    };
    expect(String(byId.document._id)).toBe(String(documentId));
    expect(byId.sections.length).toBeGreaterThan(0);
    expect(byId.run?.status).toBe("succeeded");
    expect(byId.gateRun?.results.length ?? 0).toBeGreaterThan(0);
    expect(String(byId.snapshot?.id)).toBe(String(snapshotId));

    const latest = (await asA.query(api.compilerPersistence.getLatestCompilation, {
      projectId,
    })) as { document: { _id: string } } | null;
    expect(String(latest?.document._id)).toBe(String(documentId));
  });

  test("repeat compilation creates a new traceable version each time", async () => {
    const t = setup();
    const asA = t.withIdentity({ subject: "owner-a" });
    const { projectId, snapshotId } = await seedSnapshot(asA);

    const first = (await asA.mutation(api.compilerPersistence.compileSnapshot, {
      snapshotId,
      profileKey: "pitch-document",
    })) as { documentId: string };
    const second = (await asA.mutation(api.compilerPersistence.compileSnapshot, {
      snapshotId,
      profileKey: "pitch-document",
    })) as { documentId: string };

    expect(String(first.documentId)).not.toBe(String(second.documentId));

    const docCount = await t.run(async (ctx) => {
      const docs = await ctx.db
        .query("compiledDocuments")
        .withIndex("by_project", (q) => q.eq("sourceProject", projectId as GenericId<"projects">))
        .collect();
      return docs.length;
    });
    expect(docCount).toBe(2);

    const latest = (await asA.query(api.compilerPersistence.getLatestCompilation, {
      projectId,
    })) as { document: { _id: string } };
    // The latest retrieval reflects the newest compile.
    expect(String(latest.document._id)).toBe(String(second.documentId));
  });

  test("a delivered document and its frozen version are never rewritten by a re-compile", async () => {
    const t = setup();
    const asA = t.withIdentity({ subject: "owner-a" });
    const { projectId, snapshotId } = await seedSnapshot(asA);
    const { documentId } = (await asA.mutation(api.compilerPersistence.compileSnapshot, {
      snapshotId,
      profileKey: "pitch-document",
    })) as { documentId: string };

    // Force the first document through approval (gate readiness is exercised
    // elsewhere) so it can be delivered.
    await t.run((ctx) =>
      ctx.db.patch(documentId as GenericId<"compiledDocuments">, {
        qualityGateStatus: "ready",
        approvalStatus: "approved",
      }),
    );
    const { documentVersionId } = (await asA.mutation(
      api.compilerPersistence.createDeliveryRoom,
      {
        projectId,
        documentId,
        frozenDocument: { frozen: true, marker: "delivered-v1" },
        snapshotId,
        label: "v1",
        roomName: "Studio Room",
        recipientName: "Producer",
        commentPermission: false,
        downloadPermission: false,
      },
    )) as { documentVersionId: string };

    const deliveredBefore = await t.run((ctx) =>
      ctx.db.get(documentId as GenericId<"compiledDocuments">),
    );
    const frozenBefore = await t.run((ctx) =>
      ctx.db.get(documentVersionId as GenericId<"documentVersions">),
    );
    expect(deliveredBefore?.approvalStatus).toBe("delivered");

    // Re-compile the same snapshot: a NEW document is created.
    const { documentId: recompiledId } = (await asA.mutation(
      api.compilerPersistence.compileSnapshot,
      { snapshotId, profileKey: "pitch-document" },
    )) as { documentId: string };
    expect(String(recompiledId)).not.toBe(String(documentId));

    const deliveredAfter = await t.run((ctx) =>
      ctx.db.get(documentId as GenericId<"compiledDocuments">),
    );
    const frozenAfter = await t.run((ctx) =>
      ctx.db.get(documentVersionId as GenericId<"documentVersions">),
    );
    // The delivered document and its frozen version are byte-for-byte unchanged.
    expect(deliveredAfter?.approvalStatus).toBe("delivered");
    expect(deliveredAfter?.updatedAt).toBe(deliveredBefore?.updatedAt);
    expect(frozenAfter?.frozenDocument).toEqual(frozenBefore?.frozenDocument);
    expect((frozenAfter?.frozenDocument as { marker?: string })?.marker).toBe("delivered-v1");
  });
});
