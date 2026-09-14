/**
 * Runs an EngineDefinition's steps in order, calling the REAL capability
 * runner for each one, and returns a fully structured, inspectable result.
 * Nothing is hidden behind a generic "success" message: every step's input,
 * output (or error), and timing is retained.
 */
import { makeProvenance } from "../../../../packages/provenance/index";
import { CAPABILITY_RUNNERS } from "./engines";
import { ENGINE_VERSION, CORPUS_VERSION } from "./capabilities";
import type { EngineDefinition, ExecutionResult, StepResult } from "./types";

export function executeEngine(
  engine: EngineDefinition,
  input: unknown,
  configuration: Readonly<Record<string, unknown>>,
): ExecutionResult {
  const executionStart = performance.now();
  const startedAt = new Date().toISOString();
  const outputs = new Map<string, unknown>();
  const steps: StepResult[] = [];
  let status: "success" | "error" = "success";
  let error: string | undefined;

  for (const step of engine.steps) {
    const stepStartedAt = new Date().toISOString();
    const stepStart = performance.now();
    const ctx = { rawInput: input, configuration, outputs };
    let stepInput: unknown;
    try {
      stepInput = step.buildInput(ctx);
      const runner = CAPABILITY_RUNNERS[step.capabilityId];
      if (!runner) throw new Error(`no runner registered for capability "${step.capabilityId}"`);
      const output = runner(stepInput);
      outputs.set(step.capabilityId, output);
      steps.push({
        capabilityId: step.capabilityId, input: stepInput, output,
        startedAt: stepStartedAt, durationMs: performance.now() - stepStart,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      steps.push({
        capabilityId: step.capabilityId, input: stepInput, error: message,
        startedAt: stepStartedAt, durationMs: performance.now() - stepStart,
      });
      status = "error";
      error = `step "${step.capabilityId}" failed: ${message}`;
      break; // stop at the first failure — do not run steps against a broken context
    }
  }

  return {
    engineId: engine.id, engineVersion: engine.version, configuration, input, steps, status, error,
    startedAt, durationMs: performance.now() - executionStart,
    provenance: makeProvenance({
      source: `engine:${engine.id}`, operation: "execute", algorithm: engine.version,
      parameters: configuration, corpusVersion: CORPUS_VERSION, engineVersion: ENGINE_VERSION,
      timestamp: startedAt,
    }),
  };
}
