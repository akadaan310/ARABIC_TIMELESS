import { describe, expect, it } from "vitest";
import { deriveEngineStatus } from "./status";
import type { ChallengeOutcome, Experiment } from "./types";

function experiment(engineId: string, challenges: readonly ChallengeOutcome[]): Experiment {
  return {
    id: Math.random().toString(36), engineId, engineVersion: "1.0.0", input: {}, configuration: {},
    result: {
      engineId, engineVersion: "1.0.0", configuration: {}, input: {}, steps: [],
      status: "success", startedAt: new Date().toISOString(), durationMs: 1,
      provenance: {
        source: `engine:${engineId}`, operation: "execute", parents: [], algorithm: "1.0.0",
        parameters: {}, bounds: {}, corpusVersion: "x", engineVersion: "0.1.0",
      },
    },
    challenges, createdAt: new Date().toISOString(),
  };
}

const pass = (id: string): ChallengeOutcome => ({ challengeId: id, verdict: "PASS", summary: "", evidence: null, evaluatedAt: "" });
const fail = (id: string): ChallengeOutcome => ({ challengeId: id, verdict: "FAIL", summary: "", evidence: null, evaluatedAt: "" });

describe("deriveEngineStatus", () => {
  it("is 'experimental' with zero experiments", () => {
    expect(deriveEngineStatus("e1", [])).toBe("experimental");
  });

  it("is 'runnable' once it has run but never been challenged", () => {
    expect(deriveEngineStatus("e1", [experiment("e1", [])])).toBe("runnable");
  });

  it("is 'validated' only when every recorded challenge passed", () => {
    expect(deriveEngineStatus("e1", [experiment("e1", [pass("a"), pass("b")])])).toBe("validated");
  });

  it("is 'challenged' (not validated) if any challenge failed", () => {
    expect(deriveEngineStatus("e1", [experiment("e1", [pass("a"), fail("b")])])).toBe("challenged");
  });

  it("only counts experiments for the given engine id", () => {
    expect(deriveEngineStatus("e1", [experiment("e2", [fail("a")])])).toBe("experimental");
  });
});
