/**
 * FDX (Final Draft interchange) serializer.
 *
 * Produces well-formed FDX XML with standard paragraph types. Structural
 * validity is covered by automated tests; round-trip verification inside the
 * Final Draft application has not been performed, so exports are labeled
 * "FDX interchange" rather than "Final Draft certified" (section 60).
 */

import type { ScreenplayDraft, ScreenplayElement } from "./types";
import { formatHeading } from "./types";

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const FDX_TYPE: Record<ScreenplayElement["type"], string | null> = {
  "scene-heading": "Scene Heading",
  action: "Action",
  character: "Character",
  parenthetical: "Parenthetical",
  dialogue: "Dialogue",
  transition: "Transition",
  centered: "Action",
  section: null,
  synopsis: null,
  "page-break": null,
  note: null,
};

function paragraph(type: string, text: string, attrs = ""): string {
  return `    <Paragraph Type="${type}"${attrs}>\n      <Text>${esc(text)}</Text>\n    </Paragraph>`;
}

export function serializeFdx(draft: ScreenplayDraft): string {
  const paragraphs: string[] = [];

  const emit = (el: ScreenplayElement) => {
    const type = FDX_TYPE[el.type];
    if (!type) return;
    let text = el.text;
    if (el.type === "character") {
      text = `${el.text.toUpperCase()}${el.extension ? ` ${el.extension}` : ""}`;
    }
    if (el.type === "centered") {
      paragraphs.push(paragraph("Action", text, ' Alignment="Center"'));
      return;
    }
    paragraphs.push(paragraph(type, text));
  };

  for (const el of draft.frontMatter) emit(el);
  for (const scene of draft.scenes) {
    const numberAttr = scene.number ? ` Number="${esc(scene.number)}"` : "";
    paragraphs.push(
      paragraph("Scene Heading", formatHeading(scene.heading).toUpperCase(), numberAttr),
    );
    for (const el of scene.elements) emit(el);
  }

  const tp = draft.titlePage;
  const titleParagraphs = [
    tp.title ? paragraph("Action", tp.title, ' Alignment="Center"') : "",
    tp.credit ? paragraph("Action", tp.credit, ' Alignment="Center"') : "",
    tp.author ? paragraph("Action", tp.author, ' Alignment="Center"') : "",
    tp.contact ? paragraph("Action", tp.contact) : "",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="no"?>`,
    `<FinalDraft DocumentType="Script" Template="No" Version="5">`,
    `  <Content>`,
    paragraphs.join("\n"),
    `  </Content>`,
    `  <TitlePage>`,
    `    <Content>`,
    titleParagraphs,
    `    </Content>`,
    `  </TitlePage>`,
    `</FinalDraft>`,
    ``,
  ].join("\n");
}
