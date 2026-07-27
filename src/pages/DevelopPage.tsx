import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { compileDocument } from "@domain/compiler/compose";
import { getProfile } from "@domain/compiler/profiles";
import { visibleBlocks } from "@domain/compiler/compose";
import type { ContentBlock } from "@domain/compiler/types";
import type { CanonSnapshot } from "@domain/graph/types";

/** The profile every explicit compile targets in the vertical slice. */
const COMPILE_PROFILE = "pitch-document";

/**
 * Idea-to-Canon workspace (Implementation Milestone 1, Phase 9).
 *
 * A direct, functional creator flow: submit a Fragment, inspect the Interpreter's
 * Candidates (with evidence, origin, confidence, uncertainty), edit/approve/
 * reject/defer each, review approved Canon, then snapshot and compile a
 * professional artifact with visible provenance. All durable writes go through
 * the authenticated, owner-authorized Convex functions; edit buffers are the
 * only ephemeral interface state.
 */

type StringMap = Record<string, string>;

function stringFields(obj: unknown): StringMap {
  const out: StringMap = {};
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof v === "string") out[k] = v;
    }
  }
  return out;
}

export function DevelopPage() {
  const projects = useQuery(api.projects.listProjects);
  const [projectId, setProjectId] = useState<Id<"projects"> | null>(null);
  const activeProjectId = projectId ?? projects?.[0]?._id ?? null;

  const saveProject = useMutation(api.projects.saveProjectSnapshot);
  const captureFragment = useMutation(api.fragments.captureFragment);
  const runInterpretation = useMutation(api.interpret.runInterpretation);
  const decideCandidate = useMutation(api.canon.decideCandidate);
  const createSnapshot = useMutation(api.snapshot.createCanonSnapshot);
  const compileSnapshot = useMutation(api.compilerPersistence.compileSnapshot);

  const candidates = useQuery(
    api.interpret.listCandidates,
    activeProjectId ? { projectId: activeProjectId } : "skip",
  );
  const canonObjects = useQuery(
    api.canon.listCanonObjects,
    activeProjectId ? { projectId: activeProjectId } : "skip",
  );

  const [composer, setComposer] = useState("");
  const [sourceType, setSourceType] = useState("premise");
  const [busy, setBusy] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, StringMap>>({});
  const [snapshotId, setSnapshotId] = useState<Id<"canonSnapshots"> | null>(null);
  const [documentId, setDocumentId] = useState<Id<"compiledDocuments"> | null>(null);

  const proposed = (candidates ?? []).filter((c) => c.status === "proposed");

  async function createProject() {
    setBusy("project");
    const res = await saveProject({ title: "Untitled project", meta: {}, objects: [] });
    setProjectId(res.projectId as Id<"projects">);
    setBusy(null);
  }

  async function interpret() {
    if (!activeProjectId || composer.trim().length === 0) return;
    setBusy("interpret");
    const { fragmentId } = await captureFragment({
      projectId: activeProjectId,
      text: composer,
      sourceType,
    });
    await runInterpretation({ fragmentId });
    setComposer("");
    setBusy(null);
  }

  async function decide(
    candidateId: Id<"candidates">,
    action: "approve" | "edit-approve" | "reject" | "defer",
  ) {
    setBusy(candidateId);
    const buffer = edits[candidateId];
    await decideCandidate({
      candidateId,
      action,
      ...(action === "edit-approve" && buffer ? { edits: buffer } : {}),
    });
    setBusy(null);
  }

  async function snapshotAndPrepare() {
    if (!activeProjectId) return;
    setBusy("snapshot");
    // Freeze the approved Canon, then run the AUTHORITATIVE server compile: the
    // durable document is produced and persisted by Convex, not the browser.
    const { snapshotId: id } = await createSnapshot({ projectId: activeProjectId, label: "v1" });
    setSnapshotId(id as Id<"canonSnapshots">);
    const { documentId: docId } = await compileSnapshot({
      snapshotId: id as Id<"canonSnapshots">,
      profileKey: COMPILE_PROFILE,
    });
    setDocumentId(docId as Id<"compiledDocuments">);
    setBusy(null);
  }

  if (projects === undefined) {
    return <div className="develop-page"><p>Loading projects…</p></div>;
  }

  return (
    <div className="develop-page">
      <header className="develop-header">
        <h1>Idea to Canon</h1>
        <p>Submit a fragment, review the interpretation, approve project truth, and compile.</p>
        <div className="develop-project-row">
          <label>
            Project
            <select
              value={activeProjectId ?? ""}
              onChange={(e) => setProjectId(e.target.value as Id<"projects">)}
            >
              {(projects ?? []).map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          </label>
          <button type="button" className="button button-secondary" onClick={createProject} disabled={busy !== null}>
            New project
          </button>
        </div>
      </header>

      {activeProjectId ? (
        <>
          {/* 1. Fragment composer */}
          <section className="develop-card">
            <h2>1 · Capture a fragment</h2>
            <textarea
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              placeholder="A deaf lighthouse keeper on a drowning coast…"
              rows={4}
            />
            <div className="develop-actions">
              <select value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                <option value="premise">Premise</option>
                <option value="note">Note</option>
                <option value="reference">Reference</option>
              </select>
              <button
                type="button"
                className="button button-primary"
                onClick={interpret}
                disabled={busy !== null || composer.trim().length === 0}
              >
                {busy === "interpret" ? "Interpreting…" : "Interpret"}
              </button>
            </div>
          </section>

          {/* 2/3/4/5. Candidate review */}
          <section className="develop-card">
            <h2>2 · Review proposals ({proposed.length})</h2>
            {candidates === undefined ? <p>Loading…</p> : null}
            {candidates !== undefined && proposed.length === 0 ? (
              <p className="muted">No proposals awaiting review.</p>
            ) : null}
            {proposed.map((c) => {
              const fields = { ...stringFields(c.proposedObject), ...(edits[c._id] ?? {}) };
              return (
                <article className="candidate-card" key={c._id}>
                  <div className="candidate-head">
                    <strong>{c.candidateType}</strong>
                    <span className="candidate-origin">{c.origin}</span>
                    <span className="candidate-confidence">
                      confidence {Math.round(c.confidence * 100)}%
                    </span>
                  </div>
                  <p className="candidate-explanation">{c.explanation}</p>
                  {Object.entries(fields).map(([key, value]) => (
                    <label key={key} className="candidate-field">
                      <span>{key}</span>
                      <input
                        value={value}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [c._id]: { ...(prev[c._id] ?? {}), [key]: e.target.value },
                          }))
                        }
                      />
                    </label>
                  ))}
                  {c.uncertainty.length > 0 ? (
                    <ul className="candidate-uncertainty">
                      {c.uncertainty.map((u: string, i: number) => <li key={i}>{u}</li>)}
                    </ul>
                  ) : null}
                  <div className="candidate-evidence">
                    {c.evidence.map((e: unknown, i: number) => {
                      const quote = (e as { quote?: string }).quote ?? "";
                      return <blockquote key={i}>“{quote}”</blockquote>;
                    })}
                  </div>
                  <div className="develop-actions">
                    <button type="button" className="button button-primary" disabled={busy !== null}
                      onClick={() => decide(c._id, edits[c._id] ? "edit-approve" : "approve")}>
                      {edits[c._id] ? "Edit & approve" : "Approve"}
                    </button>
                    <button type="button" className="button button-secondary" disabled={busy !== null}
                      onClick={() => decide(c._id, "defer")}>Defer</button>
                    <button type="button" className="button button-quiet" disabled={busy !== null}
                      onClick={() => decide(c._id, "reject")}>Reject</button>
                  </div>
                </article>
              );
            })}
          </section>

          {/* 6. Approved Canon summary */}
          <section className="develop-card">
            <h2>3 · Approved Canon ({(canonObjects ?? []).length})</h2>
            {(canonObjects ?? []).length === 0 ? (
              <p className="muted">No approved Canon yet.</p>
            ) : (
              <ul className="canon-summary">
                {(canonObjects ?? []).map((o) => (
                  <li key={o._id}><strong>{o.kind}</strong> — {o.name}</li>
                ))}
              </ul>
            )}
            <div className="develop-actions">
              <button type="button" className="button button-primary" disabled={busy !== null || (canonObjects ?? []).length === 0}
                onClick={snapshotAndPrepare}>
                {busy === "snapshot" ? "Snapshotting…" : "Snapshot & compile"}
              </button>
            </div>
          </section>

          {/* 7/8. Authoritative compiled artifact (persisted by the server). */}
          {documentId ? <CompiledArtifact documentId={documentId} /> : null}
          {/* Ephemeral, non-authoritative client preview — labeled as such. */}
          {snapshotId ? <EphemeralPreview snapshotId={snapshotId} /> : null}
        </>
      ) : (
        <section className="develop-card">
          <p>Create a project to begin.</p>
          <button type="button" className="button button-primary" onClick={createProject}>New project</button>
        </section>
      )}
    </div>
  );
}

