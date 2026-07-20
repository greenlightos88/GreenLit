import { describe, expect, test } from "bun:test";
import {
  interpretCommand,
  type AssistantActions,
  type ExportFormat,
} from "../src/assistant/commands";

interface RecordedCalls {
  navigations: string[];
  profiles: string[];
  audiences: string[];
  confidentialities: string[];
  modes: string[];
  provenance: boolean[];
  outline: boolean[];
  inspector: boolean[];
  dense: boolean[];
  sidebar: boolean[];
  exports: ExportFormat[];
}

function makeActions(): { actions: AssistantActions; calls: RecordedCalls } {
  const calls: RecordedCalls = {
    navigations: [],
    profiles: [],
    audiences: [],
    confidentialities: [],
    modes: [],
    provenance: [],
    outline: [],
    inspector: [],
    dense: [],
    sidebar: [],
    exports: [],
  };
  const actions: AssistantActions = {
    navigate: (to) => calls.navigations.push(to),
    setProfile: (id) => calls.profiles.push(id),
    setAudience: (audience) => calls.audiences.push(audience),
    setConfidentiality: (level) => calls.confidentialities.push(level),
    setScreenplayMode: (mode) => calls.modes.push(mode),
    setProvenance: (visible) => calls.provenance.push(visible),
    setOutline: (visible) => calls.outline.push(visible),
    setInspector: (visible) => calls.inspector.push(visible),
    setDensePreview: (dense) => calls.dense.push(dense),
    setSidebarCompact: (compact) => calls.sidebar.push(compact),
    runExport: (format) => {
      calls.exports.push(format);
    },
    readChamber: () => ({
      profileId: "studio-review-package",
      audience: "producer",
      confidentiality: "external",
      screenplayMode: "submission",
    }),
  };
  return { actions, calls };
}

describe("assistant command interpreter", () => {
  test("navigates to named workspaces", async () => {
    const { actions, calls } = makeActions();
    const reply = await interpretCommand("Open the screenplay", actions);
    expect(calls.navigations).toEqual(["/screenplay"]);
    expect(reply.action).toBe("Go to Screenplay");
  });

  test("compiles a profile by alias and enters the chamber", async () => {
    const { actions, calls } = makeActions();
    const reply = await interpretCommand("Compile the producer packet", actions);
    expect(calls.profiles).toEqual(["producer-packet"]);
    expect(calls.navigations).toEqual(["/compile"]);
    expect(reply.text).toContain("Producer Packet");
  });

  test("matches the studio review package from spoken shorthand", async () => {
    const { actions, calls } = makeActions();
    await interpretCommand("Create a package for a studio review", actions);
    expect(calls.profiles).toEqual(["studio-review-package"]);
  });

  test("sets audience and confidentiality", async () => {
    const { actions, calls } = makeActions();
    await interpretCommand("Set the audience to director", actions);
    await interpretCommand("Make the confidentiality external", actions);
    expect(calls.audiences).toEqual(["director"]);
    expect(calls.confidentialities).toEqual(["external"]);
  });

  test("switches screenplay compilation modes", async () => {
    const { actions, calls } = makeActions();
    await interpretCommand("Switch the screenplay to production draft mode", actions);
    expect(calls.modes).toEqual(["production-draft"]);
  });

  test("toggles provenance on and off from phrasing", async () => {
    const { actions, calls } = makeActions();
    await interpretCommand("Show provenance", actions);
    await interpretCommand("Hide the provenance chips", actions);
    expect(calls.provenance).toEqual([true, false]);
  });

  test("dispatches exports to the requested format", async () => {
    const { actions, calls } = makeActions();
    const reply = await interpretCommand("Export the PDF", actions);
    expect(calls.exports).toEqual(["pdf"]);
    expect(reply.action).toBe("Export PDF");
    await interpretCommand("Download the fountain file", actions);
    expect(calls.exports).toEqual(["pdf", "fountain"]);
  });

  test("asks for a format when an export request is ambiguous", async () => {
    const { actions, calls } = makeActions();
    const reply = await interpretCommand("Export the document", actions);
    expect(calls.exports).toEqual([]);
    expect(reply.text).toContain("Which format");
  });

  test("answers readiness questions from the live quality gates", async () => {
    const { actions } = makeActions();
    const reply = await interpretCommand("How ready is this package?", actions);
    expect(reply.action).toBe("Readiness check");
    expect(reply.text).toMatch(/quality gates pass/);
  });

  test("declines unknown requests honestly without acting", async () => {
    const { actions, calls } = makeActions();
    const reply = await interpretCommand("Order me a pizza", actions);
    expect(reply.action).toBeUndefined();
    expect(calls.navigations).toEqual([]);
    expect(reply.text).toContain("couldn't map");
  });

  test("compacts and expands the sidebar", async () => {
    const { actions, calls } = makeActions();
    await interpretCommand("Compact the sidebar", actions);
    await interpretCommand("Expand the sidebar", actions);
    expect(calls.sidebar).toEqual([true, false]);
  });
});
