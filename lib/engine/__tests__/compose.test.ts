import { describe, it, expect } from "vitest";
import {
  buildPiece, metricsOf, statsOfComposition, suggest, plausible,
  CONSTRAINT_BY_ID, type RootOption,
} from "../compose";

const R = (root: string, display = root): RootOption => ({
  root, display, glosses: [], count: 1,
});

describe("composing", () => {
  it("builds a word by applying a pattern to a root", () => {
    const p = buildPiece(R("كتب"), "patient");
    expect(p?.word).toBe("مكتوب");
    expect(buildPiece(R("كتب"), "place")?.word).toBe("مكتب");
  });

  it("rejects normalisation artefacts", () => {
    expect(plausible("االه")).toBe(false);
    expect(plausible("ككك")).toBe(false);
    expect(plausible("مكتوب")).toBe(true);
  });

  it("does not let one root fill the palette", () => {
    const roots = ["كتب", "درس", "علم", "حكم", "نظر"].map((r) => R(r));
    const s = suggest(roots, "determined", { pieces: [] }, 20);
    const counts = new Map<string, number>();
    for (const x of s) counts.set(x.root.root, (counts.get(x.root.root) ?? 0) + 1);
    for (const n of counts.values()) expect(n).toBeLessThanOrEqual(2);
  });

  it("solves backward from a target weight", () => {
    const roots = ["كتب", "درس", "علم", "حكم", "نظر", "قدر"].map((r) => R(r));
    const target = metricsOf("مكتب").weight;
    const s = suggest(roots, "weight", { pieces: [], target }, 20);
    for (const x of s) expect(x.weight).toBe(target);
  });

  it("keeps the unmoved constraint honest", () => {
    const con = CONSTRAINT_BY_ID.unmoved;
    expect(con.admits("الملك", { pieces: [] })).toBe(true);
    expect(con.admits("كتب", { pieces: [] })).toBe(false);
  });

  it("reports composition stats", () => {
    const pieces = [buildPiece(R("كتب"), "place")!, buildPiece(R("درس"), "place")!];
    const s = statsOfComposition(pieces);
    expect(s.words).toBe(2);
    expect(s.roots).toBe(2);
    expect(s.weight).toBeGreaterThan(0);
  });
});
