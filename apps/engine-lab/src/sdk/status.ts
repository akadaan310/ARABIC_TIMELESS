/**
 * An Engine's registry status is derived from its actual experiment
 * history, never declared. Mission requirement: "Do not imply that an
 * Engine is scientifically validated merely because it runs."
 */
import type { EngineStatus, Experiment } from "./types";

export function deriveEngineStatus(engineId: string, experiments: readonly Experiment[]): EngineStatus {
  const forEngine = experiments.filter((e) => e.engineId === engineId);
  if (forEngine.length === 0) return "experimental";

  const allChallenges = forEngine.flatMap((e) => e.challenges);
  if (allChallenges.length === 0) return "runnable";

  const allPass = allChallenges.every((c) => c.verdict === "PASS");
  return allPass ? "validated" : "challenged";
}
