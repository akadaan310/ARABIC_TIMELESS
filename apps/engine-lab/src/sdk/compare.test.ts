import { describe, expect, it } from "vitest";
import { compareExecutions } from "./compare";
import type { Experiment } from "./types";

function experiment(id: string, engineId: string, output: unknown, challenges: Experiment["challenges"] = []): Experiment {
  return {
    id, engineId, engineVersion: "1", input: {}, configuration: { seed: 1 },
    result: {
      engineId, engineVersion: "1", configuration: { seed: 1 }, input: {},
      steps: [{ capabilityId: "corpus.join", input: {}, output, startedAt: "", durationMs: 1 }],
      status: "success", startedAt: "", durationMs: 1,
      provenance: { source: "engine:x", operation: "execute", parents: [], algorithm: "1", parameters: {}, bounds: {}, corpusVersion: "x", engineVersion: "0.1.0" },
    },
    challenges, createdAt: "2024-01-01T00:00:00.000Z",
  };
}

describe("compareExecutions", () => {
  it("marks identical step outputs as matching", () => {
    const a = experiment("a", "e1", { x: 1 });
    const b = experiment("b", "e1", { x: 1 });
    const cmp = compareExecutions(a, b);
    expect(cmp.sameEngine).toBe(true);
    expect(cmp.steps).toEqual([{ index: 0, capabilityA: "corpus.join", capabilityB: "corpus.join", same: true }]);
  });

  it("marks differing step outputs as not matching", () => {
    const a = experiment("a", "e1", { x: 1 });
    const b = experiment("b", "e1", { x: 2 });
    expect(compareExecutions(a, b).steps[0].same).toBe(false);
  });

  it("flags a cross-engine comparison", () => {
    const a = experiment("a", "e1", { x: 1 });
    const b = experiment("b", "e2", { x: 1 });
    expect(compareExecutions(a, b).sameEngine).toBe(false);
  });

  it("pairs up challenge verdicts by challenge id, leaving gaps where one side lacks it", () => {
    const a = experiment("a", "e1", {}, [{ challengeId: "replay-determinism", verdict: "PASS", summary: "", evidence: null, evaluatedAt: "" }]);
    const b = experiment("b", "e1", {}, [{ challengeId: "replay-determinism", verdict: "FAIL", summary: "", evidence: null, evaluatedAt: "" }]);
    const cmp = compareExecutions(a, b);
    expect(cmp.challenges).toEqual([{ challengeId: "replay-determinism", verdictA: "PASS", verdictB: "FAIL" }]);
  });

  it("exposes both experiments' configuration untouched", () => {
    const a = experiment("a", "e1", {});
    const b = experiment("b", "e1", {});
    const cmp = compareExecutions(a, b);
    expect(cmp.configurationA).toEqual({ seed: 1 });
    expect(cmp.configurationB).toEqual({ seed: 1 });
  });
});
