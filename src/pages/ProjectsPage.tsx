import { AnimatePresence, motion } from "motion/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { Icon } from "@/components/Icon";

function formatUpdated(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: timestamp < new Date().setFullYear(new Date().getFullYear() - 1) ? "numeric" : undefined,
  }).format(new Date(timestamp));
}

function projectInitials(title: string): string {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProjectsPage() {
  const projects = useQuery(api.projects.listProjects);
  const saveProject = useMutation(api.projects.saveProjectSnapshot);
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState("Feature screenplay");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createProject() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || creating) return;

    setCreating(true);
    setError(null);
    try {
      const result = await saveProject({
        title: trimmedTitle,
        format,
        developmentStatus: "In development",
        meta: {},
        objects: [],
      });
      navigate({ to: "/develop", search: { project: String(result.projectId) } });
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : "The project could not be created.");
      setCreating(false);
    }
  }

  const visibleProjects = (projects ?? []).filter((project) =>
    `${project.title} ${project.format ?? ""} ${project.developmentStatus ?? ""}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  return (
    <main className="page-frame projects-page">
      <header className="page-heading">
        <div>
          <p className="overline">Workspace</p>
          <h1>Projects</h1>
          <p>Every private body of work and its path into development.</p>
        </div>
        <button className="button button-primary" type="button" onClick={() => setDialogOpen(true)}>
          <Icon name="plus" />New project
        </button>
      </header>

      <section className="project-summary-row" aria-label="Project summary">
        <div><span>Projects</span><strong>{projects?.length ?? "—"}</strong></div>
        <div><span>In development</span><strong>{projects?.filter((project) => (project.developmentStatus ?? "In development") === "In development").length ?? "—"}</strong></div>
      </section>

      <div className="list-toolbar">
        <p className="muted">Open a project to continue its authoritative development workspace.</p>
        <label className="inline-search">
          <Icon name="search" />
          <input placeholder="Filter projects" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>

      {projects === undefined ? <section className="project-loading" role="status">Loading authorized projects…</section> : null}
      {error ? <section className="develop-card" role="alert"><strong>Project creation failed</strong><p>{error}</p></section> : null}

      <section className="project-card-grid">
        {visibleProjects.map((project) => (
          <article className="project-card" key={project._id}>
            <div className="project-card-cover">
              <span>{projectInitials(project.title)}</span>
              <small>{project.format ?? "Unspecified format"}</small>
            </div>
            <div className="project-card-content">
              <div className="project-card-top">
                <span className={`status-badge ${project.developmentStatus === "Delivered" ? "status-ready" : ""}`}>
                  {project.developmentStatus ?? "In development"}
                </span>
              </div>
              <h2>{project.title}</h2>
              <p>Updated {formatUpdated(project.updatedAt)}</p>
              <Link className="button button-secondary" to="/develop" search={{ project: String(project._id) }}>
                Open project <Icon name="arrow" />
              </Link>
            </div>
          </article>
        ))}

        {projects !== undefined && visibleProjects.length === 0 ? (
          <div className="empty-projects">
            <Icon name="search" />
            <strong>{projects.length === 0 ? "No projects yet" : "No matching projects"}</strong>
            <p>{projects.length === 0 ? "Create your first private project to begin development." : "Try another search."}</p>
          </div>
        ) : null}
      </section>

      <AnimatePresence>
        {dialogOpen ? (
          <motion.div className="modal-scrim" onMouseDown={() => !creating && setDialogOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="saas-modal" role="dialog" aria-modal="true" aria-labelledby="project-dialog-title" onMouseDown={(event) => event.stopPropagation()} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <div className="modal-heading">
                <div><p className="overline">Create</p><h2 id="project-dialog-title">New project</h2></div>
                <button type="button" aria-label="Close" disabled={creating} onClick={() => setDialogOpen(false)}><Icon name="close" /></button>
              </div>
              <label>Project title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Untitled project" autoFocus /></label>
              <label>Primary format<select value={format} onChange={(event) => setFormat(event.target.value)}><option>Feature screenplay</option><option>Television series</option><option>Short film</option><option>Stage play</option><option>Audio drama</option></select></label>
              <p className="form-note">Creates an owner-scoped project and routes directly into its development workspace.</p>
              <div className="modal-actions">
                <button type="button" className="button button-quiet" disabled={creating} onClick={() => setDialogOpen(false)}>Cancel</button>
                <button type="button" className="button button-primary" disabled={!title.trim() || creating} onClick={createProject}>{creating ? "Creating…" : "Create project"}</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
