/**
 * Assistant command interpreter.
 *
 * A deterministic mapping from natural phrasing to real interface actions —
 * no fabricated model responses (constitution 5.5). The interpreter is pure
 * and framework-free so it can be unit tested; the Assistant component
 * supplies the concrete actions.
 *
 * The assistant operates the interface and exports. It never touches canon:
 * canonical changes always pass through the review workflow.
 */

import { compileDocument } from "@domain/compiler/compose";
import { runQualityGates } from "@domain/compiler/gates";
import { ALL_PROFILES, getProfile } from "@domain/compiler/profiles";
import type { Audience, Confidentiality } from "@domain/compiler/types";
import { compileScreenplay } from "@domain/screenplay/compile";
import { validateDraft } from "@domain/screenplay/validate";
import { fixtureSnapshot } from "@/data/fixture";
import type { NavigationItem } from "@/app/navigation";

export type ExportFormat = "pdf" | "docx" | "markdown" | "fountain" | "fdx";

export interface AssistantActions {
  navigate: (to: NavigationItem["to"]) => void;
  setProfile: (profileId: string) => void;
  setAudience: (audience: Audience) => void;
  setConfidentiality: (confidentiality: Confidentiality) => void;
  setScreenplayMode: (
    mode: "preserve" | "editorial" | "development" | "production-draft" | "submission",
  ) => void;
  setProvenance: (visible: boolean) => void;
  setOutline: (visible: boolean) => void;
  setInspector: (visible: boolean) => void;
  setDensePreview: (dense: boolean) => void;
  setSidebarCompact: (compact: boolean) => void;
  runExport: (format: ExportFormat) => Promise<void> | void;
  readChamber: () => {
    profileId: string;
    audience: Audience;
    confidentiality: Confidentiality;
    screenplayMode:
      | "preserve"
      | "editorial"
      | "development"
      | "production-draft"
      | "submission";
  };
}

export interface AssistantReply {
  text: string;
  /** Short label of the interface action that was performed, when one was. */
  action?: string;
}

const NAVIGATION_TARGETS: { pattern: RegExp; to: NavigationItem["to"]; label: string }[] = [
  { pattern: /\b(home|overview|command deck|start)\b/, to: "/", label: "Home" },
  { pattern: /\bprojects?\b/, to: "/projects", label: "Projects" },
  { pattern: /\b(screenplay|script|scenes?|writing)\b/, to: "/screenplay", label: "Screenplay" },
  { pattern: /\b(compile|compilation|chamber|bible|package)\b/, to: "/compile", label: "Compilation Chamber" },
  { pattern: /\b(delivery|deliver|rooms?|share)\b/, to: "/delivery", label: "Delivery Rooms" },
  { pattern: /\bsettings?|preferences\b/, to: "/settings", label: "Settings" },
];

/** Aliases that map spoken shorthand onto document profiles. */
const PROFILE_ALIASES: Record<string, string[]> = {
  "studio-review-package": ["studio review", "studio package", "full package", "producer review", "review package"],
  "story-bible": ["story bible", "studio bible", "full bible"],
  "character-bible": ["character bible", "characters"],
  "relationship-bible": ["relationship bible", "relationships"],
  "world-bible": ["world bible", "world"],
  "lore-bible": ["lore bible", "lore", "mythology"],
  "production-bible": ["production bible", "production"],
  "producer-packet": ["producer packet", "producer"],
  "director-packet": ["director packet", "director"],
  "casting-packet": ["casting packet", "casting"],
  "location-packet": ["location packet", "locations"],
  "sound-packet": ["sound packet", "sound department", "sound brief"],
  "music-packet": ["music packet", "music"],
  "vfx-packet": ["vfx packet", "vfx", "effects"],
  "stunts-packet": ["stunts packet", "stunts", "safety"],
  "costume-packet": ["costume packet", "costume", "wardrobe"],
  "hair-makeup-packet": ["hair and makeup", "makeup packet", "makeup"],
  "production-design-packet": ["production design", "design packet"],
  "one-sheet": ["one sheet", "one-sheet"],
  "pitch-document": ["pitch document", "pitch"],
};

