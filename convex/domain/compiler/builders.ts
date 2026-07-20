/**
 * Shared helpers for section builders. All builders are pure functions from
 * (snapshot, context) to compiled sections; nothing is invented — a field
 * either exists in the graph (and is cited) or is reported as missing.
 */

import type { BaseObject, SourceRef } from "../graph/types";
import type { CompiledSection, ContentBlock } from "./types";
import { nextSectionId } from "./types";

export function ref(obj: BaseObject, field?: string): SourceRef {
  return { objectId: obj.id, objectVersion: obj.version, field };
}

/**
 * Turn an established field into a labeled block with provenance.
 * Returns undefined when the field is absent — never fabricates.
 */
export function fieldBlock(
  obj: BaseObject,
  field: string,
  label: string,
): ContentBlock | undefined {
  const value = (obj as unknown as Record<string, unknown>)[field];
  if (value === undefined || value === null || value === "") return undefined;
  const text = Array.isArray(value) ? value.map(String).join("; ") : String(value);
  return {
    origin: obj.origin,
    label,
    text,
    sources: [ref(obj, field)],
    truthStatus: obj.truthStatus,
  };
}

/** Generated connective prose: always labeled, always cited, always inference. */
export function generated(text: string, sources: SourceRef[]): ContentBlock {
  return { origin: "generated", text, sources, inference: true };
}

export interface SectionInput {
  sectionType: string;
  title: string;
  blocks: (ContentBlock | undefined)[];
  structured?: Record<string, unknown>;
  missing?: string[];
}

export function section(input: SectionInput, now: number): CompiledSection {
  const blocks = input.blocks.filter((b): b is ContentBlock => b !== undefined);
  const sources = dedupeSources(blocks.flatMap((b) => b.sources));
  const missing = input.missing ?? [];
  return {
    id: nextSectionId(),
    sectionType: input.sectionType,
    title: input.title,
    blocks,
    structured: input.structured,
    sources,
    missing,
    staleStatus: missing.length > 0 ? "missing-required" : "current",
    lastCompiledAt: now,
  };
}

function dedupeSources(sources: SourceRef[]): SourceRef[] {
  const seen = new Set<string>();
  const out: SourceRef[] = [];
  for (const s of sources) {
    const key = `${s.objectId}:${s.field ?? ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(s);
    }
  }
  return out;
}

/** Collect fields as labeled blocks; report which required labels were absent. */
export function fieldBlocks(
  obj: BaseObject,
  fields: [field: string, label: string, required?: boolean][],
): { blocks: (ContentBlock | undefined)[]; missing: string[] } {
  const blocks: (ContentBlock | undefined)[] = [];
  const missing: string[] = [];
  for (const [field, label, required] of fields) {
    const block = fieldBlock(obj, field, label);
    if (!block && required) missing.push(`${obj.name}: ${label}`);
    blocks.push(block);
  }
  return { blocks, missing };
}
