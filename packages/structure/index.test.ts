import { describe, expect, it } from "vitest";
import { shapeOf, describeStructure, type Vec3 } from "./index";

describe("@engine/structure shapeOf (ported from isnaad's PCA/Jacobi classifier)", () => {
  it("classifies collinear points as a filament (linearity near 1)", () => {
    const points: Vec3[] = [[-2, 0, 0], [-1, 0, 0], [0, 0, 0], [1, 0, 0], [2, 0, 0]];
    const shape = shapeOf(points);
    expect(shape.linearity).toBeCloseTo(1, 5);
    expect(shape.planarity).toBeCloseTo(0, 5);
    expect(shape.sphericity).toBeCloseTo(0, 5);
  });

  it("classifies a symmetric planar spread as a sheet (planarity near 1)", () => {
    const points: Vec3[] = [[1, 1, 0], [1, -1, 0], [-1, 1, 0], [-1, -1, 0], [0, 0, 0]];
    const shape = shapeOf(points);
    expect(shape.sphericity).toBeCloseTo(0, 5);
    expect(shape.planarity).toBeGreaterThan(0.9);
  });

  it("classifies an isotropic point set as a ball (sphericity near 1)", () => {
    const points: Vec3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    const shape = shapeOf(points);
    expect(shape.sphericity).toBeCloseTo(1, 5);
    expect(shape.linearity).toBeCloseTo(0, 5);
  });

  it("describeStructure never omits basis/algorithm/parameters/confidence (Mission §8)", () => {
    const structure = describeStructure({
      members: ["18:9", "18:63", "72:1"],
      points: [[0, 0, 0], [1, 0, 0], [2, 0, 0]],
      basisId: "spectral",
      algorithm: "pca-jacobi",
      confidence: 0.7,
      supportingRelations: ["r1", "r2"],
    });
    expect(structure.basisId).toBe("spectral");
    expect(structure.algorithm).toBe("pca-jacobi");
    expect(structure.confidence).toBe(0.7);
    expect(structure.supportingRelations).toEqual(["r1", "r2"]);
  });
});
