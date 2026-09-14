/**
 * Two end-to-end loops, both driving real functions a UI action would call.
 *
 * The first proves the original loop still holds: capability -> composition
 * -> Engine -> execution -> result -> challenge -> experiment history ->
 * replay -> discovery, using a curated Engine.
 *
 * The second is this milestone's critical test (Step 12): capability -> USER
 * composition (via sdk/composer.ts, exactly as the Composer UI calls it) ->
 * Engine definition -> execution -> provenance -> result -> challenge ->
 * persisted Engine (versioned, via customEngineStore) -> replay. Nothing here
 * uses a pre-defined curated Engine — the whole chain is built from scratch
 * out of capabilities, proving composition is genuinely user-driven.
 */
import { describe, expect, it, beforeEach } from "vitest";
import { listCapabilities } from "./capabilities";
import { getEngine, listEngines, saveCustomEngine } from "./engines";
import { executeEngine } from "./execute";
import { challengesFor, runChallenge } from "./challenges";
import { createInMemoryExperimentStore } from "./store";
import { deriveEngineStatus } from "./status";
import { discoverEngineCandidates, analyzeCompositions } from "./discovery";
import { emptyDraft, addStep, compatibilityFor } from "./composer";
import { DEFAULT_NODES } from "./labNode";
import type { Experiment } from "./types";

beforeEach(() => window.localStorage.clear());

describe("EngineLab end-to-end loop (curated Engine)", () => {
  it("discovers capabilities, executes a curated Engine, challenges the result, and records experiment history", () => {
    const capabilities = listCapabilities();
    expect(capabilities.length).toBeGreaterThanOrEqual(7);

    const engine = getEngine("canonical-chain")!;
    expect(engine.steps.length).toBeGreaterThan(1);
    expect(deriveEngineStatus(engine.id, [])).toBe("experimental");

    const result = executeEngine(engine, engine.defaultInput, { "spatial.evaluateBasis.seed": 42, "spatial.evaluateBasis.sampleSize": 1000 });
    expect(result.status).toBe("success");

    const applicable = challengesFor(result);
    expect(applicable.length).toBeGreaterThan(0);
    const outcomes = applicable.map((c) => runChallenge(c.id, result));
    expect(outcomes.every((o) => o.verdict === "PASS")).toBe(true);

    const store = createInMemoryExperimentStore();
    const experiment: Experiment = {
      id: "exp-1", engineId: engine.id, engineVersion: engine.version,
      input: engine.defaultInput, configuration: result.configuration,
      result, challenges: outcomes, createdAt: new Date().toISOString(),
    };
    store.save(experiment);
    expect(deriveEngineStatus(engine.id, store.list())).toBe("validated");

    const replayed = executeEngine(engine, experiment.input, experiment.configuration);
    const strip = (r: typeof result) => r.steps.map((s) => ({ id: s.capabilityId, output: s.output, error: s.error }));
    expect(strip(replayed)).toEqual(strip(result));

    expect(listEngines().length).toBeGreaterThanOrEqual(3);
  });
});

describe("EngineLab end-to-end loop (user composition — Step 12 critical test)", () => {
  it("capability -> user composition -> Engine definition -> execution -> provenance -> result -> challenge -> persisted Engine -> replay", () => {
    // 1. capability discovery
    const capabilities = listCapabilities();
    const ids = new Set(capabilities.map((c) => c.id));
    expect(ids.has("corpus.join")).toBe(true);
    expect(ids.has("structure.classify")).toBe(true);

    // 2. USER composition, one capability at a time, exactly as ComposerView drives sdk/composer.ts
    let draft = emptyDraft();
    expect(compatibilityFor(draft, "corpus.join").status).toBe("compatible");
    const step1 = addStep(draft, "corpus.join");
    expect(step1.added).toBe(true);
    draft = step1.draft;

    expect(compatibilityFor(draft, "structure.classify").status).toBe("compatible"); // supportingRelations is optional
    const step2 = addStep(draft, "structure.classify");
    expect(step2.added).toBe(true);
    draft = step2.draft;

    // refuse an incompatible addition rather than silently accepting it
    const badAdd = addStep(draft, "traversal.walk"); // needs `relations`, nothing in this chain produces Relation[]
    expect(badAdd.result.status).toBe("incompatible");
    expect(badAdd.added).toBe(false);
    expect(draft.steps).toHaveLength(2); // unchanged

    // 3. Engine definition — persisted as a NEW versioned custom Engine
    const saved = saveCustomEngine({
      name: "E2E Composed Probe",
      description: "corpus.join -> structure.classify, built entirely through the composer API",
      steps: draft.steps,
      defaultInput: { nodes: DEFAULT_NODES },
    });
    expect(saved.origin).toBe("composed");
    expect(saved.version).toBe("1");
    expect(getEngine(saved.id)?.id).toBe(saved.id); // appears in the registry immediately

    // 4. execution -> 5. provenance -> 6. result, through the SAME executor curated Engines use
    const result = executeEngine(saved, saved.defaultInput, {});
    expect(result.status).toBe("success");
    expect(result.steps.map((s) => s.capabilityId)).toEqual(["corpus.join", "structure.classify"]);
    expect(result.provenance.source).toBe(`engine:${saved.id}`);
    expect(result.provenance.algorithm).toBe(saved.version);

    // 7. challenge — the same mechanism, applying by capability presence
    const applicable = challengesFor(result);
    expect(applicable.map((c) => c.id)).toContain("replay-determinism");
    const replayOutcome = runChallenge("replay-determinism", result);
    expect(replayOutcome.verdict).toBe("PASS");

    // 8. persisted Engine — re-saving under the SAME family creates v2, never overwrites v1
    const resaved = saveCustomEngine({
      name: "E2E Composed Probe", family: saved.family,
      description: saved.description, steps: draft.steps, defaultInput: saved.defaultInput,
    });
    expect(resaved.version).toBe("2");
    expect(resaved.id).not.toBe(saved.id);
    expect(getEngine(saved.id)).toBeDefined(); // v1 still resolvable — old experiments keep working

    // 9. replay
    const replay = executeEngine(saved, saved.defaultInput, {});
    const strip = (r: typeof result) => r.steps.map((s) => ({ id: s.capabilityId, output: s.output, error: s.error }));
    expect(strip(replay)).toEqual(strip(result));
  });
});

describe("discovery reflects real evidence, not fabrication", () => {
  it("discoverEngineCandidates and analyzeCompositions both work off actual experiment/Engine state", () => {
    const store = createInMemoryExperimentStore();
    const shapeProbe = getEngine("shape-probe")!;
    const shapeResult = executeEngine(shapeProbe, shapeProbe.defaultInput, {});
    store.save({
      id: "exp-2", engineId: shapeProbe.id, engineVersion: shapeProbe.version,
      input: shapeProbe.defaultInput, configuration: {}, result: shapeResult, challenges: [],
      createdAt: new Date().toISOString(),
    });

    // a single engine run, alone, never manufactures a "repeated pattern" candidate
    expect(discoverEngineCandidates(store.list())).toHaveLength(0);

    // but the composition landscape (structural, not history-dependent) always
    // reports real compatible pairs from the port contracts
    const compositions = analyzeCompositions(listEngines(), store.list());
    expect(compositions.length).toBeGreaterThan(0);
    expect(compositions.some((c) => c.capabilitySequence.join(">") === "corpus.join>structure.classify")).toBe(true);
  });
});