function matchProfile(input: string): { id: string; title: string } | undefined {
  let best: { id: string; title: string; score: number } | undefined;
  for (const profile of ALL_PROFILES) {
    const candidates = [profile.title.toLowerCase(), ...(PROFILE_ALIASES[profile.id] ?? [])];
    for (const candidate of candidates) {
      if (input.includes(candidate) && (best === undefined || candidate.length > best.score)) {
        best = { id: profile.id, title: profile.title, score: candidate.length };
      }
    }
  }
  return best ? { id: best.id, title: best.title } : undefined;
}

const AUDIENCES: Audience[] = [
  "internal", "producer", "studio", "financier", "director",
  "department", "casting", "festival", "press",
];
const CONFIDENTIALITY: Confidentiality[] = ["internal", "trusted", "external"];
const SCREENPLAY_MODES = [
  "preserve", "editorial", "development", "production-draft", "submission",
] as const;

const EXPORT_PATTERNS: { pattern: RegExp; format: ExportFormat; label: string }[] = [
  { pattern: /\bpdf\b/, format: "pdf", label: "PDF" },
  { pattern: /\b(docx|word|editable document)\b/, format: "docx", label: "DOCX" },
  { pattern: /\bmarkdown\b/, format: "markdown", label: "Markdown" },
  { pattern: /\bfountain\b/, format: "fountain", label: "Fountain screenplay" },
  { pattern: /\b(fdx|final draft)\b/, format: "fdx", label: "FDX interchange" },
];

export const EXAMPLE_COMMANDS = [
  "Compile the producer packet",
  "Set the audience to director",
  "Export the PDF",
  "How ready is this package?",
  "Open the screenplay",
  "Show provenance",
];

function humanize(value: string): string {
  return value.replace(/-/g, " ");
}

/** Compute an honest readiness summary from the live domain engines. */
function statusSummary(actions: AssistantActions): string {
  const chamber = actions.readChamber();
  const profile = getProfile(chamber.profileId) ?? ALL_PROFILES[0];
  if (!profile) return "No document profile is selected.";
  const document = compileDocument(fixtureSnapshot, profile, {
    audience: chamber.audience,
    confidentiality: chamber.confidentiality,
    now: Date.now(),
  });
  const screenplay = compileScreenplay(fixtureSnapshot, { mode: chamber.screenplayMode });
  const gateRun = runQualityGates(document, fixtureSnapshot, screenplay);
  const passed = gateRun.results.filter((gate) => gate.status === "pass").length;
  const failed = gateRun.results.filter((gate) => gate.status === "fail");
  const issues = validateDraft(screenplay, fixtureSnapshot);
  const parts = [
    `${profile.title}: ${passed} of ${gateRun.results.length} quality gates pass.`,
  ];
  if (failed.length > 0) {
    parts.push(
      `Needs your decision: ${failed.map((gate) => humanize(gate.gate)).join(", ")}.`,
    );
  }
  if (document.missingSections.length > 0) {
    parts.push(`Missing required sections: ${document.missingSections.join(", ")}.`);
  }
  parts.push(`Screenplay has ${issues.length} validation finding${issues.length === 1 ? "" : "s"}.`);
  return parts.join(" ");
}

