import { describe, expect, test } from "bun:test";
import { anyApi } from "convex/server";
import type { FunctionReference } from "convex/server";
import type { GenericId } from "convex/values";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { compileDocument } from "../convex/domain/compiler/compose";
import { getProfile } from "../convex/domain/compiler/profiles";
import type { CanonSnapshot } from "../convex/domain/graph/types";

/**
 * Phase 8 — full acceptance path:
 * Fragment → Candidate → Creator Review → Canon Event → Snapshot → Compilation,
 * with provenance surviving from the compiled block back to the source Fragment.
 */
const api = anyApi as unknown as {
  projects: { saveProjectSnapshot: FunctionReference<"mutation"> };
  fragments: {
    captureFragment: FunctionReference<"mutation">;
    getFragment: FunctionReference<"query">;
  };
  interpret: {
    runInterpretation: FunctionReference<"mutation">;
    listCandidates: FunctionReference<"query">;
  };
  canon: { decideCandidate: FunctionReference<"mutation"> };
  snapshot: {
    createCanonSnapshot: FunctionReference<"mutation">;
    getCanonSnapshot: FunctionReference<"query">;
  };
};

const modules: Record<string, () => Promise<unknown>> = {
  "./_generated/api.js": () => Promise.resolve({}),
  "./projects.js": () => import("../convex/projects"),
  "./fragments.js": () => import("../convex/fragments"),
  "./interpret.js": () => import("../convex/interpret"),
  "./canon.js": () => import("../convex/canon"),
  "./snapshot.js": () => import("../convex/snapshot"),
  "./identity.js": () => import("../convex/identity"),
};

const setup = () => convexTest(schema, modules);
const TIDEWRACK =
  "A deaf lighthouse keeper on a drowning coast realizes the tide is ringing messages through the wreck-bells.";
type Candidate = { _id: string; candidateType: string };

describe("Phase 8 — Fragment → … → Compilation", () => {
  test("compiles a professional artifact from only approved Canon, provenance intact", async () => {
    const t = setup();
    const as = t.withIdentity({ subject: "owner" });
    const { projectId } = await as.mutation(api.projects.saveProjectSnapshot, { title: "Tidewrack", meta: {}, objects: [] });
    const { fragmentId } = await as.mutation(api.fragments.captureFragment, {
      projectId,
      text: TIDEWRACK,
      sourceType: "premise",
    });
    await as.mutation(api.interpret.runInterpretation, { fragmentId });
    const candidates = (await as.query(api.interpret.listCandidates, { projectId })) as Candidate[];

    // Creator review: approve premise, name-and-approve a character, reject a location.
    const premise = candidates.find((c) => c.candidateType === "premise")!;
    const character = candidates.find((c) => c.candidateType === "character")!;
    const location = candidates.find((c) => c.candidateType === "location")!;
    await as.mutation(api.canon.decideCandidate, { candidateId: premise._id, action: "approve" });
    await as.mutation(api.canon.decideCandidate, {
      candidateId: character._id,
      action: "edit-approve",
      edits: { name: "Nerin" },
    });
    await as.mutation(api.canon.decideCandidate, { candidateId: location._id, action: "reject" });

    // Snapshot the approved Canon.
    const { snapshotId, objectCount, hasPremise } = (await as.mutation(api.snapshot.createCanonSnapshot, {
      projectId,
      label: "v1",
    })) as { snapshotId: string; objectCount: number; hasPremise: boolean };
    expect(hasPremise).toBe(true);
    expect(objectCount).toBe(1); // only the approved character (premise → meta, location rejected)

    const snap = (await as.query(api.snapshot.getCanonSnapshot, { snapshotId })) as {
      meta: Record<string, unknown>;
      objects: Array<Record<string, unknown>>;
      projectVersion: number;
      createdAt: number;
    };
    // Approved premise flowed into meta; rejected location is absent from Canon.
    expect(snap.meta.logline).toBe(TIDEWRACK);
    expect(snap.objects).toHaveLength(1);
    expect(snap.objects[0]?.name).toBe("Nerin");

    // Compile with the existing compiler, from the frozen snapshot only.
    const snapshot = {
      id: snapshotId,
      projectId: String(projectId),
      projectVersion: snap.projectVersion,
      meta: snap.meta,
      objects: snap.objects,
      createdAt: snap.createdAt,
    } as unknown as CanonSnapshot;
    const document = compileDocument(snapshot, getProfile("pitch-document")!, { now: snap.createdAt });
    expect(document.sections.length).toBeGreaterThan(0);
    // The premise reaches the overview; the character reaches the characters section.
    expect(document.sections.some((s) => s.sectionType === "project-overview")).toBe(true);
    const allText = JSON.stringify(document.sections);
    expect(allText).toContain("Nerin");

    // Provenance survival: a compiled block's source → canonical object → fragment.
    const sourceIds = new Set(document.sections.flatMap((s) => s.sources.map((r) => r.objectId)));
    const characterObj = snap.objects[0]!;
    expect(sourceIds.has(String(characterObj.id))).toBe(true);
    const provenance = characterObj.__provenance as { fragmentId: string; candidateId: string };
    expect(provenance.fragmentId).toBe(String(fragmentId));
    // …and the fragment still holds the exact original text.
    const fragment = (await as.query(api.fragments.getFragment, { fragmentId })) as { text: string };
    expect(fragment.text).toBe(TIDEWRACK);
  });

  test("another user cannot snapshot or read a project's Canon", async () => {
    const t = setup();
    const as = t.withIdentity({ subject: "owner-a" });
    const { projectId } = await as.mutation(api.projects.saveProjectSnapshot, { title: "A", meta: {}, objects: [] });
    await t.withIdentity({ subject: "owner-b" }).mutation(api.projects.saveProjectSnapshot, { title: "B", meta: {}, objects: [] });
    await expect(
      t.withIdentity({ subject: "owner-b" }).mutation(api.snapshot.createCanonSnapshot, {
        projectId: projectId as GenericId<"projects">,
      }),
    ).rejects.toThrow(/forbidden/i);
  });
});
