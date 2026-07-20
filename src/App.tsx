import { AnimatePresence, motion } from "motion/react";
import { lazy, Suspense, useEffect, useState } from "react";
import { compileDocument, overrideSection, restoreGenerated, traceSection, visibleBlocks } from "@domain/compiler/compose";
import { runQualityGates } from "@domain/compiler/gates";
import { ALL_PROFILES, getProfile } from "@domain/compiler/profiles";
import { analyzeDocumentImpact } from "@domain/compiler/staleness";
import type { CompiledDocument, CompiledSection } from "@domain/compiler/types";
import { extractProductionRequirements } from "@domain/compiler/breakdown";
import { compileScreenplay } from "@domain/screenplay/compile";
import { serializeFdx } from "@domain/screenplay/fdx";
import { serializeFountain } from "@domain/screenplay/fountain";
import { validateDraft } from "@domain/screenplay/validate";
import { correctedFixtureSnapshot, fixtureSnapshot } from "@/data/fixture";
import { downloadBlob, downloadText } from "@/export/download";
import { exportMarkdown } from "@/export/markdown";
import { useChamberState, type InspectorTab } from "@/app/state";

const IntelligenceField = lazy(async () => {
  const module = await import("@/components/IntelligenceField");
  return { default: module.IntelligenceField };
});

const audienceOptions = [
  "internal",
  "producer",
  "studio",
  "financier",
  "director",
  "department",
  "casting",
  "festival",
  "press",
] as const;

const confidentialityOptions = ["internal", "trusted", "external"] as const;

