import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ContentBlock } from "@domain/compiler/types";

const COMPILE_PROFILE = "pitch-document";
const PROJECT_QUERY_KEY = "project";

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

function projectFromLocation(): Id<"projects"> | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(PROJECT_QUERY_KEY) as Id<"projects"> | null;
}

function writeProjectToLocation(projectId: Id<"projects">) {
  const url = new URL(window.location.href);
  url.searchParams.set(PROJECT_QUERY_KEY, projectId);
  window.history.replaceState(null, "", url);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The operation failed. Please try again.";
}

/**
 * Persistence-backed Alpha workspace.
 *
 * Durable project, Candidate, Canon, snapshot, and compilation state comes only
 * from owner-authorized Convex APIs. The URL stores only the selected project id;
 * it is never trusted for authorization. Convex validates ownership server-side.
 */
export function DevelopPage() {
  const projects = useQuery(api.projects.listProjects);
  const requestedProjectId = projectFromLocation();
  const requestedProject = projects?.find((project) => project._id === requestedProjectId);
  const activeProjectId = requestedProject?._id ?? projects?.[0]?._id ?? null;

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
  const latestCompilation = useQuery(
    api.compilerPersistence.getLatestCompilation,
    activeProjectId ? { projectId: activeProjectId } : "skip",
  );

  const [composer, setComposer] = useState("");
  const [sourceType, setSourceType] = useState("premise");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, StringMap>>({});

  useEffect(() => {
    if (activeProjectId && requestedProjectId !== activeProjectId) {
      writeProjectToLocation(activeProjectId);
    }
  }, [activeProjectId, requestedProjectId]);

  const proposed = (candidates ?? []).filter((candidate) => candidate.status === "proposed");
  const workspaceLoading =
    activeProjectId !== null &&
    (candidates === undefined || canonObjects === undefined || latestCompilation === undefined);

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

  function selectProject(projectId: Id<"projects">) {
    writeProjectToLocation(projectId);
    setEdits({});
    setError(null);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  async function createProject() {
    await runOperation("project", async () => {
      const result = await saveProject({ title: "Untitled project", meta: {}, objects: [] });
      selectProject(result.projectId as Id<"projects">);
    });
  }

  async function interpret() {
    if (!activeProjectId || composer.trim().length === 0) return;
    await runOperation("interpret", async () => {
      const { fragmentId } = await captureFragment({
        projectId: activeProjectId,
        text: composer,
        sourceType,
      });
      await runInterpretation({ fragmentId });
      setComposer("");
    });
  }

  async function decide(
    candidateId: Id<"candidates">,
    action: "approve" | "edit-approve" | "reject" | "defer",
  ) {
    await runOperation(candidateId, async () => {
      const buffer = edits[candidateId];
      await decideCandidate({
        candidateId,
        action,
        ...(action === "edit-approve" && buffer ? { edits: buffer } : {}),
      });
    });
  }

  async function snapshotAndCompile() {
    if (!activeProjectId) return;
    await runOperation("snapshot", async () => {
      const { snapshotId } = await createSnapshot({
        projectId: activeProjectId,
        label: `Alpha ${new Date().toISOString()}`,
      });
      await compileSnapshot({
        snapshotId: snapshotId as Id<"canonSnapshots">,
        profileKey: COMPILE_PROFILE,
      });
    });
  }

  if (projects === undefined) {
    return <div className="develop-page"><p>Loading authorized projects…</p></div>;
  }

  return (
    <div className="develop-page">
      <header className="develop-header">
        <h1>Idea to Canon</h1>
        <p>Capture a fragment, review proposals, approve project truth, and compile a durable artifact.</p>
        <div className="develop-project-row">
          <label>
            Project
            <select
              value={activeProjectId ?? ""}
              onChange={(event) => selectProject(event.target.value as Id<"projects">)}
              disabled={busy !== null || projects.length === 0}
            >
              {projects.map((project) => (
                <option key={project._id} value={project._id}>{project.title}</option>
              ))}
            </select>
          </label>
          <button type="button" className="button button-secondary" onClick={createProject} disabled={busy !== null}>
            {busy === "project" ? "Creating…" : "New project"}
          </button>
        </div>
      </header>

      {requestedProjectId && !requestedProject && projects.length > 0 ? (
        <section className="develop-card" role="status">
          <p>The requested project is unavailable. GreenLight opened your first authorized project instead.</p>
        </section>
      ) : null}

      {error ? (
        <section className="develop-card" role="alert">
          <h2>Operation failed</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {projects.length === 0 ? (
        <section className="develop-card">
          <h2>No project yet</h2>
          <p>Create a persisted project to begin. GreenLight will restore it on refresh.</p>
          <button type="button" className="button button-primary" onClick={createProject} disabled={busy !== null}>
            {busy === "project" ? "Creating…" : "Create project"}
          </button>
        </section>
      ) : activeProjectId ? (
        <>
          {workspaceLoading ? <section className="develop-card"><p>Rehydrating persisted workspace…</p></section> : null}

          <section className="develop-card">
            <h2>1 · Capture a fragment</h2>
            <textarea
              value={composer}
              onChange={(event) => setComposer(event.target.value)}
              placeholder="A deaf lighthouse keeper on a drowning coast…"
              rows={4}
            />
            <div className="develop-actions">
              <select value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
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

          <section className="develop-card">
            <h2>2 · Review proposals ({proposed.length})</h2>
            {candidates === undefined ? <p>Loading persisted proposals…</p> : null}
            {candidates !== undefined && proposed.length === 0 ? (
              <p className="muted">No proposals awaiting review.</p>
            ) : null}
            {proposed.map((candidate) => {
              const fields = {
                ...stringFields(candidate.proposedObject),
                ...(edits[candidate._id] ?? {}),
              };
              return (
                <article className="candidate-card" key={candidate._id}>
                  <div className="candidate-head">
                    <strong>{candidate.candidateType}</strong>
                    <span className="candidate-origin">{candidate.origin}</span>
                    <span className="candidate-confidence">
                      confidence {Math.round(candidate.confidence * 100)}%
                    </span>
                  </div>
                  <p className="candidate-explanation">{candidate.explanation}</p>
                  {Object.entries(fields).map(([key, value]) => (
                    <label key={key} className="candidate-field">
                      <span>{key}</span>
                      <input
                        value={value}
                        onChange={(event) => setEdits((previous) => ({
                          ...previous,
                          [candidate._id]: {
                            ...(previous[candidate._id] ?? {}),
                            [key]: event.target.value,
                          },
                        }))}
                      />
                    </label>
                  ))}
                  {candidate.uncertainty.length > 0 ? (
                    <ul className="candidate-uncertainty">
                      {candidate.uncertainty.map((item: string, index: number) => <li key={index}>{item}</li>)}
                    </ul>
                  ) : null}
                  <div className="candidate-evidence">
                    {candidate.evidence.map((evidence: unknown, index: number) => (
                      <blockquote key={index}>“{(evidence as { quote?: string }).quote ?? ""}”</blockquote>
                    ))}
                  </div>
                  <div className="develop-actions">
                    <button type="button" className="button button-primary" disabled={busy !== null}
                      onClick={() => decide(candidate._id, edits[candidate._id] ? "edit-approve" : "approve")}>
                      {edits[candidate._id] ? "Edit & approve" : "Approve"}
                    </button>
                    <button type="button" className="button button-secondary" disabled={busy !== null}
                      onClick={() => decide(candidate._id, "defer")}>Defer</button>
                    <button type="button" className="button button-quiet" disabled={busy !== null}
                      onClick={() => decide(candidate._id, "reject")}>Reject</button>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="develop-card">
            <h2>3 · Approved Canon ({(canonObjects ?? []).length})</h2>
            {canonObjects === undefined ? <p>Loading approved Canon…</p> : null}
            {canonObjects !== undefined && canonObjects.length === 0 ? (
              <p className="muted">No approved Canon yet.</p>
            ) : (
              <ul className="canon-summary">
                {(canonObjects ?? []).map((object) => (
                  <li key={object._id}><strong>{object.kind}</strong> — {object.name}</li>
                ))}
              </ul>
            )}
            <div className="develop-actions">
              <button
                type="button"
                className="button button-primary"
                disabled={busy !== null || (canonObjects ?? []).length === 0}
                onClick={snapshotAndCompile}
              >
                {busy === "snapshot" ? "Compiling…" : "Snapshot & compile"}
              </button>
            </div>
          </section>

          <PersistedCompilation result={latestCompilation} />
        </>
      ) : null}
    </div>
  );
}

function PersistedCompilation({
  result,
}: {
  result: ReturnType<typeof useQuery<typeof api.compilerPersistence.getLatestCompilation>>;
}) {
  if (result === undefined) {
    return <section className="develop-card"><p>Loading latest persisted compilation…</p></section>;
  }
  if (result === null) {
    return (
      <section className="develop-card">
        <h2>4 · Compiled artifact</h2>
        <p className="muted">No authoritative compilation exists for this project yet.</p>
      </section>
    );
  }

  const { document, sections, warnings, snapshot, run } = result;
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
        Persisted authoritative compilation · {String(run?.status ?? "unknown")}
        {snapshot ? ` · snapshot ${String(snapshot.id)}` : ""}
        {` · gate ${String(document.qualityGateStatus)}`}
      </p>
      {warnings.length > 0 ? (
        <ul className="compiled-warnings">
          {warnings.map((warning, index: number) => <li key={index}>{String(warning.issue)}</li>)}
        </ul>
      ) : null}
      {typedSections.map((section) => (
        <article className="compiled-section" key={String(section._id)}>
          <h3>{String(section.title)}</h3>
          {section.generatedProse.map((block, index) => (
            <p key={index}>
              {block.label ? <strong>{block.label}: </strong> : null}
              {block.text}
              {block.inference ? <em className="inference-tag"> (inference)</em> : null}
            </p>
          ))}
          {section.sources.length > 0 ? (
            <p className="provenance">
              Sources: {section.sources.map((source) => String(source.sourceObjectKey)).join(", ")}
            </p>
          ) : null}
        </article>
      ))}
    </section>
  );
}
