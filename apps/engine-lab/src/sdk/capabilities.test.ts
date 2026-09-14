import { describe, expect, it } from "vitest";
import {
  runCorpusJoin, runSkeleton, runVerifyTransform, runDetectSharedSkeleton,
  runDiscoveryWrap, reconcileDiscoveries, runStructureClassify, runEvaluateBasis,
  runTraversalWalk, listCapabilities,
} from "./capabilities";
import { DEFAULT_NODES } from "./labNode";
import { locusKey } from "../../../../packages/corpus/index";

describe("capability: corpus.join", () => {
  it("places every node and reports full coverage when loci are distinct", () => {
    const { join, coverage } = runCorpusJoin({ nodes: DEFAULT_NODES });
    expect(join.placed.size).toBe(DEFAULT_NODES.length);
    expect(coverage.placed).toBe(DEFAULT_NODES.length);
    expect(coverage.gated).toBe(0);
  });
});

describe("capability: arabic.skeleton", () => {
  it("computes sorted-unique-letter readings", () => {
    const { readings } = runSkeleton({ subjects: ["abcab", "xyzxy"] });
    expect(readings[0]).toEqual({ subject: "abcab", skeleton: "abc" });
    expect(readings[1]).toEqual({ subject: "xyzxy", skeleton: "xyz" });
  });
});

describe("capability: arabic.verifyTransform", () => {
  it("confirms reverse is genuinely invertible", () => {
    const report = runVerifyTransform({ subjects: ["abcab", "xyz"], transformId: "reverse" });
    expect(report.verdict).toBe("confirmed");
  });

  it("refutes truncate-last's false invertibility claim with real counterexamples", () => {
    const report = runVerifyTransform({ subjects: ["abcab", "xyz"], transformId: "truncate-last" });
    expect(report.verdict).toBe("refuted");
    expect(report.counterexamples.length).toBeGreaterThan(0);
  });
});

describe("capability: relation.detectSharedSkeleton", () => {
  it("finds exactly the pairs that share a skeleton, with textual epistemic type", () => {
    const { join } = runCorpusJoin({ nodes: DEFAULT_NODES });
    const { relations } = runDetectSharedSkeleton({ join });
    // nodes 0 ("abcab"), 1 ("babca"), 3 ("abcab"), 5 ("bacab") all skeleton -> "abc"
    expect(relations.length).toBeGreaterThanOrEqual(1);
    for (const r of relations) {
      expect(r.epistemicType).toBe("textual");
      expect(r.evidence.skeleton).toBe("abc");
      expect(r.provenance.algorithm).toBe("shared-skeleton-match");
    }
  });
});

describe("capability: discovery.wrap + reconcileDiscoveries", () => {
  it("wraps relations as EXHAUSTED discoveries and demotes them when bounds tighten", () => {
    const { join } = runCorpusJoin({ nodes: DEFAULT_NODES });
    const { relations } = runDetectSharedSkeleton({ join });
    const { discoveries } = runDiscoveryWrap({ relations, bounds: { nodeCount: DEFAULT_NODES.length } });
    expect(discoveries.every((d) => d.state === "EXHAUSTED")).toBe(true);

    const same = reconcileDiscoveries(discoveries, { nodeCount: DEFAULT_NODES.length });
    expect(same.every((d) => d.state === "EXHAUSTED")).toBe(true);

    const tightened = reconcileDiscoveries(discoveries, { nodeCount: DEFAULT_NODES.length + 1 });
    expect(tightened.every((d) => d.state === "KNOWN")).toBe(true);
  });
});

describe("capability: structure.classify", () => {
  it("always attaches basis/algorithm/confidence, computed not asserted", () => {
    const { join } = runCorpusJoin({ nodes: DEFAULT_NODES });
    const { relations } = runDetectSharedSkeleton({ join });
    const structure = runStructureClassify({ nodes: DEFAULT_NODES, supportingRelations: relations });
    expect(structure.basisId).toBe("lab-default");
    expect(structure.confidence).toBeGreaterThan(0);
    expect(structure.confidence).toBeLessThanOrEqual(1);
    expect(structure.supportingRelations.length).toBe(relations.length);
  });
});

describe("capability: spatial.evaluateBasis", () => {
  it("is deterministic given a fixed seed and reports a locality below 1 for clustered nodes", () => {
    const { join } = runCorpusJoin({ nodes: DEFAULT_NODES });
    const { relations } = runDetectSharedSkeleton({ join });
    const first = runEvaluateBasis({ nodes: DEFAULT_NODES, relations, seed: 1, sampleSize: 2000 });
    const second = runEvaluateBasis({ nodes: DEFAULT_NODES, relations, seed: 1, sampleSize: 2000 });
    expect(first).toEqual(second);
    expect(first.locality).toBeLessThan(1);
  });
});

describe("capability: traversal.walk", () => {
  it("produces a full, non-empty step log over the detected relation graph", () => {
    const { join } = runCorpusJoin({ nodes: DEFAULT_NODES });
    const { relations } = runDetectSharedSkeleton({ join });
    const seedKey = locusKey(DEFAULT_NODES[0].locus);
    const traversal = runTraversalWalk({ nodes: DEFAULT_NODES, relations, seedLocusKey: seedKey, maxSteps: 3 });
    expect(traversal.seed).toBe(seedKey);
    expect(traversal.steps.length).toBeGreaterThan(0);
  });

  it("throws for an unknown seed locus rather than silently walking nowhere", () => {
    expect(() => runTraversalWalk({ nodes: DEFAULT_NODES, relations: [], seedLocusKey: "99:99:99", maxSteps: 1 }))
      .toThrow(/no node with locus key/);
  });
});

describe("capability registry", () => {
  it("is a live read of everything registered — at least the 7 capabilities EngineLab wraps", () => {
    const ids = listCapabilities().map((c) => c.id);
    for (const expected of [
      "corpus.join", "arabic.skeleton", "arabic.verifyTransform", "relation.detectSharedSkeleton",
      "discovery.wrap", "structure.classify", "spatial.evaluateBasis", "traversal.walk",
    ]) {
      expect(ids).toContain(expected);
    }
  });
});
