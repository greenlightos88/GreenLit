/**
 * Document composition engine (section 57) and compile workflow (section 68).
 */

import type { CanonSnapshot } from "../graph/types";
import type {
  CompileContext,
  CompiledDocument,
  CompiledSection,
  ContentBlock,
  DocumentProfile,
} from "./types";
import { COMPILER_VERSION, nextDocumentId } from "./types";

/**
 * Confidentiality and package-scoping filter, applied before any builder runs
 * so restricted material can never leak into a section.
 */
export function filterSnapshot(
  snapshot: CanonSnapshot,
  ctx: CompileContext,
): CanonSnapshot {
  const objects = snapshot.objects.filter((o) => {
    if (ctx.excludeSequelMaterial && o.sequelMaterial) return false;
    if (ctx.confidentiality === "external" && o.confidential) return false;
    return true;
  });
  return { ...snapshot, objects };
}

export interface CompileDocumentOptions extends Partial<CompileContext> {
  /** Previous compilation of the same profile; user overrides are preserved. */
  previous?: CompiledDocument;
}

export function compileDocument(
  snapshot: CanonSnapshot,
  profile: DocumentProfile,
  options: CompileDocumentOptions = {},
): CompiledDocument {
  const ctx: CompileContext = {
    audience: options.audience ?? profile.defaultAudience,
    confidentiality: options.confidentiality ?? profile.defaultConfidentiality,
    excludeEnding: options.excludeEnding,
    excludeSequelMaterial: options.excludeSequelMaterial,
    includeProvenance: options.includeProvenance,
    now: options.now ?? Date.now(),
  };
  const visible = filterSnapshot(snapshot, ctx);

  const sections: CompiledSection[] = [];
  const missingSections: string[] = [];

  for (const definition of profile.sections) {
    const built = definition.build(visible, ctx);
    const hasContent = built.some((s) => s.blocks.length > 0);
    if (definition.required && !hasContent) {
      missingSections.push(definition.title);
    }
    for (const builtSection of built) {
      const prior = options.previous?.sections.find(
        (p) =>
          p.sectionType === builtSection.sectionType && p.title === builtSection.title,
      );
      if (prior?.userOverride) {
        builtSection.userOverride = prior.userOverride;
      }
      sections.push(builtSection);
    }
  }

  return {
    id: nextDocumentId(),
    profileId: profile.id,
    title: `${snapshot.meta.title} — ${profile.title}`,
    projectId: snapshot.projectId,
    snapshotId: snapshot.id,
    context: ctx,
    sections,
    missingSections,
    approvalStatus: "draft",
    compilerVersion: COMPILER_VERSION,
    createdAt: ctx.now,
  };
}

/** The blocks a reader actually sees: user override wins over generated content. */
export function visibleBlocks(section: CompiledSection): ContentBlock[] {
  return section.userOverride ? section.userOverride.blocks : section.blocks;
}

/**
 * Document editing law (section 70): direct edits become protected overrides;
 * the generated version remains restorable.
 */
export function overrideSection(
  doc: CompiledDocument,
  sectionId: string,
  text: string,
  note?: string,
  now: number = Date.now(),
): CompiledDocument {
  return {
    ...doc,
    sections: doc.sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            userOverride: {
              blocks: [
                { origin: "user" as const, text, sources: s.sources },
              ],
              overriddenAt: now,
              note,
            },
          }
        : s,
    ),
  };
}

/** Restore the generated version of an overridden section. */
export function restoreGenerated(
  doc: CompiledDocument,
  sectionId: string,
): CompiledDocument {
  return {
    ...doc,
    sections: doc.sections.map((s) =>
      s.id === sectionId ? { ...s, userOverride: undefined } : s,
    ),
  };
}

/** Provenance query (section 56): where did this section come from? */
export interface ProvenanceAnswer {
  sectionTitle: string;
  origins: { origin: string; count: number }[];
  canonical: boolean;
  sources: { objectId: string; objectVersion: number; field?: string }[];
  containsInference: boolean;
  userAuthoredShare: number;
}

export function traceSection(
  doc: CompiledDocument,
  sectionId: string,
  snapshot: CanonSnapshot,
): ProvenanceAnswer | undefined {
  const sectionToTrace = doc.sections.find((s) => s.id === sectionId);
  if (!sectionToTrace) return undefined;
  const blocks = visibleBlocks(sectionToTrace);
  const originCounts = new Map<string, number>();
  for (const b of blocks) {
    originCounts.set(b.origin, (originCounts.get(b.origin) ?? 0) + 1);
  }
  const objectsById = new Map(snapshot.objects.map((o) => [o.id, o]));
  const allCanonical =
    blocks.length > 0 &&
    sectionToTrace.sources.every((src) => {
      const obj = objectsById.get(src.objectId);
      return obj === undefined || obj.truthStatus === "canonical";
    });
  const userBlocks = blocks.filter((b) => b.origin === "user").length;
  return {
    sectionTitle: sectionToTrace.title,
    origins: [...originCounts.entries()].map(([origin, count]) => ({ origin, count })),
    canonical: allCanonical,
    sources: sectionToTrace.sources,
    containsInference: blocks.some((b) => b.inference === true),
    userAuthoredShare: blocks.length === 0 ? 0 : userBlocks / blocks.length,
  };
}
