import { describe, expect, it } from "vitest";
import { measureBasis, type Vec3, type RelationEdge } from "./index";

describe("@engine/spatial measureBasis (ported from isnaad's null-model locality evaluator)", () => {
  it("scores a clustered basis as locality < 1 — related pairs land closer than chance", () => {
    // Two tight clusters far apart; edges only ever connect within a cluster.
    const positions: Vec3[] = [
      [0, 0, 0], [0.1, 0, 0], [0, 0.1, 0],
      [10, 10, 10], [10.1, 10, 10], [10, 10.1, 10],
    ];
    const edges: RelationEdge[] = [
      { a: 0, b: 1, kind: "x" }, { a: 1, b: 2, kind: "x" },
      { a: 3, b: 4, kind: "x" }, { a: 4, b: 5, kind: "x" },
    ];
    const evaluation = measureBasis(positions, edges, { sampleSize: 5000, seed: 12345 });
    expect(evaluation.locality).toBeLessThan(0.2);
    expect(evaluation.medianRelated).toBeLessThan(evaluation.medianRandom);
    expect(evaluation.nullModelSampleSize).toBeGreaterThan(0);
  });

  it("is deterministic given a fixed seed", () => {
    const positions: Vec3[] = [[0, 0, 0], [1, 0, 0], [5, 5, 5], [6, 5, 5]];
    const edges: RelationEdge[] = [{ a: 0, b: 1, kind: "x" }];
    const first = measureBasis(positions, edges, { seed: 42, sampleSize: 1000 });
    const second = measureBasis(positions, edges, { seed: 42, sampleSize: 1000 });
    expect(first).toEqual(second);
  });

  it("counts convergences only when >= threshold independent families agree locally", () => {
    // A tight pair (0,1) plus spread-out nodes so the null-model median (and
    // therefore the local radius) is large relative to the tight pair's gap.
    const positions: Vec3[] = [[0, 0, 0], [0.01, 0, 0], [10, 0, 0], [20, 0, 0], [30, 0, 0]];
    const edges: RelationEdge[] = [
      { a: 0, b: 1, kind: "root" }, { a: 0, b: 1, kind: "motif" }, { a: 0, b: 1, kind: "discovery" },
    ];
    const evaluation = measureBasis(positions, edges, { sampleSize: 2000, seed: 1, convergenceThreshold: 3 });
    expect(evaluation.convergences).toBe(2); // both endpoints of (0,1) see 3 families within radius
  });
});
