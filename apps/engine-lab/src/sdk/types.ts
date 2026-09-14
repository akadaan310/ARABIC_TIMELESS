/**
 * Engine / Experiment / Challenge — the concepts EngineLab adds on top of
 * the SDK. None of these exist in the SDK (an "Engine" is a composition of
 * capabilities; the SDK only defines the capabilities themselves), so they
 * are defined here rather than forced into an SDK package. Everything they
 * carry that the SDK *does* have a type for (Provenance, Relation,
 * Discovery, Structure, BasisEvaluation, Traversal) reuses that type
 * directly — see sdk/capabilities.ts. Port/binding/compatibility types live
 * in sdk/ports.ts, the composition contract layer this milestone adds.
 */
import type { Provenance } from "../../../../packages/provenance/index";
import type { PortBinding } from "./ports";

export type EngineStatus = "experimental" | "runnable" | "challenged" | "validated";

export interface EngineStep {
  readonly capabilityId: string;
  /** data-port key -> where its value comes from. Only data ports need a
   * binding; config ports are always resolved from configuration/defaults
   * at execution time (see ports.ts resolveStepInput). Never a structural/
   * implicit cast — this is the same discipline @engine/corpus's
   * ProjectionRule enforces for locus granularity, applied here to
   * capability composition. */
  readonly bindings: Readonly<Record<string, PortBinding>>;
}

export interface EngineDefinition {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  /** groups versions of "the same" named Engine — see Step 7 (versioning) */
  readonly family: string;
  readonly origin: "curated" | "composed";
  readonly description: string;
  readonly steps: readonly EngineStep[];
  /** what raw input this Engine expects — canonically `{ nodes: LabNode[] }`
   * for every Engine in this milestone, so it is runnable the moment
   * EngineLab opens with no server and no corpus file required */
  readonly defaultInput: unknown;
  readonly createdAt: string;
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
  /** Whether this challenge is meaningful against a given RESULT — based on
   * which capabilities actually ran, never on a hardcoded engine id, so a
   * composed Engine gets exactly the same challenges a curated one with the
   * same capabilities would (Step 8). */
  readonly appliesTo: (result: ExecutionResult) => boolean;
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
