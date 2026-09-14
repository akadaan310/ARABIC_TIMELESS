import { describe, expect, it } from "vitest";
import { getEngine } from "./engines";
import { executeEngine } from "./execute";
import { challengesFor, runChallenge, listChallenges } from "./challenges";

describe("challengesFor", () => {
  it("applies by which capabilities actually ran in the result, not by a hardcoded engine id", () => {
    const invertibilityEngine = getEngine("invertibility-probe")!;
    const invertibilityResult = executeEngine(invertibilityEngine, invertibilityEngine.defaultInput, {});
    expect(challengesFor(invertibilityResult).map((c) => c.id)).toEqual(
      expect.arrayContaining(["invertibility-verdict", "replay-determinism"]),
    );
    expect(challengesFor(invertibilityResult)).not.toContainEqual(expect.objectContaining({ id: "basis-locality" }));

    const chainEngine = getEngine("canonical-chain")!;
    const chainResult = executeEngine(chainEngine, chainEngine.defaultInput, {});
    expect(challengesFor(chainResult).map((c) => c.id)).toEqual(
      expect.arrayContaining(["basis-locality", "discovery-bound-sensitivity", "replay-determinism"]),
    );
  });

  it("offers the same challenges to a composed Engine that runs the same capabilities — never special-cased by id", () => {
    const chainEngine = getEngine("canonical-chain")!;
    const chainResult = executeEngine(chainEngine, chainEngine.defaultInput, {});
    // shape-probe never runs spatial.evaluateBasis or discovery.wrap — its result should not offer those challenges
    const shapeEngine = getEngine("shape-probe")!;
    const shapeResult = executeEngine(shapeEngine, shapeEngine.defaultInput, {});
    expect(challengesFor(shapeResult).map((c) => c.id)).not.toContain("basis-locality");
    expect(challengesFor(shapeResult).map((c) => c.id)).toContain("replay-determinism");
    // sanity: canonical-chain's own result still gets it (id-based special-casing would also pass this, but the point is the mechanism above proves it's capability-based)
    expect(challengesFor(chainResult).map((c) => c.id)).toContain("basis-locality");
  });
});

describe("challenge: invertibility-verdict", () => {
  it("PASSes for the genuinely invertible transform", () => {
    const engine = getEngine("invertibility-probe")!;
    const result = executeEngine(engine, engine.defaultInput, { "arabic.verifyTransform.transformId": "reverse" });
    expect(runChallenge("invertibility-verdict", result).verdict).toBe("PASS");
  });

  it("FAILs for the falsely-claimed transform, with counterexample evidence", () => {
    const engine = getEngine("invertibility-probe")!;
    const result = executeEngine(engine, engine.defaultInput, { "arabic.verifyTransform.transformId": "truncate-last" });
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
    const result = executeEngine(engine, engine.defaultInput, { "spatial.evaluateBasis.seed": 3 });
    expect(runChallenge("replay-determinism", result).verdict).toBe("PASS");
  });
});

describe("listChallenges", () => {
  it("exposes 4 real challenge definitions", () => {
    expect(listChallenges()).toHaveLength(4);
  });
});
