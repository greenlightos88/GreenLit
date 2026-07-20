/**
 * Fountain parser and serializer.
 *
 * Implements the core of the Fountain spec (fountain.io): title pages, scene
 * headings (detected and "."-forced), character cues ("@"-forced, extensions,
 * "^" dual dialogue), parentheticals, dialogue, transitions (">"-forced and
 * "TO:"-detected), centered text, sections, synopses, notes, boneyards, and
 * page breaks. Inline emphasis markup is preserved verbatim.
 */

import type {
  ScreenplayElement,
  ScreenplayScene,
  SceneHeadingParts,
  TitlePage,
} from "./types";
import { makeElement, formatHeading } from "./types";

const SCENE_PREFIX = /^(INT\.?\/EXT|EXT\.?\/INT|INT|EXT|EST|I\/E)[.\s]/i;
const TRANSITION_RE = /^[A-Z0-9 .']+TO:$/;
const CHARACTER_RE = /^[^a-z]+(\(.*\))?(\s*\^)?$/;

export interface ParsedFountain {
  titlePage: TitlePage;
  frontMatter: ScreenplayElement[];
  scenes: ScreenplayScene[];
}

const TITLE_KEYS: Record<string, keyof TitlePage> = {
  title: "title",
  credit: "credit",
  author: "author",
  authors: "author",
  source: "source",
  "draft date": "draftDate",
  contact: "contact",
  notes: "notes",
  copyright: "copyright",
};

export function parseFountain(input: string): ParsedFountain {
  // Strip boneyards (/* ... */) globally; they are never rendered.
  const text = input.replace(/\/\*[\s\S]*?\*\//g, "");
  const lines = text.replace(/\r\n?/g, "\n").split("\n");

  const titlePage: TitlePage = {};
  let i = 0;

  // Title page: key: value pairs before the first blank-line break.
  if (lines[0] && /^[A-Za-z ]+:/.test(lines[0])) {
    let currentKey: keyof TitlePage | undefined;
    while (i < lines.length) {
      const line = lines[i] ?? "";
      if (line.trim() === "") {
        i += 1;
        break;
      }
      const kv = line.match(/^([A-Za-z ]+):\s*(.*)$/);
      if (kv) {
        const key = TITLE_KEYS[(kv[1] ?? "").trim().toLowerCase()];
        currentKey = key;
        if (key && kv[2]) titlePage[key] = kv[2].trim();
      } else if (currentKey && line.trim() !== "") {
        titlePage[currentKey] = [titlePage[currentKey], line.trim()]
          .filter(Boolean)
          .join("\n");
      }
      i += 1;
    }
  }

  const elements: ScreenplayElement[] = [];
  const body = lines.slice(i);

  for (let j = 0; j < body.length; j++) {
    const raw = body[j] ?? "";
    const line = raw.trim();
    const prevBlank = j === 0 || (body[j - 1] ?? "").trim() === "";
    const nextLine = (body[j + 1] ?? "").trim();

    if (line === "") continue;

    if (line === "===") {
      elements.push(makeElement("page-break", ""));
      continue;
    }
    if (line.startsWith("#")) {
      elements.push(makeElement("section", line.replace(/^#+\s*/, "")));
      continue;
    }
    if (line.startsWith("=")) {
      elements.push(makeElement("synopsis", line.replace(/^=\s*/, "")));
      continue;
    }
    const noteMatch = line.match(/^\[\[([\s\S]*)\]\]$/);
    if (noteMatch) {
      elements.push(makeElement("note", noteMatch[1] ?? ""));
      continue;
    }
    if (line.startsWith(">") && line.endsWith("<")) {
      elements.push(makeElement("centered", line.slice(1, -1).trim()));
      continue;
    }
    if (line.startsWith(">")) {
      elements.push(makeElement("transition", line.slice(1).trim()));
      continue;
    }
    if (line.startsWith(".") && !line.startsWith("..")) {
      elements.push(makeElement("scene-heading", line.slice(1).trim()));
      continue;
    }
    if (prevBlank && SCENE_PREFIX.test(line)) {
      elements.push(makeElement("scene-heading", line));
      continue;
    }
    if (prevBlank && TRANSITION_RE.test(line)) {
      elements.push(makeElement("transition", line));
      continue;
    }
    // Character cue: forced with @, or an all-caps line with dialogue below.
    const forcedCue = line.startsWith("@");
    if (
      (forcedCue || (prevBlank && CHARACTER_RE.test(line) && /[A-Z]/.test(line))) &&
      nextLine !== ""
    ) {
      const cueText = forcedCue ? line.slice(1) : line;
      const dual = /\^\s*$/.test(cueText);
      const clean = cueText.replace(/\^\s*$/, "").trim();
      const extMatch = clean.match(/^(.*?)\s*(\([^)]*\))$/);
      const cue = makeElement("character", extMatch ? (extMatch[1] ?? "").trim() : clean, {
        extension: extMatch ? extMatch[2] : undefined,
        dual: dual || undefined,
      });
      elements.push(cue);
      // Consume the dialogue block.
      let k = j + 1;
      while (k < body.length && (body[k] ?? "").trim() !== "") {
        const dLine = (body[k] ?? "").trim();
        if (/^\(.*\)$/.test(dLine)) {
          elements.push(makeElement("parenthetical", dLine));
        } else {
          elements.push(makeElement("dialogue", dLine, { dual: dual || undefined }));
        }
        k += 1;
      }
      j = k - 1;
      continue;
    }

    elements.push(makeElement("action", raw.replace(/^!/, "")));
  }

  return groupIntoScenes(titlePage, elements);
}

export function parseSceneHeading(text: string): SceneHeadingParts {
  const m = text.match(/^(INT\.?\/EXT|EXT\.?\/INT|INT|EXT|EST|I\/E)\.?\s+(.*)$/i);
  const rest = m ? (m[2] ?? "") : text;
  const prefix = m ? (m[1] ?? "").toUpperCase().replace(/\.$/, "") : "INT";
  const dashIdx = rest.lastIndexOf(" - ");
  if (dashIdx >= 0) {
    return {
      prefix,
      location: rest.slice(0, dashIdx).trim().toUpperCase(),
      timeOfDay: rest.slice(dashIdx + 3).trim().toUpperCase(),
    };
  }
  return { prefix, location: rest.trim().toUpperCase() };
}

let sceneCounter = 0;

function groupIntoScenes(
  titlePage: TitlePage,
  elements: ScreenplayElement[],
): ParsedFountain {
  const frontMatter: ScreenplayElement[] = [];
  const scenes: ScreenplayScene[] = [];
  let current: ScreenplayScene | undefined;

  for (const el of elements) {
    if (el.type === "scene-heading") {
      sceneCounter += 1;
      current = {
        id: `scene-${sceneCounter}`,
        heading: parseSceneHeading(el.text),
        elements: [],
      };
      scenes.push(current);
    } else if (current) {
      current.elements.push(el);
    } else {
      frontMatter.push(el);
    }
  }
  return { titlePage, frontMatter, scenes };
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

export function serializeFountain(parsed: ParsedFountain): string {
  const out: string[] = [];

  const tp = parsed.titlePage;
  const titleLines: string[] = [];
  const push = (label: string, value?: string) => {
    if (value) titleLines.push(`${label}: ${value.replace(/\n/g, "\n    ")}`);
  };
  push("Title", tp.title);
  push("Credit", tp.credit);
  push("Author", tp.author);
  push("Source", tp.source);
  push("Draft date", tp.draftDate);
  push("Contact", tp.contact);
  push("Copyright", tp.copyright);
  if (titleLines.length > 0) {
    out.push(titleLines.join("\n"), "");
  }

  const emit = (el: ScreenplayElement) => {
    switch (el.type) {
      case "scene-heading":
        out.push(el.text.toUpperCase(), "");
        break;
      case "action":
        out.push(el.text, "");
        break;
      case "character": {
        const cue = `${el.text.toUpperCase()}${el.extension ? ` ${el.extension}` : ""}${el.dual ? " ^" : ""}`;
        // Force with @ when the cue would not self-detect as all-caps.
        out.push(/[a-z]/.test(el.text) ? `@${cue}` : cue);
        break;
      }
      case "parenthetical":
        out.push(el.text);
        break;
      case "dialogue":
        out.push(el.text);
        break;
      case "transition":
        out.push(TRANSITION_RE.test(el.text) ? el.text : `> ${el.text}`, "");
        break;
      case "centered":
        out.push(`> ${el.text} <`, "");
        break;
      case "section":
        out.push(`# ${el.text}`, "");
        break;
      case "synopsis":
        out.push(`= ${el.text}`, "");
        break;
      case "page-break":
        out.push("===", "");
        break;
      case "note":
        out.push(`[[${el.text}]]`, "");
        break;
    }
  };

  for (const el of parsed.frontMatter) emit(el);
  for (const scene of parsed.scenes) {
    const headingText = formatHeading(scene.heading);
    out.push(scene.number ? `${headingText} #${scene.number}#` : headingText, "");
    let inDialogue = false;
    for (const el of scene.elements) {
      const isDialogueEl =
        el.type === "character" || el.type === "dialogue" || el.type === "parenthetical";
      if (inDialogue && !isDialogueEl) out.push("");
      emit(el);
      if (el.type === "character") inDialogue = true;
      if (inDialogue && !isDialogueEl) inDialogue = false;
    }
    if (inDialogue) out.push("");
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}
