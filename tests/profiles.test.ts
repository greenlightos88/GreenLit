import { describe, expect, test } from "bun:test";
import { compileDocument } from "../convex/domain/compiler/compose";
import {
  ALL_PROFILES,
  getProfile,
  productionBible,
  studioReviewPackage,
} from "../convex/domain/compiler/profiles";
import { fixtureSnapshot } from "../src/data/fixture";

/**
 * Compiler-invariant coverage for the profile registry and every profile's
 * section builders. Only 4 of 13 profiles were compiled by existing tests;
 * this sweep exercises the previously untested builders in production.ts and
 * sections.ts (producer/director/casting/department packets, one-sheet, pitch,
 * relationship/world/lore bibles) transitively and asserts each produces a
 * well-formed, provenance-bearing document rather than throwing.
 */

const NOW = Date.UTC(2026, 6, 19, 15);
const ORIGINS = new Set(["user", "generated", "source-quotation"]);

describe("profile registry", () => {
  test("getProfile resolves every registered profile id and rejects unknown ids", () => {
    for (const profile of ALL_PROFILES) {
      expect(getProfile(profile.id)).toBe(profile);
    }
    expect(getProfile("no-such-profile")).toBeUndefined();
  });

  test("registered profile ids are unique", () => {
    const ids = ALL_PROFILES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("every profile compiles over the fixture", () => {
  for (const profile of ALL_PROFILES) {
    test(`${profile.id} compiles into a well-formed document`, () => {
      const doc = compileDocument(fixtureSnapshot, profile, { now: NOW });

      expect(doc.profileId).toBe(profile.id);
      expect(Array.isArray(doc.sections)).toBe(true);
      // A profile must produce either rendered sections or explicit
      // missing-required records — never silently nothing.
      expect(doc.sections.length + doc.missingSections.length).toBeGreaterThan(0);

      // Every content block carries a valid provenance origin and a sources array.
      for (const section of doc.sections) {
        for (const block of section.blocks) {
          expect(ORIGINS.has(block.origin)).toBe(true);
          expect(Array.isArray(block.sources)).toBe(true);
        }
      }
    });
  }
});

describe("builder provenance", () => {
  test("the production bible yields at least one source-backed section", () => {
    const doc = compileDocument(fixtureSnapshot, productionBible, { now: NOW });
    expect(doc.sections.some((s) => s.sources.length > 0)).toBe(true);
  });

  test("the studio review package cites canonical source objects", () => {
    const doc = compileDocument(fixtureSnapshot, studioReviewPackage, { now: NOW });
    const allSources = doc.sections.flatMap((s) => s.sources);
    expect(allSources.length).toBeGreaterThan(0);
    // Every source resolves to a real graph object or the project meta (which
    // the overview legitimately cites) — i.e. no genuinely dangling references.
    const known = new Set(fixtureSnapshot.objects.map((o) => o.id));
    known.add(fixtureSnapshot.meta.id);
    expect(allSources.every((src) => known.has(src.objectId))).toBe(true);
  });
});
