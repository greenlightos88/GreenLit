import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ContentBlock } from "@domain/compiler/types";
import { projectFromSearch, resolveActiveProject } from "./projectRouting";

const COMPILE_PROFILE = "pitch-document";

type StringMap = Record<string, string>;

function stringFields(obj: unknown): StringMap {
  const out: StringMap = {};
  if (obj && typeof obj === "object") {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof value === "string") out[key] = value;
    }
  }
  return out;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The operation failed. Please try again.";
}

/**
 * Persistence-backed creator workspace.
 *
 * Durable project, Candidate, Canon, snapshot, and compilation state comes only
 * from owner-authorized Convex APIs. The `/develop?project=<id>` search param is
 * router-owned navigation state and is never trusted for authorization; Convex
 * validates ownership server-side, so an unavailable or unauthorized id can
 * never become the active project.
 */
export function DevelopPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { project?: string };
  const requestedProjectId = projectFromSearch(search);

  const projects = useQuery(api.projects.listProjects);
  const { activeProjectId, requestedUnavailable } = resolveActiveProject(projects, requestedProjectId);
  const activeProject = projects?.find((project) => project._id === activeProjectId);

  const saveProject = useMutation(api.projects.saveProjectSnapshot);
  const captureFragment = useMutation(api.fragments.captureFragment);
  const runInterpretation = useMutation(api.interpret.runInterpretation);
  const decideCandidate = useMutation(api.canon.decideCandidate);
  const createSnapshot = useMutation(api.snapshot.createCanonSnapshot);
  const compileSnapshot = useMutation(api.compilerPersistence.compileSnapshot);

  const candidates = useQuery(api.interpret.listCandidates, activeProjectId ? { projectId: activeProjectId } : "skip");
  const canonObjects = useQuery(api.canon.listCanonObjects, activeProjectId ? { projectId: activeProjectId } : "skip");
  const latestCompilation = useQuery(api.compilerPersistence.getLatestCompilation, activeProjectId ? { projectId: activeProjectId } : "skip");

  const [composer, setComposer] = useState("");
  const [sourceType, setSourceType] = useState("premise");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, StringMap>>({});
  const [unavailableNotice, setUnavailableNotice] = useState(false);
  const createdProjectId = useRef<Id<"projects"> | null>(null);

  // Keep the URL router-owned. When the active project differs from the
  // requested one (first load, or a requested project that is unavailable),
  // correct the URL in place without adding a history entry. A just-created
  // project is exempt until it appears in the authorized list.
  useEffect(() => {
    if (!activeProjectId || requestedProjectId === activeProjectId) return;
    if (requestedProjectId && requestedProjectId === createdProjectId.current) return;
    navigate({ to: "/develop", search: { project: activeProjectId }, replace: true });
  }, [activeProjectId, requestedProjectId, navigate]);

  // Surface, and keep visible, that a requested project was unavailable — even
  // after the URL is corrected to the fallback project. A just-created project
  // that has not yet reached the authorized list is not "unavailable".
  useEffect(() => {
    if (!requestedUnavailable) return;
    if (requestedProjectId && requestedProjectId === createdProjectId.current) return;
    setUnavailableNotice(true);
  }, [requestedUnavailable, requestedProjectId]);

  const proposed = (candidates ?? []).filter((candidate) => candidate.status === "proposed");
  const workspaceLoading = activeProjectId !== null && (candidates === undefined || canonObjects === undefined || latestCompilation === undefined);

  async function runOperation(key: string, operation: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await operation();
    } catch (operationError) {
      setError(errorMessage(operationError));
    } finally {
      setBusy(null);
    }
  }

  // Selecting a project is a real navigation (pushes history), so browser
  // Back/Forward moves between visited projects and the router restores each.
  function selectProject(projectId: Id<"projects">) {
    setEdits({});
    setError(null);
    setUnavailableNotice(false);
    navigate({ to: "/develop", search: { project: projectId } });
  }

  async function createProject() {
    await runOperation("project", async () => {
      const result = await saveProject({ title: "Untitled project", developmentStatus: "In development", meta: {}, objects: [] });
      createdProjectId.current = result.projectId as Id<"projects">;
      selectProject(result.projectId as Id<"projects">);
    });
  }

  async function interpret() {
    if (!activeProjectId || composer.trim().length === 0) return;
    await runOperation("interpret", async () => {
      const { fragmentId } = await captureFragment({ projectId: activeProjectId, text: composer, sourceType });
      await runInterpretation({ fragmentId });
      setComposer("");
    });
  }

  async function decide(candidateId: Id<"candidates">, action: "approve" | "edit-approve" | "reject" | "defer") {
    await runOperation(candidateId, async () => {
      const buffer = edits[candidateId];
      await decideCandidate({ candidateId, action, ...(action === "edit-approve" && buffer ? { edits: buffer } : {}) });
    });
  }

  async function snapshotAndCompile() {
    if (!activeProjectId) return;
    await runOperation("snapshot", async () => {
      const { snapshotId } = await createSnapshot({ projectId: activeProjectId, label: `Alpha ${new Date().toISOString()}` });
      await compileSnapshot({ snapshotId: snapshotId as Id<"canonSnapshots">, profileKey: COMPILE_PROFILE });
    });
  }

  if (projects === undefined) return <div className="develop-page"><p>Loading authorized projects…</p></div>;

  return (
    <main className="develop-page">
      <header className="develop-header">
        <div className="develop-header-copy">
          <p className="overline">Development workspace</p>
          <h1>{activeProject?.title ?? "Create your first project"}</h1>
          <p>Develop the story through conversation, review GreenLight's proposals, approve project truth, and compile only from Canon.</p>
        </div>
        {projects.length > 0 ? (
          <div className="develop-project-row">
            <label>
              Switch project
              <select value={activeProjectId ?? ""} onChange={(event) => selectProject(event.target.value as Id<"projects">)} disabled={busy !== null}>
                {projects.map((project) => <option key={project._id} value={project._id}>{project.title}</option>)}
              </select>
            </label>
            <Link className="button button-secondary" to="/projects">All projects</Link>
          </div>
        ) : null}
      </header>

      {activeProjectId ? (
        <section className="develop-state-row" aria-label="Project state">
          <div><span>Awaiting review</span><strong>{proposed.length}</strong></div>
          <div><span>Approved Canon</span><strong>{canonObjects?.length ?? "—"}</strong></div>
          <div><span>Compilation</span><strong>{latestCompilation === undefined ? "Loading" : latestCompilation === null ? "Not compiled" : String(latestCompilation.run?.status ?? "Available")}</strong></div>
        </section>
      ) : null}

      {unavailableNotice ? (
        <section className="develop-card" role="status">
          <p>The requested project was unavailable, so GreenLight opened your first authorized project and corrected the address. Choose a project above to continue.</p>
        </section>
      ) : null}

      {error ? <section className="develop-card" role="alert"><h2>Operation failed</h2><p>{error}</p></section> : null}

      {projects.length === 0 ? (
        <section className="develop-card develop-card-primary">
          <h2>Begin a private project</h2>
          <p>Create the authoritative workspace that will hold Fragments, Candidates, approved Canon, snapshots, and compiled artifacts.</p>
          <button type="button" className="button button-primary" onClick={createProject} disabled={busy !== null}>{busy === "project" ? "Creating…" : "Create project"}</button>
        </section>
      ) : activeProjectId ? (
        <>
          {workspaceLoading ? <section className="develop-card"><p>Rehydrating persisted workspace…</p></section> : null}

          <section className="develop-card develop-card-primary">
            <div className="develop-card-heading"><div><p className="overline">Creative input</p><h2>What are you building?</h2></div><p>Fragments remain evidence until you approve a Candidate.</p></div>
            <textarea value={composer} onChange={(event) => setComposer(event.target.value)} placeholder="Describe the story, character, image, conflict, question, or change you want to explore…" rows={6} />
            <div className="develop-actions">
              <select aria-label="Creative input type" value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
                <option value="premise">Premise</option><option value="note">Note</option><option value="reference">Reference</option>
              </select>
              <button type="button" className="button button-primary" onClick={interpret} disabled={busy !== null || composer.trim().length === 0}>{busy === "interpret" ? "Developing…" : "Develop this idea"}</button>
            </div>
          </section>

          <section className="develop-card">
            <div className="develop-card-heading"><div><p className="overline">Creator review</p><h2>Candidate proposals</h2></div><p>{proposed.length} awaiting your decision</p></div>
            {candidates === undefined ? <p>Loading persisted proposals…</p> : null}
            {candidates !== undefined && proposed.length === 0 ? <p className="muted">No proposals awaiting review.</p> : null}
            {proposed.map((candidate) => {
              const fields = { ...stringFields(candidate.proposedObject), ...(edits[candidate._id] ?? {}) };
              return (
                <article className="candidate-card" key={candidate._id}>
                  <div className="candidate-head"><strong>{candidate.candidateType}</strong><span className="candidate-origin">{candidate.origin}</span><span className="candidate-confidence">confidence {Math.round(candidate.confidence * 100)}%</span></div>
                  <p className="candidate-explanation">{candidate.explanation}</p>
                  {Object.entries(fields).map(([key, value]) => (
                    <label key={key} className="candidate-field"><span>{key}</span><input value={value} onChange={(event) => setEdits((previous) => ({ ...previous, [candidate._id]: { ...(previous[candidate._id] ?? {}), [key]: event.target.value } }))} /></label>
                  ))}
                  {candidate.uncertainty.length > 0 ? <ul className="candidate-uncertainty">{candidate.uncertainty.map((item: string, index: number) => <li key={index}>{item}</li>)}</ul> : null}
                  <div className="candidate-evidence">{candidate.evidence.map((evidence: unknown, index: number) => <blockquote key={index}>“{(evidence as { quote?: string }).quote ?? ""}”</blockquote>)}</div>
                  <div className="develop-actions">
                    <button type="button" className="button button-primary" disabled={busy !== null} onClick={() => decide(candidate._id, edits[candidate._id] ? "edit-approve" : "approve")}>{edits[candidate._id] ? "Edit & approve" : "Approve as Canon"}</button>
                    <button type="button" className="button button-secondary" disabled={busy !== null} onClick={() => decide(candidate._id, "defer")}>Defer</button>
                    <button type="button" className="button button-quiet" disabled={busy !== null} onClick={() => decide(candidate._id, "reject")}>Reject</button>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="develop-card">
            <div className="develop-card-heading"><div><p className="overline">Project truth</p><h2>Approved Canon</h2></div><p>{canonObjects?.length ?? 0} approved objects</p></div>
            {canonObjects === undefined ? <p>Loading approved Canon…</p> : null}
            {canonObjects !== undefined && canonObjects.length === 0 ? <p className="muted">No approved Canon yet.</p> : <ul className="canon-summary">{(canonObjects ?? []).map((object) => <li key={object._id}><strong>{object.kind}</strong> — {object.name}</li>)}</ul>}
            <div className="develop-actions"><button type="button" className="button button-primary" disabled={busy !== null || (canonObjects ?? []).length === 0} onClick={snapshotAndCompile}>{busy === "snapshot" ? "Compiling…" : "Compile current Canon"}</button></div>
          </section>

          <PersistedCompilation result={latestCompilation} />
        </>
      ) : null}
    </main>
  );
}

function PersistedCompilation({ result }: { result: ReturnType<typeof useQuery<typeof api.compilerPersistence.getLatestCompilation>> }) {
  if (result === undefined) return <section className="develop-card"><p>Loading latest persisted compilation…</p></section>;
  if (result === null) return <section className="develop-card"><div className="develop-card-heading"><div><p className="overline">Artifact</p><h2>Compiled document</h2></div><p>Not compiled</p></div><p className="muted">No authoritative compilation exists for this project yet.</p></section>;

  const { document, sections, warnings, snapshot, run } = result;
  const typedSections = sections as unknown as Array<{ _id: string; title: string; generatedProse: ContentBlock[]; sources: Array<{ sourceObjectKey: string }> }>;

  return (
    <section className="develop-card">
      <div className="develop-card-heading"><div><p className="overline">Artifact</p><h2>{String(document.title)}</h2></div><p>{String(run?.status ?? "unknown")} · gate {String(document.qualityGateStatus)}</p></div>
      <p className="muted">Persisted authoritative compilation{snapshot ? ` · snapshot ${String(snapshot.id)}` : ""}</p>
      {warnings.length > 0 ? <ul className="compiled-warnings">{warnings.map((warning, index: number) => <li key={index}>{String(warning.issue)}</li>)}</ul> : null}
      {typedSections.map((section) => (
        <article className="compiled-section" key={String(section._id)}>
          <h3>{String(section.title)}</h3>
          {section.generatedProse.map((block, index) => <p key={index}>{block.label ? <strong>{block.label}: </strong> : null}{block.text}{block.inference ? <em className="inference-tag"> (inference)</em> : null}</p>)}
          {section.sources.length > 0 ? <p className="provenance">Sources: {section.sources.map((source) => String(source.sourceObjectKey)).join(", ")}</p> : null}
        </article>
      ))}
    </section>
  );
}
