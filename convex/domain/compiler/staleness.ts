/**
 * Document staleness and impact analysis (section 58).
 *
 * Delivered documents are never mutated: analysis produces a report and a
 * refreshed copy for internal drafts; historical packages stay preserved.
 */

import type { CanonSnapshot } from "../graph/types";
import { indexSnapshot } from "../graph/types";
import { diffSnapshots, type ObjectDiff } from "../graph/canon";
import type { CompiledDocument, CompiledSection, StaleStatus } from "./types";

export interface SectionImpact {
  sectionId: string;
  sectionTitle: string;
  status: StaleStatus;
  reasons: string[];
}

export interface ImpactReport {
  documentId: string;
  documentTitle: string;
  delivered: boolean;
  sections: SectionImpact[];
  /** Highest-severity status across sections. */
  overall: StaleStatus;
}

const SEVERITY: Record<StaleStatus, number> = {
  current: 0,
  "awaiting-approval": 1,
  "potentially-stale": 2,
  "missing-required": 3,
  stale: 4,
  conflicted: 5,
};

export function analyzeSectionStaleness(
  section: CompiledSection,
  originalSnapshot: CanonSnapshot,
  currentSnapshot: CanonSnapshot,
  diffs?: ObjectDiff[],
): SectionImpact {
  const changes = diffs ?? diffSnapshots(originalSnapshot, currentSnapshot);
  const changesById = new Map(changes.map((d) => [d.objectId, d]));
  const currentById = indexSnapshot(currentSnapshot);

  const reasons: string[] = [];
  let status: StaleStatus = section.missing.length > 0 ? "missing-required" : "current";

  const bump = (next: StaleStatus, reason: string) => {
    reasons.push(reason);
    if (SEVERITY[next] > SEVERITY[status]) status = next;
  };

  for (const src of section.sources) {
    const diff = changesById.get(src.objectId);
    if (!diff) continue;
    if (diff.change === "removed" || !currentById.has(src.objectId)) {
      bump("conflicted", `Source "${diff.objectName}" no longer exists.`);
      continue;
    }
    if (diff.change === "modified") {
      const fieldChanged = src.field !== undefined && diff.changedFields.includes(src.field);
      if (fieldChanged || src.field === undefined) {
        bump(
          "stale",
          `"${diff.objectName}" changed${src.field ? ` (${src.field})` : ""}.`,
        );
      } else {
        bump("potentially-stale", `"${diff.objectName}" changed in other fields.`);
      }
    }
  }

  if (
    section.userOverride &&
    reasons.some((reason) => reason.includes("changed"))
  ) {
    // An override on stale sources needs a human decision, not silent refresh.
    bump("awaiting-approval", "Section has a user override over changed sources.");
    status = "awaiting-approval";
  }

  return {
    sectionId: section.id,
    sectionTitle: section.title,
    status,
    reasons,
  };
}

export function analyzeDocumentImpact(
  doc: CompiledDocument,
  originalSnapshot: CanonSnapshot,
  currentSnapshot: CanonSnapshot,
): ImpactReport {
  const diffs = diffSnapshots(originalSnapshot, currentSnapshot);
  const sections = doc.sections.map((s) =>
    analyzeSectionStaleness(s, originalSnapshot, currentSnapshot, diffs),
  );
  const overall = sections.reduce<StaleStatus>(
    (acc, s) => (SEVERITY[s.status] > SEVERITY[acc] ? s.status : acc),
    "current",
  );
  return {
    documentId: doc.id,
    documentTitle: doc.title,
    delivered: doc.approvalStatus === "delivered",
    sections,
    overall,
  };
}

/**
 * Apply staleness markings to an internal draft. Delivered documents are
 * returned untouched — divergence is reported, never written back.
 */
export function markStaleness(
  doc: CompiledDocument,
  report: ImpactReport,
): CompiledDocument {
  if (doc.approvalStatus === "delivered") return doc;
  const byId = new Map(report.sections.map((s) => [s.sectionId, s]));
  return {
    ...doc,
    sections: doc.sections.map((s) => {
      const impact = byId.get(s.id);
      return impact ? { ...s, staleStatus: impact.status } : s;
    }),
  };
}
