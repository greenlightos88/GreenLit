/**
 * Compilation quality gates (section 59).
 *
 * A package cannot be marked "Ready to Deliver" until gates pass or the user
 * explicitly overrides — and overrides are always recorded.
 */

import type { CanonSnapshot } from "../graph/types";
import { indexSnapshot } from "../graph/types";
import type { ScreenplayDraft } from "../screenplay/types";
import { validateDraft } from "../screenplay/validate";
import type { CompiledDocument } from "./types";
import { visibleBlocks } from "./compose";

export type GateId =
  | "canon"
  | "completeness"
  | "continuity"
  | "story"
  | "production"
  | "cultural"
  | "formatting"
  | "provenance"
  | "external-readiness"
  | "confidentiality";

export type GateStatus = "pass" | "warn" | "fail";

export interface GateResult {
  gate: GateId;
  status: GateStatus;
  findings: string[];
}

export interface GateOverride {
  gate: GateId;
  reason: string;
  overriddenBy: string;
  overriddenAt: number;
}

export interface QualityGateRun {
  documentId: string;
  ranAt: number;
  results: GateResult[];
  overrides: GateOverride[];
}

const PLACEHOLDER_RE = /\b(TBD|TODO|TK|XXX)\b|\[(PLACEHOLDER|FIXME)[^\]]*\]/i;

