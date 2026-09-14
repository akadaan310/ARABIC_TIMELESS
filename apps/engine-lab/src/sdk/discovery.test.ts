import { describe, expect, it } from "vitest";
import { discoverEngineCandidates } from "./discovery";
import type { Experiment } from "./types";

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
