import { describe, expect, it } from "vitest";
import { createInMemoryExperimentStore } from "./store";
import type { Experiment } from "./types";

function fakeExperiment(id: string): Experiment {
  return {
    id, engineId: "canonical-chain", engineVersion: "1.0.0",
    input: {}, configuration: {},
    result: {
      engineId: "canonical-chain", engineVersion: "1.0.0", configuration: {}, input: {},
      steps: [], status: "success", startedAt: new Date().toISOString(), durationMs: 1,
      provenance: {
        source: "engine:canonical-chain", operation: "execute", parents: [], algorithm: "1.0.0",
        parameters: {}, bounds: {}, corpusVersion: "x", engineVersion: "0.1.0",
      },
    },
    challenges: [], createdAt: new Date().toISOString(),
  };
}

describe("ExperimentStore (in-memory)", () => {
  it("starts empty and persists saved experiments", () => {
    const store = createInMemoryExperimentStore();
    expect(store.list()).toHaveLength(0);
    store.save(fakeExperiment("e1"));
    expect(store.list()).toHaveLength(1);
    expect(store.get("e1")?.id).toBe("e1");
  });

  it("addChallenge appends to the right experiment and returns the update", () => {
    const store = createInMemoryExperimentStore();
    store.save(fakeExperiment("e1"));
    const updated = store.addChallenge("e1", {
      challengeId: "replay-determinism", verdict: "PASS", summary: "ok", evidence: null,
      evaluatedAt: new Date().toISOString(),
    });
    expect(updated?.challenges).toHaveLength(1);
    expect(store.get("e1")?.challenges).toHaveLength(1);
  });

  it("addChallenge on an unknown experiment id returns undefined without throwing", () => {
    const store = createInMemoryExperimentStore();
    expect(store.addChallenge("nope", {
      challengeId: "x", verdict: "PASS", summary: "", evidence: null, evaluatedAt: new Date().toISOString(),
    })).toBeUndefined();
  });

  it("clear empties the store", () => {
    const store = createInMemoryExperimentStore();
    store.save(fakeExperiment("e1"));
    store.clear();
    expect(store.list()).toHaveLength(0);
  });

  it("list is newest-first", () => {
    const store = createInMemoryExperimentStore();
    const older: Experiment = { ...fakeExperiment("e1"), createdAt: "2020-01-01T00:00:00.000Z" };
    const newer: Experiment = { ...fakeExperiment("e2"), createdAt: "2024-01-01T00:00:00.000Z" };
    store.save(older);
    store.save(newer);
    expect(store.list().map((e) => e.id)).toEqual(["e2", "e1"]);
  });
});
