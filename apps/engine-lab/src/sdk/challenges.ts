/**
 * Real challenges over real Engine results. Every verdict follows from
 * actually re-running SDK computation against the result's own recorded
 * inputs/outputs — never a fabricated PASS/FAIL.
 */
import { reconcileDiscoveries } from "./capabilities";
import { getEngine } from "./engines";
import { executeEngine } from "./execute";
import type {
  ChallengeDefinition, ChallengeOutcome, ExecutionResult, StepResult,
} from "./types";
import type { InvertibilityReport } from "../../../../packages/arabic/index";
import type { BasisEvaluation } from "../../../../packages/spatial/index";
import type { Discovery } from "../../../../packages/discovery/index";
import type { Relation } from "../../../../packages/relation/index";

function stepOutput<T>(result: ExecutionResult, capabilityId: string): T | undefined {
  return result.steps.find((s) => s.capabilityId === capabilityId)?.output as T | undefined;
}

function outcome(challengeId: string, verdict: ChallengeOutcome["verdict"], summary: string, evidence: unknown): ChallengeOutcome {
  return { challengeId, verdict, summary, evidence, evaluatedAt: new Date().toISOString() };
}

function ran(result: ExecutionResult, capabilityId: string): boolean {
  return result.steps.some((s) => s.capabilityId === capabilityId && !s.error);
}

const invertibilityVerdict: ChallengeDefinition = {
  id: "invertibility-verdict",
  label: "Invertibility verdict",
  category: "invariance",
  description: "Reads the InvertibilityReport a run already produced and turns its verdict into a challenge outcome.",
  appliesTo: (result) => ran(result, "arabic.verifyTransform"),
  run: (result) => {
    const report = stepOutput<InvertibilityReport<string>>(result, "arabic.verifyTransform");
    if (!report) return outcome("invertibility-verdict", "INCONCLUSIVE", "no InvertibilityReport in this result", null);
    const verdict = report.verdict === "confirmed" ? "PASS" : report.verdict === "refuted" ? "FAIL" : "INCONCLUSIVE";
    return outcome(
      "invertibility-verdict", verdict,
      `${report.transformId}: ${report.samplesPassed}/${report.samplesTotal} samples round-tripped (${report.verdict})`,
      report,
    );
  },
};

const basisLocality: ChallengeDefinition = {
  id: "basis-locality",
  label: "Basis locality vs. null model",
  category: "comparison",
  description: "Compares the run's BasisEvaluation.locality against the null-model baseline of 1 (blind to structure).",
  appliesTo: (result) => ran(result, "spatial.evaluateBasis"),
  run: (result) => {
    const evaluation = stepOutput<BasisEvaluation>(result, "spatial.evaluateBasis");
    if (!evaluation || evaluation.nullModelSampleSize === 0) {
      return outcome("basis-locality", "INCONCLUSIVE", "no basis evaluation or empty null-model sample", evaluation);
    }
    const verdict = evaluation.locality < 0.8 ? "PASS" : evaluation.locality >= 0.95 ? "FAIL" : "INCONCLUSIVE";
    return outcome(
      "basis-locality", verdict,
      `locality=${evaluation.locality.toFixed(3)} (medianRelated=${evaluation.medianRelated.toFixed(3)}, ` +
      `medianRandom=${evaluation.medianRandom.toFixed(3)}, threshold: PASS<0.8, FAIL>=0.95)`,
      evaluation,
    );
  },
};

const discoveryBoundSensitivity: ChallengeDefinition = {
  id: "discovery-bound-sensitivity",
  label: "Discovery bound-relative demotion",
  category: "parameter-sensitivity",
  description: "Tightens the discovery bound signature and checks that EXHAUSTED claims correctly demote to KNOWN, per packages/discovery's core invariant.",
  appliesTo: (result) => ran(result, "discovery.wrap"),
  run: (result) => {
    const discoveryOutput = stepOutput<{ discoveries: readonly Discovery<Relation>[] }>(result, "discovery.wrap");
    if (!discoveryOutput || discoveryOutput.discoveries.length === 0) {
      return outcome("discovery-bound-sensitivity", "INCONCLUSIVE", "no discoveries produced", discoveryOutput);
    }
    const { discoveries } = discoveryOutput;
    const originalBounds = discoveries[0].bounds;
    const tightenedBounds = { ...originalBounds, nodeCount: Number(originalBounds.nodeCount ?? 0) + 1 };
    const underOriginal = reconcileDiscoveries(discoveries, originalBounds);
    const underTightened = reconcileDiscoveries(discoveries, tightenedBounds);
    const staysExhausted = underOriginal.every((d) => d.state === "EXHAUSTED");
    const correctlyDemotes = underTightened.every((d) => d.state === "KNOWN");
    const pass = staysExhausted && correctlyDemotes;
    return outcome(
      "discovery-bound-sensitivity", pass ? "PASS" : "FAIL",
      `under original bounds: ${underOriginal.filter((d) => d.state === "EXHAUSTED").length}/${underOriginal.length} stayed EXHAUSTED; ` +
      `under tightened bounds: ${underTightened.filter((d) => d.state === "KNOWN").length}/${underTightened.length} correctly demoted to KNOWN`,
      { originalBounds, tightenedBounds, underOriginal, underTightened },
    );
  },
};

function withoutTiming(steps: readonly StepResult[]) {
  return steps.map((s) => ({ capabilityId: s.capabilityId, input: s.input, output: s.output, error: s.error }));
}

const replayDeterminism: ChallengeDefinition = {
  id: "replay-determinism",
  label: "Replay determinism",
  category: "reproducibility",
  description: "Re-executes the same Engine with the same input/configuration and deep-compares the step outputs (timing excluded).",
  appliesTo: () => true,
  run: (result) => {
    const engine = getEngine(result.engineId);
    if (!engine) return outcome("replay-determinism", "INCONCLUSIVE", `engine "${result.engineId}" not found`, null);
    const replay = executeEngine(engine, result.input, result.configuration);
    const identical = JSON.stringify(withoutTiming(result.steps)) === JSON.stringify(withoutTiming(replay.steps));
    return outcome(
      "replay-determinism", identical ? "PASS" : "FAIL",
      identical ? "replay produced byte-identical step outputs" : "replay diverged from the original result",
      { original: withoutTiming(result.steps), replay: withoutTiming(replay.steps) },
    );
  },
};

const CHALLENGES: readonly ChallengeDefinition[] = [
  invertibilityVerdict, basisLocality, discoveryBoundSensitivity, replayDeterminism,
];

export function listChallenges(): readonly ChallengeDefinition[] {
  return CHALLENGES;
}

export function challengesFor(result: ExecutionResult): readonly ChallengeDefinition[] {
  return CHALLENGES.filter((c) => c.appliesTo(result));
}

export function runChallenge(challengeId: string, result: ExecutionResult): ChallengeOutcome {
  const challenge = CHALLENGES.find((c) => c.id === challengeId);
  if (!challenge) throw new Error(`unknown challenge "${challengeId}"`);
  return challenge.run(result);
}