export function runQualityGates(
  doc: CompiledDocument,
  snapshot: CanonSnapshot,
  draft?: ScreenplayDraft,
  now: number = Date.now(),
): QualityGateRun {
  const byId = indexSnapshot(snapshot);
  const results: GateResult[] = [];
  const emptyDraft: ScreenplayDraft = draft ?? {
    id: "gate-draft",
    projectId: snapshot.projectId,
    form: "feature",
    mode: "preserve",
    titlePage: {},
    frontMatter: [],
    scenes: [],
    revision: { draftLabel: "gate" },
    createdAt: now,
  };
  const validation = validateDraft(emptyDraft, snapshot);

  // --- Canon Gate ----------------------------------------------------------
  {
    const findings: string[] = [];
    for (const section of doc.sections) {
      for (const src of section.sources) {
        const obj = byId.get(src.objectId);
        if (!obj) continue;
        if (obj.truthStatus === "archived-alternative") {
          findings.push(
            `"${section.title}" cites archived alternative "${obj.name}".`,
          );
        } else if (
          obj.truthStatus === "speculative" ||
          obj.truthStatus === "unresolved"
        ) {
          findings.push(
            `"${section.title}" relies on ${obj.truthStatus} material: "${obj.name}".`,
          );
        }
      }
    }
    results.push({
      gate: "canon",
      status: findings.some((f) => f.includes("archived"))
        ? "fail"
        : findings.length > 0
          ? "warn"
          : "pass",
      findings: dedupe(findings),
    });
  }

  // --- Completeness Gate ---------------------------------------------------
  {
    const findings = [
      ...doc.missingSections.map((s) => `Required section missing: ${s}`),
      ...doc.sections.flatMap((s) => s.missing.map((m) => `Missing information — ${m}`)),
    ];
    results.push({
      gate: "completeness",
      status:
        doc.missingSections.length > 0 ? "fail" : findings.length > 0 ? "warn" : "pass",
      findings,
    });
  }

  // --- Continuity Gate -----------------------------------------------------
  {
    const continuityCodes = new Set([
      "premature-knowledge",
      "prop-before-introduction",
      "dialogue-absent-character",
      "broken-setup-payoff",
      "duplicate-scene",
    ]);
    const findings = validation
      .filter((v) => continuityCodes.has(v.code))
      .map((v) => v.message);
    results.push({
      gate: "continuity",
      status: validation.some(
        (v) => continuityCodes.has(v.code) && v.severity === "error",
      )
        ? "fail"
        : findings.length > 0
          ? "warn"
          : "pass",
      findings,
    });
  }

  // --- Story Gate ----------------------------------------------------------
  {
    const storyCodes = new Set(["missing-scene-purpose", "incomplete-story-beat"]);
    const findings = validation
      .filter((v) => storyCodes.has(v.code))
      .map((v) => v.message);
    results.push({
      gate: "story",
      status: findings.length > 0 ? "warn" : "pass",
      findings,
    });
  }

  // --- Production Gate -----------------------------------------------------
  {
    const findings: string[] = [];
    const reqSection = doc.sections.find(
      (s) => s.sectionType === "production-requirements",
    );
    if (reqSection?.structured) {
      const requirements = reqSection.structured["requirements"] as
        | { confirmed: boolean }[]
        | undefined;
      const unconfirmed = requirements?.filter((r) => !r.confirmed).length ?? 0;
      if (unconfirmed > 0) {
        findings.push(
          `${unconfirmed} extracted production requirement(s) await human confirmation.`,
        );
      }
    }
    results.push({
      gate: "production",
      status: findings.length > 0 ? "warn" : "pass",
      findings,
    });
  }

  // --- Cultural Accuracy Gate ---------------------------------------------
  {
    const findings = validation
      .filter((v) => v.code === "cultural-accuracy")
      .map((v) => v.message);
    const culturalLaws = snapshot.objects.filter((o) => o.kind === "cultural-law");
    if (culturalLaws.length > 0) {
      findings.push(
        "Cultural accuracy is not certified automatically: material governed by " +
          `${culturalLaws.length} cultural law(s) requires human consultation.`,
      );
    }
    results.push({
      gate: "cultural",
      status: validation.some((v) => v.code === "cultural-accuracy")
        ? "fail"
        : findings.length > 0
          ? "warn"
          : "pass",
      findings,
    });
  }

  // --- Formatting Gate -----------------------------------------------------
  {
    const findings: string[] = [];
    const formatCodes = new Set([
      "scene-heading-inconsistent",
      "character-name-inconsistent",
      "time-of-day-nonstandard",
    ]);
    findings.push(
      ...validation.filter((v) => formatCodes.has(v.code)).map((v) => v.message),
    );
    for (const section of doc.sections) {
      if (!section.title) findings.push(`Untitled section (${section.sectionType}).`);
    }
    results.push({
      gate: "formatting",
      status: findings.length > 0 ? "warn" : "pass",
      findings,
    });
  }

  // --- Provenance Gate -----------------------------------------------------
  {
    const findings: string[] = [];
    for (const section of doc.sections) {
      for (const block of visibleBlocks(section)) {
        if (block.origin === "generated" && block.sources.length === 0 && !block.inference) {
          findings.push(
            `Generated claim without source or inference label in "${section.title}".`,
          );
        }
      }
    }
    results.push({
      gate: "provenance",
      status: findings.length > 0 ? "fail" : "pass",
      findings,
    });
  }

  // --- External Readiness Gate --------------------------------------------
  {
    const findings: string[] = [];
    if (doc.context.confidentiality === "external") {
      for (const section of doc.sections) {
        for (const block of visibleBlocks(section)) {
          if (PLACEHOLDER_RE.test(block.text)) {
            findings.push(`Placeholder text in "${section.title}": "${block.text.slice(0, 50)}"`);
          }
        }
      }
      if (draft) {
        const notes = draft.scenes.flatMap((s) =>
          s.elements.filter((e) => e.type === "note" || e.type === "synopsis"),
        );
        if (notes.length > 0 && draft.mode !== "development") {
          findings.push(
            `${notes.length} development annotation(s) present in the attached screenplay.`,
          );
        }
      }
    }
    results.push({
      gate: "external-readiness",
      status: findings.length > 0 ? "fail" : "pass",
      findings,
    });
  }

  // --- Confidentiality Gate ------------------------------------------------
  {
    const findings: string[] = [];
    if (doc.context.confidentiality === "external") {
      for (const section of doc.sections) {
        for (const src of section.sources) {
          const obj = byId.get(src.objectId);
          if (obj?.confidential) {
            findings.push(
              `"${section.title}" cites restricted material: "${obj.name}".`,
            );
          }
        }
      }
    }
    results.push({
      gate: "confidentiality",
      status: findings.length > 0 ? "fail" : "pass",
      findings: dedupe(findings),
    });
  }

  return { documentId: doc.id, ranAt: now, results, overrides: [] };
}

/** Record an explicit user override of a failing gate. Always recorded. */
export function overrideGate(
  run: QualityGateRun,
  gate: GateId,
  reason: string,
  overriddenBy: string,
  now: number = Date.now(),
): QualityGateRun {
  return {
    ...run,
    overrides: [...run.overrides, { gate, reason, overriddenBy, overriddenAt: now }],
  };
}

/** Ready to Deliver: every gate passes, is warn-only, or is overridden. */
export function isReadyToDeliver(run: QualityGateRun): boolean {
  const overridden = new Set(run.overrides.map((o) => o.gate));
  return run.results.every((r) => r.status !== "fail" || overridden.has(r.gate));
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}
