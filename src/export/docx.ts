import {
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  TextRun,
} from "docx";
import type { CompiledDocument } from "@domain/compiler/types";
import { visibleBlocks } from "@domain/compiler/compose";

/** Editable DOCX adapter using semantic headings and paragraph styles. */
export async function exportDocx(doc: CompiledDocument): Promise<Blob> {
  const children: Paragraph[] = [
    new Paragraph({ text: doc.title, heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${doc.context.audience.toUpperCase()} · ${doc.context.confidentiality.toUpperCase()} · COMPILER ${doc.compilerVersion}`,
          italics: true,
          color: "5D6763",
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  for (const section of doc.sections) {
    const blocks = visibleBlocks(section);
    if (blocks.length === 0) continue;
    children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }));
    for (const block of blocks) {
      children.push(
        new Paragraph({
          children: [
            ...(block.label
              ? [new TextRun({ text: `${block.label}. `, bold: true })]
              : []),
            new TextRun(block.text),
          ],
          spacing: { after: 180 },
        }),
      );
    }
  }

  const output = new Document({
    creator: "GreenlightOS",
    title: doc.title,
    description: `Compiled with Production Intelligence Compiler ${doc.compilerVersion}`,
    sections: [
      {
        properties: {},
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: "center",
                children: [
                  new TextRun("GreenlightOS · "),
                  new TextRun({ children: [PageNumber.CURRENT] }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
  return Packer.toBlob(output);
}
