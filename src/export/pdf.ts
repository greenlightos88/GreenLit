import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { CompiledDocument } from "@domain/compiler/types";
import { visibleBlocks } from "@domain/compiler/compose";

const PAGE = { width: 612, height: 792, margin: 58 };

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Print-safe PDF adapter with metadata, section dividers, and page numbers. */
export async function exportPdf(doc: CompiledDocument): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(doc.title);
  pdf.setSubject(`GreenlightOS ${doc.profileId}`);
  pdf.setProducer(`GreenlightOS Production Intelligence Compiler ${doc.compilerVersion}`);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - PAGE.margin;

  const ensure = (height: number) => {
    if (y - height >= PAGE.margin) return;
    page = pdf.addPage([PAGE.width, PAGE.height]);
    y = PAGE.height - PAGE.margin;
  };
  const drawLines = (text: string, size: number, isBold = false, gap = 4) => {
    const lines = wrap(text, Math.floor((PAGE.width - PAGE.margin * 2) / (size * 0.52)));
    const lineHeight = size + gap;
    ensure(lines.length * lineHeight + 8);
    for (const line of lines) {
      page.drawText(line, {
        x: PAGE.margin,
        y,
        size,
        font: isBold ? bold : regular,
        color: rgb(0.1, 0.12, 0.13),
      });
      y -= lineHeight;
    }
    y -= 6;
  };

  drawLines(doc.title, 22, true, 6);
  drawLines(
    `${doc.context.audience.toUpperCase()} · ${doc.context.confidentiality.toUpperCase()} · COMPILER ${doc.compilerVersion}`,
    8,
  );
  y -= 16;
  for (const section of doc.sections) {
    const blocks = visibleBlocks(section);
    if (blocks.length === 0) continue;
    ensure(70);
    drawLines(section.title, 14, true, 5);
    for (const block of blocks) {
      if (block.label) drawLines(block.label, 9, true, 3);
      drawLines(block.text, 10, false, 4);
    }
    y -= 8;
  }

  const pages = pdf.getPages();
  pages.forEach((item, index) => {
    item.drawText(`${index + 1} / ${pages.length}`, {
      x: PAGE.width - PAGE.margin - 30,
      y: 28,
      size: 8,
      font: regular,
      color: rgb(0.38, 0.4, 0.41),
    });
  });
  const bytes = await pdf.save();
  return Uint8Array.from(bytes).buffer;
}
