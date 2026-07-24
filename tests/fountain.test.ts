import { describe, expect, test } from "bun:test";
import {
  parseFountain,
  parseSceneHeading,
  serializeFountain,
} from "../convex/domain/screenplay/fountain";
import { serializeFdx } from "../convex/domain/screenplay/fdx";
import type {
  ScreenplayDraft,
  ScreenplayElement,
  ScreenplayScene,
} from "../convex/domain/screenplay/types";

/**
 * Coverage for the Fountain importer/serializer and the FDX serializer.
 *
 * Assertions target the behavior documented in fountain.ts / fdx.ts and the
 * Fountain spec they implement. These are pure functions; no persistence,
 * schema, or compiler-pipeline behavior is exercised or changed.
 */

/** Flatten a parsed document's body elements (front matter + all scenes). */
function bodyElements(parsed: {
  frontMatter: ScreenplayElement[];
  scenes: ScreenplayScene[];
}): ScreenplayElement[] {
  return [...parsed.frontMatter, ...parsed.scenes.flatMap((s) => s.elements)];
}

function typesOf(elements: ScreenplayElement[]): string[] {
  return elements.map((el) => el.type);
}

describe("Fountain title page", () => {
  test("parses single-line key/value pairs and known aliases", () => {
    const parsed = parseFountain(
      "Title: The Salt Keepers\nCredit: Written by\nAuthors: Amara Okoye\nSource: Original\nDraft date: 2026-07-24\nContact: agent@example.test\nCopyright: (c) 2026\n\nEXT. LAGOON - DAWN\n\nA bell rings.\n",
    );
    expect(parsed.titlePage.title).toBe("The Salt Keepers");
    expect(parsed.titlePage.credit).toBe("Written by");
    // "Authors" is an alias for the single author field.
    expect(parsed.titlePage.author).toBe("Amara Okoye");
    expect(parsed.titlePage.source).toBe("Original");
    expect(parsed.titlePage.draftDate).toBe("2026-07-24");
    expect(parsed.titlePage.contact).toBe("agent@example.test");
    expect(parsed.titlePage.copyright).toBe("(c) 2026");
  });

  test("joins multi-line title-page values under the same key", () => {
    const parsed = parseFountain(
      "Title: The Big\n    Long Title\nAuthor: Me\n\nINT. ROOM - DAY\n\nAction.\n",
    );
    expect(parsed.titlePage.title).toBe("The Big\nLong Title");
    expect(parsed.titlePage.author).toBe("Me");
  });

  test("treats a document with no title page as pure body", () => {
    const parsed = parseFountain("INT. ROOM - DAY\n\nA lamp flickers.\n");
    expect(parsed.titlePage.title).toBeUndefined();
    expect(parsed.scenes).toHaveLength(1);
  });
});

describe("Fountain block constructs", () => {
  test("strips boneyard comments before parsing", () => {
    const parsed = parseFountain(
      "INT. ROOM - DAY\n\nVisible /* hidden note */ text.\n\n/* whole\nblock gone */\n\nMore.\n",
    );
    const text = bodyElements(parsed)
      .map((el) => el.text)
      .join(" ");
    expect(text).not.toContain("hidden note");
    expect(text).not.toContain("block gone");
    expect(text).toContain("Visible");
    expect(text).toContain("More.");
  });

  test("detects an unforced scene heading by its prefix", () => {
    const parsed = parseFountain("INT. KITCHEN - NIGHT\n\nWater drips.\n");
    expect(parsed.scenes[0]?.heading.prefix).toBe("INT");
    expect(parsed.scenes[0]?.heading.location).toBe("KITCHEN");
    expect(parsed.scenes[0]?.heading.timeOfDay).toBe("NIGHT");
  });

  test("forces a scene heading with a leading dot", () => {
    const parsed = parseFountain("INT. ROOM - DAY\n\nAction.\n\n.A HIDDEN BASEMENT\n\nMore action.\n");
    const headings = parsed.scenes.map((s) => s.heading.location);
    expect(headings).toContain("A HIDDEN BASEMENT");
  });

  test("does not mistake a double-dot line for a forced heading", () => {
    const parsed = parseFountain("INT. ROOM - DAY\n\n..ellipsis action\n");
    const first = parsed.scenes[0]?.elements[0];
    expect(first?.type).toBe("action");
  });

  test("detects a forced (>) and a natural (TO:) transition", () => {
    const parsed = parseFountain(
      "INT. ROOM - DAY\n\nAction.\n\n> BURN TO WHITE\n\nCUT TO:\n\nEXT. STREET - DAY\n\nMore.\n",
    );
    const transitions = bodyElements(parsed).filter((el) => el.type === "transition");
    const texts = transitions.map((el) => el.text);
    expect(texts).toContain("BURN TO WHITE");
    expect(texts).toContain("CUT TO:");
  });

  test("parses centered text between > and <", () => {
    const parsed = parseFountain("INT. ROOM - DAY\n\n> THE END <\n");
    const centered = bodyElements(parsed).find((el) => el.type === "centered");
    expect(centered?.text).toBe("THE END");
  });

  test("parses sections, synopses, notes, and page breaks", () => {
    const parsed = parseFountain(
      "INT. ROOM - DAY\n\n# Act One\n\n= A quiet beat before the storm.\n\n[[remember the bell]]\n\n===\n\nAction.\n",
    );
    const byType = new Map(bodyElements(parsed).map((el) => [el.type, el.text]));
    expect(byType.get("section")).toBe("Act One");
    expect(byType.get("synopsis")).toBe("A quiet beat before the storm.");
    expect(byType.get("note")?.trim()).toBe("remember the bell");
    expect(byType.has("page-break")).toBe(true);
  });

  test("treats a leading ! as forced action and strips the mark", () => {
    const parsed = parseFountain("INT. ROOM - DAY\n\n!EXT. NOT A HEADING\n");
    const el = parsed.scenes[0]?.elements[0];
    expect(el?.type).toBe("action");
    expect(el?.text).toBe("EXT. NOT A HEADING");
  });
});

