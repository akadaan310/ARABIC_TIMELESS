import { describe, expect, it } from "vitest";
import { discoverEngineCandidates, analyzeCompositions } from "./discovery";
import type { EngineDefinition, Experiment } from "./types";

function experimentWith(id: string, engineId: string, capabilitySequence: readonly string[]): Experiment {
  return {
    id, engineId, engineVersion: "1.0.0", input: {}, configuration: {},
    result: {
      engineId, engineVersion: "1.0.0", configuration: {}, input: {},
      steps: capabilitySequence.map((capabilityId) => ({
        capabilityId, input: {}, output: {}, startedAt: new Date().toISOString(), durationMs: 1,
      })),
      status: "success", startedAt: new Date().toISOString(), durationMs: 1,
      provenance: {
        source: `engine:${engineId}`, operation: "execute", parents: [], algorithm: "1.0.0",
        parameters: {}, bounds: {}, corpusVersion: "x", engineVersion: "0.1.0",
      },
    },
    challenges: [], createdAt: new Date().toISOString(),
  };
}

describe("discoverEngineCandidates", () => {
  it("finds no candidate when a pattern only ever appears in one engine", () => {
    const experiments = [
      experimentWith("e1", "engine-a", ["corpus.join", "structure.classify"]),
      experimentWith("e2", "engine-a", ["corpus.join", "structure.classify"]),
    ];
    expect(discoverEngineCandidates(experiments)).toHaveLength(0);
  });

  it("surfaces a candidate when a contiguous sub-sequence recurs across distinct engines", () => {
    const experiments = [
      experimentWith("e1", "engine-a", ["corpus.join", "structure.classify", "spatial.evaluateBasis"]),
      experimentWith("e2", "engine-b", ["corpus.join", "structure.classify"]),
    ];
    const candidates = discoverEngineCandidates(experiments);
    expect(candidates.some((c) => c.capabilitySequence.join(">") === "corpus.join>structure.classify")).toBe(true);
    for (const c of candidates) {
      expect(c.status).toBe("candidate"); // never auto-promoted
      expect(c.occurrences).toBeGreaterThanOrEqual(1);
    }
  });

  it("ignores failed experiments entirely", () => {
    const failed: Experiment = {
      ...experimentWith("e1", "engine-a", ["corpus.join", "structure.classify"]),
      result: { ...experimentWith("e1", "engine-a", []).result, status: "error" },
    };
    const ok = experimentWith("e2", "engine-b", ["corpus.join", "structure.classify"]);
    expect(discoverEngineCandidates([failed, ok])).toHaveLength(0);
  });
});

function engine(id: string, capabilitySequence: readonly string[]): EngineDefinition {
  return {
    id, name: id, version: "1", family: id, origin: "curated", description: "",
    steps: capabilitySequence.map((capabilityId) => ({ capabilityId, bindings: {} })),
    defaultInput: {}, createdAt: "2024-01-01T00:00:00.000Z",
  };
}

describe("analyzeCompositions — evidence ladder (Step 9)", () => {
  it("reports every structurally compatible pair as compatible-composition even with no engines/experiments at all", () => {
    const insights = analyzeCompositions([], []);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights.every((i) => i.level === "compatible-composition")).toBe(true);
    expect(insights.some((i) => i.capabilitySequence.join(">") === "corpus.join>structure.classify")).toBe(true);
  });

  it("upgrades to experimental-candidate once a saved Engine actually embodies the pair, with no runs yet", () => {
    const e = engine("shape-probe-like", ["corpus.join", "structure.classify"]);
    const insights = analyzeCompositions([e], []);
    const pair = insights.find((i) => i.capabilitySequence.join(">") === "corpus.join>structure.classify")!;
    expect(pair.level).toBe("experimental-candidate");
    expect(pair.engineIds).toContain(e.id);
  });

  it("upgrades to successfully-executed once that Engine has a successful experiment", () => {
    const e = engine("shape-probe-like", ["corpus.join", "structure.classify"]);
    const exp = experimentWith("exp1", e.id, ["corpus.join", "structure.classify"]);
    const pair = analyzeCompositions([e], [exp]).find((i) => i.capabilitySequence.join(">") === "corpus.join>structure.classify")!;
    expect(pair.level).toBe("successfully-executed");
  });

  it("upgrades to challenged once a challenge has been recorded, and reusable-engine only when ALL challenges passed", () => {
    const e = engine("shape-probe-like", ["corpus.join", "structure.classify"]);
    const withFailure: Experiment = {
      ...experimentWith("exp1", e.id, ["corpus.join", "structure.classify"]),
      challenges: [{ challengeId: "replay-determinism", verdict: "FAIL", summary: "", evidence: null, evaluatedAt: "" }],
    };
    const challengedPair = analyzeCompositions([e], [withFailure]).find((i) => i.capabilitySequence.join(">") === "corpus.join>structure.classify")!;
    expect(challengedPair.level).toBe("challenged");

    const allPassed: Experiment = {
      ...experimentWith("exp2", e.id, ["corpus.join", "structure.classify"]),
      challenges: [{ challengeId: "replay-determinism", verdict: "PASS", summary: "", evidence: null, evaluatedAt: "" }],
    };
    const reusablePair = analyzeCompositions([e], [allPassed]).find((i) => i.capabilitySequence.join(">") === "corpus.join>structure.classify")!;
    expect(reusablePair.level).toBe("reusable-engine");
  });

  it("never invents a level higher than the evidence actually supports", () => {
    const insights = analyzeCompositions([], []);
    for (const i of insights) {
      expect(["compatible-composition", "experimental-candidate", "successfully-executed", "challenged", "reusable-engine"]).toContain(i.level);
    }
  });
});
