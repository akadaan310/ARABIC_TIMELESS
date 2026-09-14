import { describe, expect, it } from "vitest";
import { getEngine } from "./engines";
import { executeEngine } from "./execute";
import { challengesFor, runChallenge, listChallenges } from "./challenges";

describe("challengesFor", () => {
  it("offers replay-determinism to every engine, and specialized challenges only where applicable", () => {
    expect(challengesFor("invertibility-probe").map((c) => c.id)).toEqual(
      expect.arrayContaining(["invertibility-verdict", "replay-determinism"]),
    );
    expect(challengesFor("canonical-chain").map((c) => c.id)).toEqual(
      expect.arrayContaining(["basis-locality", "discovery-bound-sensitivity", "replay-determinism"]),
    );
    expect(challengesFor("invertibility-probe")).not.toContainEqual(
      expect.objectContaining({ id: "basis-locality" }),
    );
  });
});

describe("challenge: invertibility-verdict", () => {
  it("PASSes for the genuinely invertible transform", () => {
    const engine = getEngine("invertibility-probe")!;
    const result = executeEngine(engine, engine.defaultInput, { transformId: "reverse" });
    expect(runChallenge("invertibility-verdict", result).verdict).toBe("PASS");
  });

  it("FAILs for the falsely-claimed transform, with counterexample evidence", () => {
    const engine = getEngine("invertibility-probe")!;
    const result = executeEngine(engine, engine.defaultInput, { transformId: "truncate-last" });
    const outcome = runChallenge("invertibility-verdict", result);
    expect(outcome.verdict).toBe("FAIL");
    expect(outcome.evidence).toBeTruthy();
  });
});

describe("challenge: basis-locality", () => {
  it("PASSes on the default clustered dataset", () => {
    const engine = getEngine("canonical-chain")!;
    const result = executeEngine(engine, engine.defaultInput, {});
    const outcome = runChallenge("basis-locality", result);
    expect(outcome.verdict).toBe("PASS");
  });
});

describe("challenge: discovery-bound-sensitivity", () => {
  it("PASSes when EXHAUSTED discoveries correctly demote under tightened bounds", () => {
    const engine = getEngine("canonical-chain")!;
    const result = executeEngine(engine, engine.defaultInput, {});
    const outcome = runChallenge("discovery-bound-sensitivity", result);
    expect(outcome.verdict).toBe("PASS");
  });
});

describe("challenge: replay-determinism", () => {
  it("PASSes for a deterministic engine run", () => {
    const engine = getEngine("canonical-chain")!;
    const result = executeEngine(engine, engine.defaultInput, { seed: 3 });
    expect(runChallenge("replay-determinism", result).verdict).toBe("PASS");
  });
});

describe("listChallenges", () => {
  it("exposes 4 real challenge definitions", () => {
    expect(listChallenges()).toHaveLength(4);
  });
});
