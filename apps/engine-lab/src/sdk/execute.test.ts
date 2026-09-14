import { describe, expect, it } from "vitest";
import { executeEngine } from "./execute";
import { getEngine } from "./engines";

describe("executeEngine", () => {
  it("runs canonical-chain end to end and records every step's real input/output", () => {
    const engine = getEngine("canonical-chain")!;
    const result = executeEngine(engine, engine.defaultInput, {});
    expect(result.status).toBe("success");
    expect(result.steps).toHaveLength(6);
    expect(result.steps.map((s) => s.capabilityId)).toEqual([
      "corpus.join", "relation.detectSharedSkeleton", "discovery.wrap",
      "structure.classify", "spatial.evaluateBasis", "traversal.walk",
    ]);
    for (const step of result.steps) {
      expect(step.error).toBeUndefined();
      expect(step.output).toBeDefined();
      expect(step.durationMs).toBeGreaterThanOrEqual(0);
    }
    expect(result.provenance.source).toBe("engine:canonical-chain");
    expect(result.provenance.algorithm).toBe(engine.version);
  });

  it("runs the single-capability invertibility-probe engine", () => {
    const engine = getEngine("invertibility-probe")!;
    const result = executeEngine(engine, engine.defaultInput, { transformId: "reverse" });
    expect(result.status).toBe("success");
    expect(result.steps).toHaveLength(1);
  });

  it("stops at the first failing step and reports a structured error, never a silent success", () => {
    const engine = getEngine("canonical-chain")!;
    const badConfig = { seedLocusKey: "no:such:locus" };
    const result = executeEngine(engine, engine.defaultInput, badConfig);
    expect(result.status).toBe("error");
    expect(result.error).toMatch(/traversal\.walk/);
    const failedStep = result.steps.at(-1)!;
    expect(failedStep.capabilityId).toBe("traversal.walk");
    expect(failedStep.error).toMatch(/no node with locus key/);
    // steps after the failure never ran
    expect(result.steps).toHaveLength(6);
  });

  it("is deterministic given identical input and configuration", () => {
    const engine = getEngine("canonical-chain")!;
    const a = executeEngine(engine, engine.defaultInput, { seed: 7, sampleSize: 500 });
    const b = executeEngine(engine, engine.defaultInput, { seed: 7, sampleSize: 500 });
    const strip = (r: typeof a) => r.steps.map((s) => ({ capabilityId: s.capabilityId, output: s.output, error: s.error }));
    expect(strip(a)).toEqual(strip(b));
  });
});
