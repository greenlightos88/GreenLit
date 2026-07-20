import { AnimatePresence, motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { fixtureSnapshot } from "@/data/fixture";

interface ProjectCard {
  title: string;
  format: string;
  status: string;
  updated: string;
  coverage: number;
  active?: boolean;
}

const initialProjects: ProjectCard[] = [
  { title: fixtureSnapshot.meta.title, format: "Feature", status: "In development", updated: "18 minutes ago", coverage: 82, active: true },
  { title: "Quiet Meridian", format: "Limited series", status: "Research", updated: "4 days ago", coverage: 34 },
  { title: "After the Blue Hour", format: "Short film", status: "Delivered", updated: "May 28", coverage: 100 },
];

export function ProjectsPage() {
  const [projects, setProjects] = useState(initialProjects);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"All" | "Active" | "Delivered">("All");
  const [query, setQuery] = useState("");
  const [menuProject, setMenuProject] = useState<string>();
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState("Feature screenplay");
  const createProject = () => {
    if (!title.trim()) return;
    setProjects((items) => [{ title: title.trim(), format, status: "New project", updated: "Just now", coverage: 0 }, ...items]);
    setTitle("");
    setDialogOpen(false);
  };
  const visibleProjects = projects.filter((project) => {
    const matchesFilter = filter === "All" || (filter === "Active" ? project.status !== "Delivered" : project.status === "Delivered");
    return matchesFilter && `${project.title} ${project.format} ${project.status}`.toLowerCase().includes(query.toLowerCase());
  });
  return (
    <main className="page-frame projects-page">
      <header className="page-heading">
        <div><p className="overline">Workspace</p><h1>Projects</h1><p>Every body of work, its current canon, and its path to delivery.</p></div>
        <button className="button button-primary" type="button" onClick={() => setDialogOpen(true)}><Icon name="plus"/>New project</button>
      </header>
      <section className="project-summary-row">
        <div><span>Active projects</span><strong>{projects.filter((project) => project.status !== "Delivered").length}</strong></div>
        <div><span>Project objects</span><strong>142</strong></div>
        <div><span>Compiled packages</span><strong>11</strong></div>
        <div><span>Deliveries this month</span><strong>3</strong></div>
      </section>
      <div className="list-toolbar">
        <div className="filter-tabs">{(["All", "Active", "Delivered"] as const).map((item) => <button className={filter === item ? "active" : ""} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
        <label className="inline-search"><Icon name="search"/><input placeholder="Filter projects" value={query} onChange={(event) => setQuery(event.target.value)}/></label>
      </div>
      <section className="project-card-grid">
        {visibleProjects.map((project) => (
          <article className="project-card" key={project.title}>
            <div className="project-card-cover"><span>{project.title.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span><small>{project.format}</small></div>
            <div className="project-card-content">
              <div className="project-card-top"><span className={`status-badge ${project.status === "Delivered" ? "status-ready" : ""}`}>{project.status}</span><button type="button" aria-label={`More options for ${project.title}`} aria-expanded={menuProject === project.title} onClick={() => setMenuProject((current) => current === project.title ? undefined : project.title)}><Icon name="more"/></button>{menuProject === project.title ? <div className="project-card-menu"><button type="button" onClick={() => { setProjects((items) => [{ ...project, title: `${project.title} copy`, active: false, status: "New project", coverage: 0, updated: "Just now" }, ...items]); setMenuProject(undefined); }}>Duplicate</button><button type="button" onClick={() => { setProjects((items) => items.filter((item) => item.title !== project.title)); setMenuProject(undefined); }}>Remove from workspace</button></div> : null}</div>
              <h2>{project.title}</h2>
              <p>Updated {project.updated}</p>
              <div className="coverage-row"><span><i style={{ width: `${project.coverage}%` }}/></span><small>{project.coverage}% canon coverage</small></div>
              {project.active ? <Link to="/compile">Open project <Icon name="arrow"/></Link> : <button type="button" onClick={() => setProjects((items) => items.map((item) => ({ ...item, active: item.title === project.title })))}>Make active</button>}
            </div>
          </article>
        ))}
        {visibleProjects.length === 0 ? <div className="empty-projects"><Icon name="search"/><strong>No matching projects</strong><p>Try another search or filter.</p></div> : null}
      </section>
      <AnimatePresence>
        {dialogOpen ? (
          <motion.div className="modal-scrim" onMouseDown={() => setDialogOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="saas-modal" role="dialog" aria-modal="true" aria-labelledby="project-dialog-title" onMouseDown={(event) => event.stopPropagation()} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <div className="modal-heading"><div><p className="overline">Create</p><h2 id="project-dialog-title">New project</h2></div><button type="button" aria-label="Close" onClick={() => setDialogOpen(false)}><Icon name="close"/></button></div>
              <label>Project title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Untitled project" autoFocus/></label>
              <label>Primary format<select value={format} onChange={(event) => setFormat(event.target.value)}><option>Feature screenplay</option><option>Television series</option><option>Short film</option><option>Stage play</option><option>Audio drama</option></select></label>
              <p className="form-note">A private workspace and initial canon snapshot will be created. You can invite collaborators later.</p>
              <div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setDialogOpen(false)}>Cancel</button><button type="button" className="button button-primary" disabled={!title.trim()} onClick={createProject}>Create project</button></div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
