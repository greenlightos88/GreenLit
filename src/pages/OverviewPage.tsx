import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Icon } from "@/components/Icon";
import { fixtureSnapshot } from "@/data/fixture";

const OrbMenu = lazy(async () => {
  const module = await import("@/components/OrbMenu");
  return { default: module.OrbMenu };
});

export function OverviewPage() {
  return (
    <main className="overview-page page-frame">
      <header className="page-heading home-heading">
        <div>
          <p className="overline">Sunday, July 19</p>
          <h1>Your project, as a living system.</h1>
          <p>Move through the intelligence orbit. Each node is a working part of the same canon.</p>
        </div>
        <Link to="/projects" className="button button-primary"><Icon name="plus"/>New project</Link>
      </header>

      <section className="home-grid">
        <motion.div className="orb-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="panel-label"><span>Project orbit</span><small>Interactive navigation</small></div>
          <Suspense fallback={<div className="orb-loading">Preparing project field…</div>}><OrbMenu /></Suspense>
        </motion.div>
        <aside className="project-brief">
          <div className="panel-label"><span>Active project</span><small>Canon 04</small></div>
          <div className="project-brief-body">
            <span className="format-label">{fixtureSnapshot.meta.format}</span>
            <h2>{fixtureSnapshot.meta.title}</h2>
            <p>{fixtureSnapshot.meta.logline}</p>
            <dl>
              <div><dt>Development</dt><dd>Story architecture</dd></div>
              <div><dt>Canon coverage</dt><dd>82%</dd></div>
              <div><dt>Open decisions</dt><dd>6</dd></div>
            </dl>
            <Link to="/projects">View project intelligence <Icon name="arrow"/></Link>
          </div>
          <div className="project-progress"><span style={{ width: "82%" }}/></div>
        </aside>
      </section>

      <section className="home-lower-grid">
        <div className="activity-panel surface-panel">
          <div className="panel-heading"><div><p className="overline">Activity</p><h2>Recent movement</h2></div><Link to="/projects">View all</Link></div>
          <div className="activity-list">
            <article><span>AO</span><p><strong>You approved “Memory is not evidence”</strong><small>Project law · The Salt Keepers</small></p><time>18 min</time></article>
            <article><span>MC</span><p><strong>Maya viewed Producer Review v3</strong><small>Delivery Room · External</small></p><time>2 hr</time></article>
            <article><span>GL</span><p><strong>Compiler flagged two continuity issues</strong><small>Screenplay · Submission draft</small></p><time>Yesterday</time></article>
          </div>
        </div>
        <div className="readiness-panel surface-panel">
          <div className="panel-heading"><div><p className="overline">Readiness</p><h2>Next useful action</h2></div><span className="status-badge status-attention">Needs review</span></div>
          <p>The screenplay is structurally complete. Resolve one knowledge conflict before compiling the producer package.</p>
          <div className="readiness-score"><strong>7.8</strong><span>/ 10</span><i style={{ width: "78%" }}/></div>
          <Link to="/screenplay" className="button button-secondary">Review screenplay findings</Link>
        </div>
      </section>
    </main>
  );
}
