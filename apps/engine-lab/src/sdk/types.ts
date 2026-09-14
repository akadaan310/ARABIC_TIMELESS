/**
 * Engine / Experiment / Challenge — the concepts EngineLab adds on top of
 * the SDK. None of these exist in the SDK (an "Engine" is a composition of
 * capabilities; the SDK only defines the capabilities themselves), so they
 * are defined here rather than forced into an SDK package. Everything they
 * carry that the SDK *does* have a type for (Provenance, Relation,
 * Discovery, Structure, BasisEvaluation, Traversal) reuses that type
 * directly — see sdk/capabilities.ts.
 */
import type { Provenance } from "../../../../packages/provenance/index";

export type EngineStatus = "experimental" | "runnable" | "challenged" | "validated";

export interface ConfigField {
  readonly key: string;
  readonly label: string;
  readonly type: "number" | "string";
  readonly default: number | string;
}

export interface EngineStep {
  readonly capabilityId: string;
  /** Explicit, hand-written adapter from the running context to this
   * capability's input — never a structural/implicit cast. This is the same
   * discipline @engine/corpus's ProjectionRule enforces for locus
   * granularity, applied here to capability composition. */
  buildInput(ctx: EngineContext): unknown;
}

export interface EngineDefinition {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly steps: readonly EngineStep[];
  readonly configFields: readonly ConfigField[];
  /** what raw input this Engine expects, and a working default so it is
   * runnable the moment EngineLab opens */
  readonly defaultInput: unknown;
}

export interface EngineContext {
  readonly rawInput: unknown;
  readonly configuration: Readonly<Record<string, unknown>>;
  readonly outputs: ReadonlyMap<string, unknown>;
}

export interface StepResult {
  readonly capabilityId: string;
  readonly input: unknown;
  readonly output?: unknown;
  readonly error?: string;
  readonly startedAt: string;
  readonly durationMs: number;
}

export interface ExecutionResult {
  readonly engineId: string;
  readonly engineVersion: string;
  readonly configuration: Readonly<Record<string, unknown>>;
  readonly input: unknown;
  readonly steps: readonly StepResult[];
  readonly status: "success" | "error";
  readonly error?: string;
  readonly startedAt: string;
  readonly durationMs: number;
  readonly provenance: Provenance;
}

export type ChallengeVerdict = "PASS" | "FAIL" | "INCONCLUSIVE";

export interface ChallengeDefinition {
  readonly id: string;
  readonly label: string;
  readonly category: "invariance" | "reproducibility" | "comparison" | "parameter-sensitivity";
  readonly description: string;
  /** which Engine ids this challenge is meaningful against; a challenge is
   * never offered for an Engine it cannot actually evaluate */
  readonly appliesTo: (engineId: string) => boolean;
  run(result: ExecutionResult): ChallengeOutcome;
}

export interface ChallengeOutcome {
  readonly challengeId: string;
  readonly verdict: ChallengeVerdict;
  readonly summary: string;
  readonly evidence: unknown;
  readonly evaluatedAt: string;
}

export interface Experiment {
  readonly id: string;
  readonly engineId: string;
  readonly engineVersion: string;
  readonly input: unknown;
  readonly configuration: Readonly<Record<string, unknown>>;
  readonly result: ExecutionResult;
  readonly challenges: readonly ChallengeOutcome[];
  readonly createdAt: string;
}

export interface EngineCandidate {
  readonly id: string;
  readonly capabilitySequence: readonly string[];
  readonly occurrences: number;
  readonly experimentIds: readonly string[];
  readonly status: "candidate"; // never auto-promoted
}