export function interpretCommand(
  rawInput: string,
  actions: AssistantActions,
): AssistantReply | Promise<AssistantReply> {
  const input = rawInput.trim().toLowerCase().replace(/[.!?]+$/, "");
  if (input === "") return { text: "Say or type what you need — try one of the suggestions below." };

  // Help ---------------------------------------------------------------------
  if (/\b(help|what can you do|commands?|abilities)\b/.test(input)) {
    return {
      text:
        "I operate the interface: navigation, compilation profiles, audience and confidentiality, screenplay modes, exports, and readiness checks. Canon never changes without your review. Try: " +
        EXAMPLE_COMMANDS.slice(0, 3).map((example) => `“${example}”`).join(", ") + ".",
    };
  }

  // Status / readiness -------------------------------------------------------
  if (/\b(status|ready|readiness|health|gates?|missing|producer-ready)\b/.test(input)) {
    return { text: statusSummary(actions), action: "Readiness check" };
  }

  // Exports ------------------------------------------------------------------
  if (/\b(export|download|save as|generate)\b/.test(input)) {
    const target = EXPORT_PATTERNS.find((candidate) => candidate.pattern.test(input));
    if (target) {
      return Promise.resolve(actions.runExport(target.format)).then(() => ({
        text: `${target.label} export created from the current compilation.`,
        action: `Export ${target.label}`,
      }));
    }
    return {
      text: "Which format? I can export PDF, DOCX, Markdown, Fountain, or FDX interchange.",
    };
  }

  // Compile a profile --------------------------------------------------------
  if (/\b(compile|build|create|make|generate|prepare)\b/.test(input)) {
    const profile = matchProfile(input);
    if (profile) {
      actions.setProfile(profile.id);
      actions.navigate("/compile");
      return {
        text: `Compiling the ${profile.title} in the Compilation Chamber. Review the quality gates before delivery.`,
        action: `Compile ${profile.title}`,
      };
    }
  }

  // Audience -----------------------------------------------------------------
  const audienceMatch = input.match(/\baudience\b.*?\b(\w+)\s*$/) ?? input.match(/\bfor (an? )?(\w+) audience\b/);
  if (/\baudience\b/.test(input)) {
    const audience = AUDIENCES.find((candidate) => input.includes(candidate));
    if (audience) {
      actions.setAudience(audience);
      return { text: `Audience set to ${audience}.`, action: "Audience" };
    }
    if (audienceMatch) {
      return { text: `I can address these audiences: ${AUDIENCES.join(", ")}.` };
    }
  }

  // Confidentiality ----------------------------------------------------------
  if (/\b(confidentiality|confidential|clearance)\b/.test(input)) {
    const level = CONFIDENTIALITY.find((candidate) => input.includes(candidate));
    if (level) {
      actions.setConfidentiality(level);
      return { text: `Confidentiality set to ${level}. Restricted material is filtered accordingly.`, action: "Confidentiality" };
    }
    return { text: "Confidentiality can be internal, trusted, or external." };
  }

  // Screenplay mode ----------------------------------------------------------
  const mode = SCREENPLAY_MODES.find((candidate) =>
    input.includes(candidate.replace("-", " ")) || input.includes(candidate),
  );
  if (mode && /\b(mode|draft|screenplay|script)\b/.test(input)) {
    actions.setScreenplayMode(mode);
    return {
      text: `Screenplay compilation switched to ${humanize(mode)} mode.`,
      action: `${humanize(mode)} mode`,
    };
  }

  // Interface toggles --------------------------------------------------------
  const wantsOff = /\b(hide|close|collapse|turn off|disable|without)\b/.test(input);
  if (/\bprovenance\b/.test(input)) {
    actions.setProvenance(!wantsOff);
    return { text: wantsOff ? "Provenance chips hidden." : "Provenance shown on every block.", action: "Provenance" };
  }
  if (/\b(outline|section list|document structure)\b/.test(input)) {
    actions.setOutline(!wantsOff);
    return { text: wantsOff ? "Outline hidden." : "Outline shown.", action: "Outline" };
  }
  if (/\binspector\b/.test(input)) {
    actions.setInspector(!wantsOff);
    return { text: wantsOff ? "Inspector hidden." : "Inspector shown.", action: "Inspector" };
  }
  if (/\b(compact|dense) (preview|view|page)\b/.test(input)) {
    actions.setDensePreview(!wantsOff);
    return { text: wantsOff ? "Comfortable preview restored." : "Compact preview enabled.", action: "Preview density" };
  }
  if (/\bsidebar\b/.test(input)) {
    const compact = /\b(compact|collapse|shrink|minimi[sz]e)\b/.test(input);
    actions.setSidebarCompact(compact);
    return { text: compact ? "Sidebar compacted." : "Sidebar expanded.", action: "Sidebar" };
  }

  // Navigation ---------------------------------------------------------------
  if (/\b(open|go to|show|take me|navigate|enter|switch to)\b/.test(input)) {
    const target = NAVIGATION_TARGETS.find((candidate) => candidate.pattern.test(input));
    if (target) {
      actions.navigate(target.to);
      return { text: `Opening ${target.label}.`, action: `Go to ${target.label}` };
    }
  }

  // Bare profile name ("producer packet") ------------------------------------
  const bareProfile = matchProfile(input);
  if (bareProfile) {
    actions.setProfile(bareProfile.id);
    actions.navigate("/compile");
    return {
      text: `Opening the ${bareProfile.title} in the Compilation Chamber.`,
      action: `Compile ${bareProfile.title}`,
    };
  }

  return {
    text:
      "I couldn't map that to an interface action. I handle navigation, compilation, audiences, exports, and readiness checks — canon changes always go through your review. Try “help” for examples.",
  };
}