describe("Fountain character cues and dialogue", () => {
  test("detects an all-caps cue followed by dialogue", () => {
    const parsed = parseFountain("INT. ROOM - DAY\n\nMARA\nNot again.\n");
    const scene = parsed.scenes[0];
    expect(typesOf(scene?.elements ?? [])).toEqual(["character", "dialogue"]);
    expect(scene?.elements[0]?.text).toBe("MARA");
  });

  test("captures a character extension and a parenthetical", () => {
    const parsed = parseFountain("INT. ROOM - DAY\n\nMARA (V.O.)\n(whispering)\nNot again.\n");
    const scene = parsed.scenes[0];
    expect(scene?.elements[0]?.type).toBe("character");
    expect(scene?.elements[0]?.text).toBe("MARA");
    expect(scene?.elements[0]?.extension).toBe("(V.O.)");
    expect(scene?.elements[1]?.type).toBe("parenthetical");
    expect(scene?.elements[2]?.type).toBe("dialogue");
  });

  test("forces a mixed-case cue with @ and marks dual dialogue with ^", () => {
    const parsed = parseFountain("INT. ROOM - DAY\n\n@McClane ^\nYippee.\n");
    const cue = parsed.scenes[0]?.elements[0];
    expect(cue?.type).toBe("character");
    expect(cue?.text).toBe("McClane");
    expect(cue?.dual).toBe(true);
  });

  test("an all-caps line with no following dialogue is action, not a cue", () => {
    const parsed = parseFountain("INT. ROOM - DAY\n\nSILENCE.\n\nAction resumes.\n");
    const types = typesOf(parsed.scenes[0]?.elements ?? []);
    expect(types).not.toContain("character");
    expect(types[0]).toBe("action");
  });
});

describe("parseSceneHeading", () => {
  test("splits prefix, location, and time of day", () => {
    expect(parseSceneHeading("INT. MAMA'S KITCHEN - NIGHT")).toEqual({
      prefix: "INT",
      location: "MAMA'S KITCHEN",
      timeOfDay: "NIGHT",
    });
  });

  test("handles INT/EXT compound prefixes", () => {
    const parsed = parseSceneHeading("INT/EXT. MOVING CAR - DAY");
    expect(parsed.prefix).toBe("INT/EXT");
    expect(parsed.location).toBe("MOVING CAR");
    expect(parsed.timeOfDay).toBe("DAY");
  });

  test("omits time of day when absent and defaults an unknown prefix to INT", () => {
    expect(parseSceneHeading("EXT. ROOFTOP")).toEqual({
      prefix: "EXT",
      location: "ROOFTOP",
    });
    expect(parseSceneHeading("SOMEWHERE STRANGE").prefix).toBe("INT");
  });
});

