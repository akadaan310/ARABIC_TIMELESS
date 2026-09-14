import { useCallback, useMemo, useState } from "react";
import { listEngines, getEngine } from "../sdk/engines";
import { executeEngine } from "../sdk/execute";
import { challengesFor, runChallenge } from "../sdk/challenges";
import { createExperimentStore } from "../sdk/store";
import { deriveEngineStatus } from "../sdk/status";
import { discoverEngineCandidates } from "../sdk/discovery";
import { listCapabilities } from "../sdk/capabilities";
import type { ChallengeOutcome, ExecutionResult, Experiment } from "../sdk/types";

const store = createExperimentStore();

export function useLab() {
  const engines = listEngines();
  const capabilities = listCapabilities();
  const [selectedEngineId, setSelectedEngineId] = useState(engines[0]?.id ?? "");
  const [configuration, setConfiguration] = useState<Record<string, unknown>>(() =>
    Object.fromEntries((getEngine(engines[0]?.id ?? "")?.configFields ?? []).map((f) => [f.key, f.default])),
  );
  const [lastResult, setLastResult] = useState<ExecutionResult | undefined>();
  const [lastChallenges, setLastChallenges] = useState<readonly ChallengeOutcome[]>([]);
  const [experiments, setExperiments] = useState<readonly Experiment[]>(() => store.list());
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | undefined>();

  const selectedEngine = getEngine(selectedEngineId);

  const selectEngine = useCallback((id: string) => {
    setSelectedEngineId(id);
    const engine = getEngine(id);
    setConfiguration(Object.fromEntries((engine?.configFields ?? []).map((f) => [f.key, f.default])));
    setLastResult(undefined);
    setLastChallenges([]);
  }, []);

  const setConfigField = useCallback((key: string, value: unknown) => {
    setConfiguration((prev) => ({ ...prev, [key]: value }));
  }, []);

  const execute = useCallback(() => {
    if (!selectedEngine) return;
    const result = executeEngine(selectedEngine, selectedEngine.defaultInput, configuration);
    setLastResult(result);
    setLastChallenges([]);
  }, [selectedEngine, configuration]);

  const challenge = useCallback((challengeId: string) => {
    if (!lastResult) return;
    const outcome = runChallenge(challengeId, lastResult);
    setLastChallenges((prev) => [...prev.filter((o) => o.challengeId !== challengeId), outcome]);
  }, [lastResult]);

  const recordExperiment = useCallback(() => {
    if (!selectedEngine || !lastResult) return;
    const experiment: Experiment = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      engineId: selectedEngine.id, engineVersion: selectedEngine.version,
      input: selectedEngine.defaultInput, configuration,
      result: lastResult, challenges: lastChallenges, createdAt: new Date().toISOString(),
    };
    store.save(experiment);
    setExperiments(store.list());
    setSelectedExperimentId(experiment.id);
  }, [selectedEngine, lastResult, configuration, lastChallenges]);

  const replayExperiment = useCallback((experimentId: string): { matches: boolean; replay: ExecutionResult } | undefined => {
    const experiment = store.get(experimentId);
    if (!experiment) return undefined;
    const engine = getEngine(experiment.engineId);
    if (!engine) return undefined;
    const replay = executeEngine(engine, experiment.input, experiment.configuration);
    const strip = (r: ExecutionResult) => r.steps.map((s) => ({ id: s.capabilityId, output: s.output, error: s.error }));
    const matches = JSON.stringify(strip(replay)) === JSON.stringify(strip(experiment.result));
    return { matches, replay };
  }, []);

  const engineStatuses = useMemo(
    () => Object.fromEntries(engines.map((e) => [e.id, deriveEngineStatus(e.id, experiments)])),
    [engines, experiments],
  );

  const candidates = useMemo(() => discoverEngineCandidates(experiments), [experiments]);

  return {
    engines, capabilities, engineStatuses,
    selectedEngine, selectedEngineId, selectEngine,
    configuration, setConfigField,
    lastResult, lastChallenges, execute, challenge,
    applicableChallenges: selectedEngine ? challengesFor(selectedEngine.id) : [],
    recordExperiment,
    experiments, selectedExperimentId, setSelectedExperimentId,
    replayExperiment,
    candidates,
  };
}

export type LabState = ReturnType<typeof useLab>;
