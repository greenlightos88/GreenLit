/**
 * Markdown, HTML, plain-text, and JSON export adapters (section 60).
 * All adapters read visible blocks (user overrides win) and can optionally
 * include provenance annotations for internal review copies.
 */

import type { CompiledDocument } from "@domain/compiler/types";
import { visibleBlocks } from "@domain/compiler/compose";

export interface TextExportOptions {
  includeProvenance?: boolean;
}

export function exportMarkdown(
  doc: CompiledDocument,
  options: TextExportOptions = {},
): string {
  const lines: string[] = [`# ${doc.title}`, ""];
  lines.push(
    `> Compiled ${new Date(doc.createdAt).toISOString().slice(0, 10)} · audience: ${doc.context.audience} · compiler v${doc.compilerVersion}`,
    "",
  );
  for (const section of doc.sections) {
    const blocks = visibleBlocks(section);
    if (blocks.length === 0 && section.missing.length === 0) continue;
    lines.push(`## ${section.title}`, "");
    for (const block of blocks) {
      const label = block.label ? `**${block.label}.** ` : "";
      const provenance =
        options.includeProvenance && block.origin !== "user"
          ? ` _[${block.origin}${block.inference ? ", inference" : ""}]_`
          : "";
      lines.push(`${label}${block.text}${provenance}`, "");
    }
    if (options.includeProvenance) {
      for (const m of section.missing) lines.push(`- ⚠ Missing: ${m}`);
      if (section.missing.length > 0) lines.push("");
    }
  }
  return lines.join("\n");
}

export function exportPlainText(
  doc: CompiledDocument,
  options: TextExportOptions = {},
): string {
  return exportMarkdown(doc, options)
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/_(.+?)_/g, "$1");
}

export function exportHtml(doc: CompiledDocument, options: TextExportOptions = {}): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const toc = doc.sections
    .filter((s) => visibleBlocks(s).length > 0)
    .map((s) => `<li><a href="#${s.id}">${esc(s.title)}</a></li>`)
    .join("\n");
  const body = doc.sections
    .map((section) => {
      const blocks = visibleBlocks(section);
      if (blocks.length === 0) return "";
      const content = blocks
        .map((b) => {
          const label = b.label ? `<strong>${esc(b.label)}.</strong> ` : "";
          const provenance =
            options.includeProvenance && b.origin !== "user"
              ? ` <em class="provenance">[${b.origin}]</em>`
              : "";
          return `<p>${label}${esc(b.text)}${provenance}</p>`;
        })
        .join("\n");
      return `<section id="${section.id}"><h2>${esc(section.title)}</h2>\n${content}</section>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(doc.title)}</title>
<style>
  body { font-family: Georgia, serif; max-width: 46rem; margin: 3rem auto; line-height: 1.6; color: #1a1a1a; padding: 0 1rem; }
  h1 { font-size: 1.8rem; } h2 { margin-top: 2.5rem; border-bottom: 1px solid #ddd; padding-bottom: .3rem; }
  nav ol { columns: 2; } .provenance { color: #888; font-size: .85em; }
</style>
</head>
<body>
<h1>${esc(doc.title)}</h1>
<nav aria-label="Table of contents"><ol>${toc}</ol></nav>
${body}
</body>
</html>`;
}

/** Structured JSON export: the full composed document, provenance included. */
export function exportJson(doc: CompiledDocument): string {
  return JSON.stringify(doc, null, 2);
}