describe("Fountain serializer", () => {
  test("emits a title page and uppercases scene headings", () => {
    const parsed = parseFountain("Title: A Test\n\nint. room - night\n\nAction.\n");
    const out = serializeFountain(parsed);
    expect(out).toContain("Title: A Test");
    expect(out).toContain("INT. ROOM - NIGHT");
  });

  test("force-marks a mixed-case-origin cue (and normalizes case) but keeps an all-caps cue bare", () => {
    // A cue that carried lowercase in the source is emitted uppercased AND
    // prefixed with @ so it still self-detects as a cue on reparse. Exact
    // mixed-case ("Sam") is intentionally normalized to "@SAM".
    const forced = serializeFountain(parseFountain("INT. ROOM - DAY\n\n@Sam\nHey.\n"));
    expect(forced).toContain("@SAM");

    // An already-all-caps cue needs no forcing.
    const bare = serializeFountain(parseFountain("INT. ROOM - DAY\n\nMARA\nHi.\n"));
    expect(bare).toContain("\nMARA\n");
    expect(bare).not.toContain("@MARA");
  });

  test("re-emits sections, synopses, notes, page breaks, and centered text", () => {
    const source =
      "INT. ROOM - DAY\n\n# Act One\n\n= A beat.\n\n[[note text]]\n\n> CENTERED <\n\n===\n\nAction.\n";
    const out = serializeFountain(parseFountain(source));
    expect(out).toContain("# Act One");
    expect(out).toContain("= A beat.");
    expect(out).toContain("[[note text]]");
    expect(out).toContain("> CENTERED <");
    expect(out).toContain("===");
  });

  test("round-trips structure across parse -> serialize -> parse", () => {
    const source =
      "Title: Round Trip\nAuthor: QA\n\nINT. KITCHEN - NIGHT\n\nWater drips.\n\nMARA (V.O.)\n(quietly)\nNot again.\n\n> CUT TO WHITE\n\nEXT. LAGOON - DAWN\n\nA bell rings once.\n";
    const first = parseFountain(source);
    const second = parseFountain(serializeFountain(first));

    expect(second.titlePage.title).toBe("Round Trip");
    expect(second.titlePage.author).toBe("QA");
    expect(second.scenes).toHaveLength(2);
    expect(second.scenes[0]?.heading.location).toBe("KITCHEN");
    expect(second.scenes[0]?.heading.timeOfDay).toBe("NIGHT");

    const cue = second.scenes[0]?.elements.find((el) => el.type === "character");
    expect(cue?.text).toBe("MARA");
    expect(cue?.extension).toBe("(V.O.)");
    expect(second.scenes[0]?.elements.some((el) => el.type === "parenthetical")).toBe(true);
    expect(second.scenes[0]?.elements.some((el) => el.type === "dialogue")).toBe(true);
    expect(second.scenes[1]?.heading.location).toBe("LAGOON");
  });

  test("normalizes excess blank lines and ends with a single trailing newline", () => {
    const out = serializeFountain(parseFountain("INT. ROOM - DAY\n\nA.\n\n\n\nB.\n"));
    expect(out).not.toMatch(/\n{3,}/);
    expect(out.endsWith("\n")).toBe(true);
    expect(out.endsWith("\n\n")).toBe(false);
  });
});

describe("FDX serializer", () => {
  // Minimal hand-built draft so FDX mapping is exercised independently of the
  // canon compiler.
  const scene: ScreenplayScene = {
    id: "s1",
    number: "1",
    heading: { prefix: "INT", location: "ROOM", timeOfDay: "DAY" },
    elements: [
      { id: "e1", type: "action", text: "A clock stops." },
      { id: "e2", type: "character", text: "Mara", extension: "(V.O.)" },
      { id: "e3", type: "dialogue", text: "Not again." },
      { id: "e4", type: "centered", text: "THE END" },
      { id: "e5", type: "section", text: "Act One" },
      { id: "e6", type: "synopsis", text: "A beat." },
      { id: "e7", type: "note", text: "reminder" },
      { id: "e8", type: "page-break", text: "" },
    ],
  };
  const draft: ScreenplayDraft = {
    id: "d1",
    projectId: "p1",
    form: "feature",
    mode: "production-draft",
    titlePage: { title: "A Test", author: "QA & Co <x>" },
    frontMatter: [],
    scenes: [scene],
    revision: { draftLabel: "test" },
    createdAt: 0,
  };

  test("emits well-formed FDX with a numbered scene heading", () => {
    const fdx = serializeFdx(draft);
    expect(fdx).toStartWith("<?xml version=");
    expect(fdx).toContain('<FinalDraft DocumentType="Script"');
    expect(fdx).toContain('Type="Scene Heading" Number="1"');
    expect(fdx).toContain("</FinalDraft>");
  });

  test("maps a character extension and centers a centered element as Action", () => {
    const fdx = serializeFdx(draft);
    expect(fdx).toContain("MARA (V.O.)");
    expect(fdx).toContain('Type="Action" Alignment="Center"');
  });

  test("drops section, synopsis, note, and page-break paragraphs", () => {
    const fdx = serializeFdx(draft);
    expect(fdx).not.toContain("Act One");
    expect(fdx).not.toContain("A beat.");
    expect(fdx).not.toContain("reminder");
  });

  test("escapes XML-significant characters in text", () => {
    const fdx = serializeFdx(draft);
    expect(fdx).toContain("QA &amp; Co &lt;x&gt;");
    expect(fdx).not.toContain("QA & Co <x>");
  });
});