/**
 * The AUTHORITATIVE compiled artifact: produced and persisted server-side by the
 * durable compilation pipeline, then read back by document id. This is the real
 * result — provenance, warnings, gate status, and snapshot identity all come
 * from Convex, not from a browser compile.
 */
function CompiledArtifact({ documentId }: { documentId: Id<"compiledDocuments"> }) {
  const result = useQuery(api.compilerPersistence.getCompiledDocument, { documentId });

  if (result === undefined) {
    return <section className="develop-card"><p>Compiling on the server…</p></section>;
  }
  if (result === null) {
    return <section className="develop-card"><p>Compiled artifact not found.</p></section>;
  }
  const { document, sections, warnings, snapshot } = result;
  const typedSections = sections as unknown as Array<{
    _id: string;
    title: string;
    generatedProse: ContentBlock[];
    sources: Array<{ sourceObjectKey: string }>;
  }>;

  return (
    <section className="develop-card">
      <h2>4 · Compiled artifact — {String(document.title)}</h2>
      <p className="muted">
        Authoritative server compilation · gate status {String(document.qualityGateStatus)}
        {snapshot ? ` · from snapshot ${String(snapshot.id)}` : ""}
      </p>
      {warnings.length > 0 ? (
        <ul className="compiled-warnings">
          {warnings.map((w, i: number) => <li key={i}>{String(w.issue)}</li>)}
        </ul>
      ) : null}
      {typedSections.map((s) => (
        <article className="compiled-section" key={String(s._id)}>
          <h3>{String(s.title)}</h3>
          {s.generatedProse.map((b, i) => (
            <p key={i}>
              {b.label ? <strong>{b.label}: </strong> : null}
              {b.text}
              {b.inference ? <em className="inference-tag"> (inference)</em> : null}
            </p>
          ))}
          {s.sources.length > 0 ? (
            <p className="provenance">
              Sources: {s.sources.map((r) => String(r.sourceObjectKey)).join(", ")}
            </p>
          ) : null}
        </article>
      ))}
    </section>
  );
}

