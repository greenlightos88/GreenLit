import { useState } from "react";
import { compileScreenplay } from "@domain/screenplay/compile";
import { serializeFountain } from "@domain/screenplay/fountain";
import { formatHeading } from "@domain/screenplay/types";
import type { CompilationMode } from "@domain/screenplay/types";
import { validateDraft } from "@domain/screenplay/validate";
import { Icon } from "@/components/Icon";
import { fixtureSnapshot } from "@/data/fixture";
import { downloadText } from "@/export/download";

export function ScreenplayPage() {
  const [mode, setMode] = useState<CompilationMode>("preserve");
  const draft = compileScreenplay(fixtureSnapshot, { mode });
  const [activeScene, setActiveScene] = useState(0);
  const [saved, setSaved] = useState(true);
  const scene = draft.scenes[activeScene] ?? draft.scenes[0];
  const initialText = scene?.elements.map((element) => element.text).join("\n\n") ?? "";
  const [sceneCopy, setSceneCopy] = useState(initialText);
  const issues = validateDraft(draft, fixtureSnapshot);
  const selectScene = (index: number) => {
    const next = draft.scenes[index];
    setActiveScene(index);
    setSceneCopy(next?.elements.map((element) => element.text).join("\n\n") ?? "");
    setSaved(true);
  };
  return (
    <main className="screenplay-page workspace-page">
      <header className="workspace-page-header">
        <div><p className="overline">{fixtureSnapshot.meta.title}</p><h1>Screenplay</h1></div>
        <div className="workspace-page-actions">
          <label className="select-control"><span>Compilation mode</span><select value={mode} onChange={(event) => setMode(event.target.value as CompilationMode)}>{["preserve", "editorial", "development", "production-draft", "submission"].map((item) => <option value={item} key={item}>{item.replace("-", " ")}</option>)}</select></label>
          <button type="button" className="button button-secondary" onClick={() => downloadText(serializeFountain(draft), "the-salt-keepers.fountain")}><Icon name="download"/>Fountain</button>
          <button type="button" className="button button-primary" disabled={saved} onClick={() => setSaved(true)}>{saved ? "Saved" : "Save scene"}</button>
        </div>
      </header>
      <div className="screenplay-workspace">
        <aside className="scene-rail">
          <div className="rail-title"><span>Scenes</span><small>{draft.scenes.length}</small></div>
          {draft.scenes.map((item, index) => (
            <button type="button" className={index === activeScene ? "active" : ""} key={item.id} onClick={() => selectScene(index)}>
              <span>{item.number ?? String(index + 1).padStart(2, "0")}</span>
              <span><strong>{item.heading.location}</strong><small>{item.heading.prefix} · {item.heading.timeOfDay}</small></span>
              {issues.some((issue) => issue.location === item.id) ? <i/> : null}
            </button>
          ))}
        </aside>
        <section className="script-editor-area">
          <div className="editor-meta"><span>{scene ? formatHeading(scene.heading) : "No scene"}</span><span>{saved ? "Saved to draft" : "Unsaved edit"}</span></div>
          <div className="script-page">
            <p className="script-heading">{scene ? formatHeading(scene.heading) : ""}</p>
            <textarea aria-label="Scene text" value={sceneCopy} onChange={(event) => { setSceneCopy(event.target.value); setSaved(false); }} />
          </div>
        </section>
        <aside className="findings-rail">
          <div className="rail-title"><span>Script intelligence</span><small>{issues.length}</small></div>
          <div className="finding-summary"><strong>{issues.filter((issue) => issue.severity === "error").length}</strong><span>blocking</span><strong>{issues.filter((issue) => issue.severity === "warning").length}</strong><span>warnings</span></div>
          {issues.slice(0, 6).map((issue) => (
            <article key={`${issue.code}-${issue.location}`}><span className={`finding-dot ${issue.severity}`}/><div><strong>{issue.message}</strong><p>{issue.consequence}</p><button type="button" onClick={() => issue.location.startsWith("draft-scene-") ? selectScene(Number(issue.location.split("-").at(-1)) - 1) : undefined}>Review location</button></div></article>
          ))}
        </aside>
      </div>
    </main>
  );
}
