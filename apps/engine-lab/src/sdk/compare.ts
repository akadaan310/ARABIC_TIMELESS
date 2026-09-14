/**
 * Step 10 — computational comparison of two Engine executions. Purely
 * structural: per-step output equality, configuration, and challenge
 * verdicts side by side. No statistical meaning is manufactured where the
 * underlying data doesn't support it (e.g. no "% similar" score) — only
 * exact-match/differs per step, and verdict-vs-verdict per challenge.
 */
import type { ChallengeVerdict, Experiment, StepResult } from "./types";

export interface StepComparisonRow {
  readonly index: number;
  readonly capabilityA?: string;
  readonly capabilityB?: string;
  readonly same: boolean;
}

export interface ChallengeComparisonRow {
  readonly challengeId: string;
  readonly verdictA?: ChallengeVerdict;
  readonly verdictB?: ChallengeVerdict;
}

export interface ExecutionComparison {
  readonly engineA: { readonly id: string; readonly version: string };
  readonly engineB: { readonly id: string; readonly version: string };
  readonly sameEngine: boolean;
  readonly configurationA: Readonly<Record<string, unknown>>;
  readonly configurationB: Readonly<Record<string, unknown>>;
  readonly steps: readonly StepComparisonRow[];
  readonly challenges: readonly ChallengeComparisonRow[];
}

function stripTiming(steps: readonly StepResult[]) {
  return steps.map((s) => ({ capabilityId: s.capabilityId, output: s.output, error: s.error }));
}

export function compareExecutions(a: Experiment, b: Experiment): ExecutionComparison {
  const sigA = stripTiming(a.result.steps);
  const sigB = stripTiming(b.result.steps);
  const length = Math.max(sigA.length, sigB.length);

  const steps: StepComparisonRow[] = Array.from({ length }, (_, i) => ({
    index: i,
    capabilityA: sigA[i]?.capabilityId,
    capabilityB: sigB[i]?.capabilityId,
    same: JSON.stringify(sigA[i]) === JSON.stringify(sigB[i]),
  }));

  const challengeIds = [...new Set([...a.challenges.map((c) => c.challengeId), ...b.challenges.map((c) => c.challengeId)])];
  const challenges: ChallengeComparisonRow[] = challengeIds.map((challengeId) => ({
    challengeId,
    verdictA: a.challenges.find((c) => c.challengeId === challengeId)?.verdict,
    verdictB: b.challenges.find((c) => c.challengeId === challengeId)?.verdict,
  }));

  return {
    engineA: { id: a.engineId, version: a.engineVersion },
    engineB: { id: b.engineId, version: b.engineVersion },
    sameEngine: a.engineId === b.engineId,
    configurationA: a.configuration,
    configurationB: b.configuration,
    steps,
    challenges,
  };
}