function humanize(value: string): string {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function statusLabel(section: CompiledSection): string {
  if (section.userOverride) return "Protected edit";
  return humanize(section.staleStatus);
}

function createDocument(
  profileId: string,
  audience: (typeof audienceOptions)[number],
  confidentiality: (typeof confidentialityOptions)[number],
  previous?: CompiledDocument,
): CompiledDocument {
  const profile = getProfile(profileId) ?? ALL_PROFILES[0];
  if (!profile) throw new Error("No document profiles are registered.");
  return compileDocument(fixtureSnapshot, profile, {
    audience,
    confidentiality,
    includeProvenance: true,
    previous,
    now: Date.now(),
  });
}

function OriginChip({ origin, inference }: { origin: string; inference?: boolean }) {
  return (
    <span className={`origin-chip origin-${origin}`}>
      {origin === "user" ? "Authored" : humanize(origin)}
      {inference ? " · inference" : ""}
    </span>
  );
}

function SectionNavigator({ document }: { document: CompiledDocument }) {
  const selectedSectionId = useChamberState((state) => state.selectedSectionId);
  const selectSection = useChamberState((state) => state.selectSection);
  return (
    <nav className="section-nav" aria-label="Compiled document sections">
      <div className="rail-heading">
        <span>Document structure</span>
        <span>{document.sections.length}</span>
      </div>
      <ol>
        {document.sections.map((section, index) => (
          <li key={section.id}>
            <button
              type="button"
              className={section.id === selectedSectionId ? "active" : ""}
              onClick={() => selectSection(section.id)}
            >
              <span className="section-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="section-nav-copy">
                <strong>{section.title}</strong>
                <small className={`status-${section.staleStatus}`}>{statusLabel(section)}</small>
              </span>
              <span className="coverage-dot" data-complete={section.missing.length === 0} />
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface DocumentPageProps {
  document: CompiledDocument;
  selectedSection?: CompiledSection;
  onSelect: (sectionId: string) => void;
}

function DocumentPage({ document, selectedSection, onSelect }: DocumentPageProps) {
  const includeProvenance = useChamberState((state) => state.includeProvenance);
  return (
    <article className="document-page" aria-label={`Live preview of ${document.title}`}>
      <header className="document-cover">
        <div className="cover-mark">G / OS</div>
        <p className="eyebrow">Production intelligence</p>
        <h1>{fixtureSnapshot.meta.title}</h1>
        <p className="document-profile-title">
          {getProfile(document.profileId)?.title ?? document.profileId}
        </p>
        <div className="cover-rule" />
        <dl className="cover-meta">
          <div>
            <dt>Canon</dt>
            <dd>{fixtureSnapshot.label}</dd>
          </div>
          <div>
            <dt>Audience</dt>
            <dd>{humanize(document.context.audience)}</dd>
          </div>
          <div>
            <dt>Compiler</dt>
            <dd>Version {document.compilerVersion}</dd>
          </div>
        </dl>
      </header>

      <div className="document-body">
        {document.sections.map((section, index) => {
          const blocks = visibleBlocks(section);
          if (blocks.length === 0 && section.missing.length === 0) return null;
          return (
            <motion.section
              layout
              key={section.id}
              id={section.id}
              className={selectedSection?.id === section.id ? "selected" : ""}
              onClick={() => onSelect(section.id)}
              tabIndex={0}
              onFocus={() => onSelect(section.id)}
              aria-label={`${section.title}, select to inspect sources`}
            >
              <div className="section-kicker">{String(index + 1).padStart(2, "0")}</div>
              <h2>{section.title}</h2>
              {blocks.map((block, blockIndex) => (
                <div className="content-block" key={`${section.id}-${blockIndex}`}>
                  {block.label ? <h3>{block.label}</h3> : null}
                  <p>{block.text}</p>
                  {includeProvenance ? (
                    <OriginChip origin={block.origin} inference={block.inference} />
                  ) : null}
                </div>
              ))}
              {section.missing.length > 0 ? (
                <div className="missing-callout">
                  <strong>Information needed</strong>
                  {section.missing.join(" · ")}
                </div>
              ) : null}
            </motion.section>
          );
        })}
      </div>
    </article>
  );
}

function InspectorTabs({ active, onChange }: { active: InspectorTab; onChange: (tab: InspectorTab) => void }) {
  return (
    <div className="inspector-tabs" role="tablist" aria-label="Section inspector">
      {(["provenance", "quality", "impact"] as const).map((tab) => (
        <button
          type="button"
          role="tab"
          aria-selected={active === tab}
          key={tab}
          onClick={() => onChange(tab)}
        >
          {humanize(tab)}
        </button>
      ))}
    </div>
  );
}

interface InspectorProps {
  document: CompiledDocument;
  section?: CompiledSection;
  onEdit: (section: CompiledSection) => void;
}

function Inspector({ document, section, onEdit }: InspectorProps) {
  const inspectorTab = useChamberState((state) => state.inspectorTab);
  const setInspectorTab = useChamberState((state) => state.setInspectorTab);
  const screenplayMode = useChamberState((state) => state.screenplayMode);
  const screenplay = compileScreenplay(fixtureSnapshot, { mode: screenplayMode });
  const gateRun = runQualityGates(document, fixtureSnapshot, screenplay);
  const impact = analyzeDocumentImpact(
    document,
    fixtureSnapshot,
    correctedFixtureSnapshot(),
  );
  const trace = section
    ? traceSection(document, section.id, fixtureSnapshot)
    : undefined;
  const sourceById = new Map(fixtureSnapshot.objects.map((object) => [object.id, object]));
  const sectionImpact = section
    ? impact.sections.find((item) => item.sectionId === section.id)
    : undefined;

  return (
    <aside className="inspector" aria-label="Compilation inspector">
      <InspectorTabs active={inspectorTab} onChange={setInspectorTab} />
      <AnimatePresence mode="wait">
        <motion.div
          key={inspectorTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="inspector-content"
        >
          {inspectorTab === "provenance" ? (
            <>
              <p className="eyebrow">Selected section</p>
              <h2>{section?.title ?? "Select a section"}</h2>
              {trace ? (
                <>
                  <div className="fact-grid">
                    <div>
                      <span>Canon state</span>
                      <strong>{trace.canonical ? "Canonical" : "Mixed"}</strong>
                    </div>
                    <div>
                      <span>Source links</span>
                      <strong>{trace.sources.length}</strong>
                    </div>
                    <div>
                      <span>Inference</span>
                      <strong>{trace.containsInference ? "Labeled" : "None"}</strong>
                    </div>
                    <div>
                      <span>Override</span>
                      <strong>{section?.userOverride ? "Protected" : "None"}</strong>
                    </div>
                  </div>
                  <div className="source-list">
                    <h3>Source trail</h3>
                    {trace.sources.length === 0 ? <p>No factual sources in this section.</p> : null}
                    {trace.sources.map((source) => {
                      const object = sourceById.get(source.objectId);
                      return (
                        <div key={`${source.objectId}-${source.field ?? "object"}`}>
                          <span className="source-node" />
                          <p>
                            <strong>{object?.name ?? "Project metadata"}</strong>
                            <small>
                              {source.field ? `${humanize(source.field)} · ` : ""}v{source.objectVersion}
                            </small>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  {section ? (
                    <button className="primary-action" type="button" onClick={() => onEdit(section)}>
                      Edit selected section
                    </button>
                  ) : null}
                </>
              ) : (
                <p>Select a paragraph group to inspect authorship, truth state, and source objects.</p>
              )}
            </>
          ) : null}

          {inspectorTab === "quality" ? (
            <>
              <p className="eyebrow">Quality gates</p>
              <h2>Delivery readiness</h2>
              <div className="gate-list">
                {gateRun.results.map((result) => (
                  <div key={result.gate}>
                    <span className={`gate-icon gate-${result.status}`}>
                      {result.status === "pass" ? "✓" : result.status === "warn" ? "!" : "×"}
                    </span>
                    <p>
                      <strong>{humanize(result.gate)}</strong>
                      <small>
                        {result.findings[0] ?? "No blocking findings."}
                        {result.findings.length > 1 ? ` +${result.findings.length - 1} more` : ""}
                      </small>
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {inspectorTab === "impact" ? (
            <>
              <p className="eyebrow">Canon correction simulation</p>
              <h2>{humanize(sectionImpact?.status ?? impact.overall)}</h2>
              <p className="inspector-lede">
                Amara's age range changes from 32–36 to 35–38 in the next canon snapshot.
              </p>
              {sectionImpact?.reasons.length ? (
                <ul className="impact-list">
                  {sectionImpact.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              ) : (
                <p>This section does not depend on the corrected field.</p>
              )}
              <div className="preservation-note">
                <span>Historical protection</span>
                Delivered versions remain frozen. The change applies only to future drafts.
              </div>
            </>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}

interface EditDialogProps {
  section?: CompiledSection;
  onCancel: () => void;
  onSave: (text: string) => void;
  onRestore: () => void;
}

function EditDialog({ section, onCancel, onSave, onRestore }: EditDialogProps) {
  const [text, setText] = useState("");
  useEffect(() => {
    setText(section ? visibleBlocks(section).map((block) => block.text).join("\n\n") : "");
  }, [section]);
  if (!section) return null;
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-title"
        className="edit-dialog"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className="eyebrow">Document-level override</p>
        <h2 id="edit-title">Edit {section.title}</h2>
        <p>
          This wording is protected from regeneration. Its source links remain attached; project canon is unchanged.
        </p>
        <label htmlFor="section-editor">Section copy</label>
        <textarea id="section-editor" value={text} onChange={(event) => setText(event.target.value)} autoFocus />
        <div className="dialog-actions">
          {section.userOverride ? (
            <button type="button" className="quiet-action" onClick={onRestore}>
              Restore generated
            </button>
          ) : null}
          <span />
          <button type="button" className="quiet-action" onClick={onCancel}>Cancel</button>
          <button type="button" className="primary-action" onClick={() => onSave(text)}>Protect edit</button>
        </div>
      </motion.div>
    </div>
  );
}

function App() {
  const profileId = useChamberState((state) => state.profileId);
  const audience = useChamberState((state) => state.audience);
  const confidentiality = useChamberState((state) => state.confidentiality);
  const screenplayMode = useChamberState((state) => state.screenplayMode);
  const includeProvenance = useChamberState((state) => state.includeProvenance);
  const selectedSectionId = useChamberState((state) => state.selectedSectionId);
  const setProfile = useChamberState((state) => state.setProfile);
  const setAudience = useChamberState((state) => state.setAudience);
  const setConfidentiality = useChamberState((state) => state.setConfidentiality);
  const setScreenplayMode = useChamberState((state) => state.setScreenplayMode);
  const toggleProvenance = useChamberState((state) => state.toggleProvenance);
  const selectSection = useChamberState((state) => state.selectSection);

  const [document, setDocument] = useState(() =>
    createDocument(profileId, audience, confidentiality),
  );
  const [editing, setEditing] = useState<CompiledSection>();
  const [exporting, setExporting] = useState<string>();
  const [notice, setNotice] = useState<string>();

  useEffect(() => {
    setDocument((previous) =>
      createDocument(
        profileId,
        audience,
        confidentiality,
        previous.profileId === profileId ? previous : undefined,
      ),
    );
  }, [profileId, audience, confidentiality]);

  useEffect(() => {
    if (!selectedSectionId && document.sections[0]) {
      selectSection(document.sections[0].id);
    }
  }, [document, selectSection, selectedSectionId]);

  const selectedSection =
    document.sections.find((section) => section.id === selectedSectionId) ??
    document.sections[0];
  const screenplay = compileScreenplay(fixtureSnapshot, { mode: screenplayMode });
  const screenplayIssues = validateDraft(screenplay, fixtureSnapshot);
  const gateRun = runQualityGates(document, fixtureSnapshot, screenplay);
  const requirements = extractProductionRequirements(fixtureSnapshot);
  const completeSections = document.sections.filter((section) => section.missing.length === 0).length;
  const passedGates = gateRun.results.filter((gate) => gate.status === "pass").length;

  const saveEdit = (text: string) => {
    if (!editing) return;
    setDocument((current) =>
      overrideSection(current, editing.id, text, "Protected in Compilation Chamber"),
    );
    setEditing(undefined);
    setNotice("Document-level wording protected. Canon was not changed.");
  };

  const restoreEdit = () => {
    if (!editing) return;
    setDocument((current) => restoreGenerated(current, editing.id));
    setEditing(undefined);
    setNotice("Generated section restored.");
  };

  const withExport = async (name: string, work: () => Promise<void> | void) => {
    setExporting(name);
    try {
      await work();
      setNotice(`${name} export created from versioned source data.`);
    } finally {
      setExporting(undefined);
    }
  };

  const slug = fixtureSnapshot.meta.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div className="app-shell">
      <Suspense fallback={null}>
        <IntelligenceField />
      </Suspense>
      <header className="topbar">
        <a className="brand" href="#workspace" aria-label="GreenlightOS Compilation Chamber">
          <span className="brand-mark">G</span>
          <span>
            <strong>GreenlightOS</strong>
            <small>Production intelligence compiler</small>
          </span>
        </a>
        <div className="project-identity">
          <span className="live-pulse" />
          <span>
            <small>Living project</small>
            <strong>{fixtureSnapshot.meta.title}</strong>
          </span>
          <span className="version-pill">Canon 04</span>
        </div>
        <div className="topbar-actions">
          <span className="saved-state">All changes saved</span>
          <button type="button" className="avatar" aria-label="Open account menu">AO</button>
        </div>
      </header>

      <main id="workspace" className="workspace">
        <section className="command-bar" aria-label="Compilation controls">
          <div className="workspace-title">
            <p className="eyebrow">Workspace 06</p>
            <h1>Compilation Chamber</h1>
            <p>Living intelligence becoming deliverable form.</p>
          </div>
          <div className="selectors">
            <label>
              <span>Document profile</span>
              <select value={profileId} onChange={(event) => setProfile(event.target.value)}>
                {ALL_PROFILES.map((profile) => (
                  <option value={profile.id} key={profile.id}>{profile.title}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Intended audience</span>
              <select value={audience} onChange={(event) => setAudience(event.target.value as typeof audience)}>
                {audienceOptions.map((item) => <option value={item} key={item}>{humanize(item)}</option>)}
              </select>
            </label>
            <label>
              <span>Confidentiality</span>
              <select value={confidentiality} onChange={(event) => setConfidentiality(event.target.value as typeof confidentiality)}>
                {confidentialityOptions.map((item) => <option value={item} key={item}>{humanize(item)}</option>)}
              </select>
            </label>
            <label>
              <span>Screenplay mode</span>
              <select value={screenplayMode} onChange={(event) => setScreenplayMode(event.target.value as typeof screenplayMode)}>
                {(["preserve", "editorial", "development", "production-draft", "submission"] as const).map((item) => (
                  <option value={item} key={item}>{humanize(item)}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="command-actions">
            <button type="button" className={includeProvenance ? "toggle active" : "toggle"} onClick={toggleProvenance}>
              <span /> Provenance
            </button>
            <div className="export-cluster" aria-label="Export formats">
              <button type="button" disabled={Boolean(exporting)} onClick={() => withExport("Markdown", () => downloadText(exportMarkdown(document, { includeProvenance }), `${slug}.md`, "text/markdown;charset=utf-8"))}>MD</button>
              <button type="button" disabled={Boolean(exporting)} onClick={() => withExport("Fountain", () => downloadText(serializeFountain(screenplay), `${slug}.fountain`))}>Fountain</button>
              <button type="button" disabled={Boolean(exporting)} onClick={() => withExport("FDX interchange", () => downloadText(serializeFdx(screenplay), `${slug}.fdx`, "application/xml;charset=utf-8"))}>FDX</button>
              <button type="button" disabled={Boolean(exporting)} onClick={() => withExport("DOCX", async () => {
                const { exportDocx } = await import("@/export/docx");
                downloadBlob(await exportDocx(document), `${slug}.docx`);
              })}>DOCX</button>
              <button type="button" className="export-primary" disabled={Boolean(exporting)} onClick={() => withExport("PDF", async () => {
                const { exportPdf } = await import("@/export/pdf");
                downloadBlob(new Blob([await exportPdf(document)], { type: "application/pdf" }), `${slug}.pdf`);
              })}>
                {exporting ?? "Export PDF"}
              </button>
            </div>
          </div>
        </section>

        <section className="metrics-bar" aria-label="Compilation status">
          <div><span>Source objects</span><strong>{fixtureSnapshot.objects.length}</strong><small>linked to canon snapshot</small></div>
          <div><span>Section coverage</span><strong>{completeSections}/{document.sections.length}</strong><small>{document.missingSections.length} required missing</small></div>
          <div><span>Quality gates</span><strong>{passedGates}/{gateRun.results.length}</strong><small>{gateRun.results.filter((gate) => gate.status === "fail").length} require resolution</small></div>
          <div><span>Screenplay</span><strong>{screenplay.scenes.length} scenes</strong><small>{screenplayIssues.length} validation findings</small></div>
          <div><span>Breakdown</span><strong>{requirements.length}</strong><small>reviewable requirements</small></div>
          <div className="gpu-state"><span>Spatial field</span><strong>{"gpu" in navigator ? "WebGPU" : "WebGL"}</strong><small>graceful renderer fallback</small></div>
        </section>

        <div className="chamber-grid">
          <SectionNavigator document={document} />
          <div className="preview-stage">
            <div className="preview-toolbar">
              <span>Live page preview</span>
              <span>Fit width · reader view</span>
            </div>
            <DocumentPage document={document} selectedSection={selectedSection} onSelect={selectSection} />
          </div>
          <Inspector document={document} section={selectedSection} onEdit={setEditing} />
        </div>
      </main>

      <AnimatePresence>
        {notice ? (
          <motion.button
            type="button"
            className="notice"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            onClick={() => setNotice(undefined)}
          >
            {notice}<span>Dismiss</span>
          </motion.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {editing ? (
          <EditDialog section={editing} onCancel={() => setEditing(undefined)} onSave={saveEdit} onRestore={restoreEdit} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default App;
