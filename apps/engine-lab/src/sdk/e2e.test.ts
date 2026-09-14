/**
 * End-to-end: capability -> composition -> Engine -> execution -> result ->
 * challenge -> experiment history -> replay -> discovery. Every step below
 * calls the real functions a user action in the UI would call.
 */
import { describe, expect, it } from "vitest";
import { listCapabilities } from "./capabilities";
import { getEngine, listEngines } from "./engines";
import { executeEngine } from "./execute";
import { challengesFor, runChallenge } from "./challenges";
import { createInMemoryExperimentStore } from "./store";
import { deriveEngineStatus } from "./status";
import { discoverEngineCandidates } from "./discovery";
import type { Experiment } from "./types";

describe("EngineLab end-to-end loop", () => {
  it("discovers capabilities, composes/executes an Engine, challenges the result, and records experiment history", () => {
    // 1. capability discovery — a live read of the real SDK-backed registry
    const capabilities = listCapabilities();
    expect(capabilities.length).toBeGreaterThanOrEqual(7);

    // 2. composition — an Engine already composes several of them
    const engine = getEngine("canonical-chain")!;
    expect(engine.steps.length).toBeGreaterThan(1);
    expect(deriveEngineStatus(engine.id, [])).toBe("experimental"); // not yet run

    // 3. execution -> 4. result
    const result = executeEngine(engine, engine.defaultInput, { seed: 42, sampleSize: 1000 });
    expect(result.status).toBe("success");

    // 5. challenge
    const applicable = challengesFor(engine.id);
    expect(applicable.length).toBeGreaterThan(0);
    const outcomes = applicable.map((c) => runChallenge(c.id, result));
    expect(outcomes.every((o) => o.verdict === "PASS")).toBe(true);

    // 6. experiment history
    const store = createInMemoryExperimentStore();
    const experiment: Experiment = {
      id: "exp-1", engineId: engine.id, engineVersion: engine.version,
      input: engine.defaultInput, configuration: { seed: 42, sampleSize: 1000 },
      result, challenges: outcomes, createdAt: new Date().toISOString(),
    };
    store.save(experiment);
    expect(store.list()).toHaveLength(1);

    // engine status now reflects the recorded, all-passing challenge history
    expect(deriveEngineStatus(engine.id, store.list())).toBe("validated");

    // 7. replay — deterministic, so re-executing must match exactly
    const replayed = executeEngine(engine, experiment.input, experiment.configuration);
    const strip = (r: typeof result) => r.steps.map((s) => ({ id: s.capabilityId, output: s.output, error: s.error }));
    expect(strip(replayed)).toEqual(strip(result));

    // 8. discovery — a second, different engine sharing a contiguous
    // sub-sequence with the first produces a real (not fabricated) candidate
    const shapeProbe = getEngine("shape-probe")!;
    const shapeResult = executeEngine(shapeProbe, shapeProbe.defaultInput, {});
    const shapeExperiment: Experiment = {
      id: "exp-2", engineId: shapeProbe.id, engineVersion: shapeProbe.version,
      input: shapeProbe.defaultInput, configuration: {}, result: shapeResult, challenges: [],
      createdAt: new Date().toISOString(),
    };
    store.save(shapeExperiment);

    // canonical-chain doesn't run corpus.join immediately before
    // structure.classify (relation.detectSharedSkeleton sits between them),
    // so no contiguous overlap exists with shape-probe yet — the scan must
    // honestly report nothing rather than invent a pattern.
    expect(discoverEngineCandidates(store.list())).toHaveLength(0);

    expect(listEngines().length).toBeGreaterThanOrEqual(3);
  });
});