/**
 * Ephemeral, NON-authoritative preview: a pure client-side compile of the same
 * snapshot for instant feedback. It is never persisted and never delivered — the
 * server artifact above is the source of truth.
 */
function EphemeralPreview({ snapshotId }: { snapshotId: Id<"canonSnapshots"> }) {
  const snap = useQuery(api.snapshot.getCanonSnapshot, { snapshotId });
  const document = useMemo(() => {
    if (!snap) return null;
    const snapshot = {
      id: String(snapshotId),
      projectId: String(snap.projectId),
      projectVersion: snap.projectVersion,
      meta: snap.meta,
      objects: snap.objects,
      createdAt: snap.createdAt,
    } as unknown as CanonSnapshot;
    const profile = getProfile(COMPILE_PROFILE);
    return profile ? compileDocument(snapshot, profile, { now: snap.createdAt }) : null;
  }, [snap, snapshotId]);

  if (!snap) return <section className="develop-card"><p>Loading snapshot…</p></section>;
  if (!document) return <section className="develop-card"><p>Nothing to compile.</p></section>;

  return (
    <section className="develop-card develop-card-ephemeral">
      <h2>Ephemeral preview (not persisted)</h2>
      <p className="muted">
        Instant client-side preview only. The authoritative artifact above is the
        persisted server compilation.
      </p>
      {document.missingSections.length > 0 ? (
        <p className="muted">Missing (visible gaps): {document.missingSections.join(", ")}</p>
      ) : null}
      {document.sections.map((s) => (
        <article className="compiled-section" key={s.id}>
          <h3>{s.title}</h3>
          {visibleBlocks(s).map((b, i) => (
            <p key={i}>
              {b.label ? <strong>{b.label}: </strong> : null}
              {b.text}
              {b.inference ? <em className="inference-tag"> (inference)</em> : null}
            </p>
          ))}
          {s.sources.length > 0 ? (
            <p className="provenance">Sources: {s.sources.map((r) => r.objectId).join(", ")}</p>
          ) : null}
          {s.missing.length > 0 ? <p className="muted">Missing: {s.missing.join(", ")}</p> : null}
        </article>
      ))}
    </section>
  );
}
