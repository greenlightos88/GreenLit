/**
 * The corner assistant: a floating launcher that opens a voice- and
 * text-driven control surface over the whole application.
 *
 * Replies come from the deterministic command interpreter in commands.ts —
 * real interface actions, honestly labeled. Voice input/output are
 * progressive enhancements over the always-available text path.
 */

import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { compileDocument } from "@domain/compiler/compose";
import { ALL_PROFILES, getProfile } from "@domain/compiler/profiles";
import { compileScreenplay } from "@domain/screenplay/compile";
import { serializeFdx } from "@domain/screenplay/fdx";
import { serializeFountain } from "@domain/screenplay/fountain";
import { useChamberState } from "@/app/state";
import { useShellState } from "@/app/shellState";
import { Icon } from "@/components/Icon";
import { fixtureSnapshot } from "@/data/fixture";
import { downloadBlob, downloadText } from "@/export/download";
import { exportMarkdown } from "@/export/markdown";
import {
  EXAMPLE_COMMANDS,
  interpretCommand,
  type AssistantActions,
  type ExportFormat,
} from "./commands";
import { useAssistantState } from "./assistantState";
import { isVoiceInputAvailable, speak, startListening, stopSpeaking } from "./speech";

function currentSlug(): string {
  return fixtureSnapshot.meta.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

async function performExport(format: ExportFormat): Promise<void> {
  const chamber = useChamberState.getState();
  const slug = currentSlug();
  if (format === "fountain" || format === "fdx") {
    const screenplay = compileScreenplay(fixtureSnapshot, { mode: chamber.screenplayMode });
    if (format === "fountain") {
      downloadText(serializeFountain(screenplay), `${slug}.fountain`);
    } else {
      downloadText(serializeFdx(screenplay), `${slug}.fdx`, "application/xml;charset=utf-8");
    }
    return;
  }
  const profile = getProfile(chamber.profileId) ?? ALL_PROFILES[0];
  if (!profile) throw new Error("No document profile is registered.");
  const document = compileDocument(fixtureSnapshot, profile, {
    audience: chamber.audience,
    confidentiality: chamber.confidentiality,
    includeProvenance: chamber.includeProvenance,
    now: Date.now(),
  });
  if (format === "markdown") {
    downloadText(
      exportMarkdown(document, { includeProvenance: chamber.includeProvenance }),
      `${slug}.md`,
      "text/markdown;charset=utf-8",
    );
  } else if (format === "pdf") {
    const { exportPdf } = await import("@/export/pdf");
    downloadBlob(new Blob([await exportPdf(document)], { type: "application/pdf" }), `${slug}.pdf`);
  } else {
    const { exportDocx } = await import("@/export/docx");
    downloadBlob(await exportDocx(document), `${slug}.docx`);
  }
}

export function Assistant() {
  const navigate = useNavigate();
  const open = useAssistantState((state) => state.open);
  const setOpen = useAssistantState((state) => state.setOpen);
  const entries = useAssistantState((state) => state.entries);
  const addEntry = useAssistantState((state) => state.addEntry);
  const clearTranscript = useAssistantState((state) => state.clearTranscript);
  const speakReplies = useAssistantState((state) => state.speakReplies);
  const toggleSpeakReplies = useAssistantState((state) => state.toggleSpeakReplies);

  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const stopRef = useRef<() => void>(() => {});
  const inputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const voiceAvailable = isVoiceInputAvailable();

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else {
      stopRef.current();
      setListening(false);
      stopSpeaking();
    }
  }, [open]);

  useEffect(() => {
    const node = transcriptRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [entries]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  const actions: AssistantActions = {
    navigate: (to) => void navigate({ to }),
    setProfile: (profileId) => useChamberState.getState().setProfile(profileId),
    setAudience: (audience) => useChamberState.getState().setAudience(audience),
    setConfidentiality: (confidentiality) =>
      useChamberState.getState().setConfidentiality(confidentiality),
    setScreenplayMode: (mode) => useChamberState.getState().setScreenplayMode(mode),
    setProvenance: (visible) => {
      const state = useChamberState.getState();
      if (state.includeProvenance !== visible) state.toggleProvenance();
    },
    setOutline: (visible) => {
      const state = useChamberState.getState();
      if (state.outlineOpen !== visible) state.toggleOutline();
    },
    setInspector: (visible) => {
      const state = useChamberState.getState();
      if (state.inspectorOpen !== visible) state.toggleInspector();
    },
    setDensePreview: (dense) => {
      const state = useChamberState.getState();
      if (state.densePreview !== dense) state.toggleDensePreview();
    },
    setSidebarCompact: (compact) => useShellState.getState().setSidebarCompact(compact),
    runExport: performExport,
    readChamber: () => {
      const state = useChamberState.getState();
      return {
        profileId: state.profileId,
        audience: state.audience,
        confidentiality: state.confidentiality,
        screenplayMode: state.screenplayMode,
      };
    },
  };

  const submit = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setDraft("");
    addEntry({ role: "user", text });
    setBusy(true);
    try {
      const reply = await interpretCommand(text, actions);
      addEntry({ role: "assistant", text: reply.text, action: reply.action });
      if (speakReplies) speak(reply.text);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The action failed for an unknown reason.";
      addEntry({ role: "assistant", text: `That failed: ${message}` });
    } finally {
      setBusy(false);
    }
  };

  const toggleListening = () => {
    if (listening) {
      stopRef.current();
      setListening(false);
      return;
    }
    setListening(true);
    stopRef.current = startListening({
      onInterim: (text) => setDraft(text),
      onFinal: (text) => {
        setDraft("");
        void submit(text);
      },
      onEnd: () => setListening(false),
      onError: (message) => addEntry({ role: "assistant", text: message }),
    });
  };

  return (
    <>
      <button
        type="button"
        className={`assistant-launcher${open ? " open" : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(!open)}
      >
        <span className="assistant-orb" aria-hidden="true">
          <Icon name="assistant" />
        </span>
        <span>Assistant</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.section
            role="dialog"
            aria-label="GreenlightOS assistant"
            className="assistant-panel"
            initial={{ opacity: 0, y: 14, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <header className="assistant-head">
              <div>
                <strong>Assistant</strong>
                <small>Interface control · deterministic interpreter</small>
              </div>
              <div className="assistant-head-actions">
                <button
                  type="button"
                  className={speakReplies ? "active" : ""}
                  aria-pressed={speakReplies}
                  onClick={() => {
                    if (speakReplies) stopSpeaking();
                    toggleSpeakReplies();
                  }}
                >
                  Speak replies
                </button>
                <button type="button" onClick={clearTranscript}>Clear</button>
                <button type="button" aria-label="Close assistant" onClick={() => setOpen(false)}>
                  <Icon name="close" />
                </button>
              </div>
            </header>

            <div className="assistant-transcript" ref={transcriptRef} aria-live="polite">
              {entries.map((entry) => (
                <div key={entry.id} className={`assistant-entry ${entry.role}`}>
                  {entry.action ? <span className="assistant-action">{entry.action}</span> : null}
                  <p>{entry.text}</p>
                </div>
              ))}
              {busy ? <div className="assistant-entry assistant working"><p>Working…</p></div> : null}
            </div>

            <div className="assistant-suggestions" aria-label="Example commands">
              {EXAMPLE_COMMANDS.slice(0, 4).map((example) => (
                <button type="button" key={example} onClick={() => void submit(example)}>
                  {example}
                </button>
              ))}
            </div>

            <form
              className="assistant-input"
              onSubmit={(event) => {
                event.preventDefault();
                void submit(draft);
              }}
            >
              <input
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={listening ? "Listening…" : "Ask, or tell me what to change"}
                aria-label="Assistant command"
              />
              {voiceAvailable ? (
                <button
                  type="button"
                  className={`assistant-mic${listening ? " listening" : ""}`}
                  aria-label={listening ? "Stop listening" : "Speak to your assistant"}
                  aria-pressed={listening}
                  onClick={toggleListening}
                >
                  <Icon name="mic" />
                </button>
              ) : null}
              <button type="submit" className="assistant-send" aria-label="Send command" disabled={busy}>
                <Icon name="send" />
              </button>
            </form>
            <p className="assistant-footnote">
              The assistant operates the interface and exports. Canonical story changes always
              go through your review.
            </p>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </>
  );
}
