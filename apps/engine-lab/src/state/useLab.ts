import { useCallback, useMemo, useState } from "react";
import { listEngines, getEngine, saveCustomEngine } from "../sdk/engines";
import { executeEngine } from "../sdk/execute";
import { challengesFor, runChallenge } from "../sdk/challenges";
import { createExperimentStore } from "../sdk/store";
import { deriveEngineStatus } from "../sdk/status";
import { discoverEngineCandidates, analyzeCompositions } from "../sdk/discovery";
import { listCapabilities } from "../sdk/capabilities";
import { deriveConfigFields } from "../sdk/ports";
import {
  emptyDraft, compatibilityFor, addStep as composerAddStep, removeLastStep, canSwap, swapSteps,
  type ComposerDraft,
} from "../sdk/composer";
import type { PortBinding } from "../sdk/ports";
import type { ChallengeOutcome, ExecutionResult, Experiment } from "../sdk/types";

const store = createExperimentStore();

export function useLab() {
  const [engineVersion, setEngineVersion] = useState(0); // bump to re-read listEngines() after a save
  const engines = useMemo(() => listEngines(), [engineVersion]);
  const capabilities = listCapabilities();
  const [selectedEngineId, setSelectedEngineId] = useState(engines[0]?.id ?? "");
  const selectedEngine = getEngine(selectedEngineId) ?? engines[0];

  const [configuration, setConfiguration] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(deriveConfigFields(selectedEngine?.steps ?? []).map((f) => [f.key, f.default])),
  );
  const [lastResult, setLastResult] = useState<ExecutionResult | undefined>();
  const [lastChallenges, setLastChallenges] = useState<readonly ChallengeOutcome[]>([]);
  const [experiments, setExperiments] = useState<readonly Experiment[]>(() => store.list());
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | undefined>();

  const selectEngine = useCallback((id: string) => {
    setSelectedEngineId(id);
    const engine = getEngine(id);
    setConfiguration(Object.fromEntries(deriveConfigFields(engine?.steps ?? []).map((f) => [f.key, f.default])));
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
  const compositions = useMemo(() => analyzeCompositions(engines, experiments), [engines, experiments]);

  // --- Composer (Step 4) ---------------------------------------------------
  const [draft, setDraft] = useState<ComposerDraft>(emptyDraft());
  const [engineName, setEngineName] = useState("");

  const addCapability = useCallback((capabilityId: string, overrides?: Readonly<Record<string, PortBinding>>) => {
    const outcome = composerAddStep(draft, capabilityId, overrides);
    if (outcome.added) setDraft(outcome.draft);
    return outcome;
  }, [draft]);

  const removeLast = useCallback(() => setDraft((d) => removeLastStep(d)), []);
  const moveStepUp = useCallback((index: number) => setDraft((d) => (canSwap(d, index) ? swapSteps(d, index) : d)), []);
  const resetDraft = useCallback(() => { setDraft(emptyDraft()); setEngineName(""); }, []);

  const saveDraftAsEngine = useCallback((family?: string) => {
    if (draft.steps.length === 0 || !engineName.trim()) return undefined;
    const saved = saveCustomEngine({
      name: engineName.trim(),
      description: `Composed from ${draft.steps.map((s) => s.capabilityId).join(" → ")}.`,
      steps: draft.steps,
      defaultInput: { nodes: (getEngine("canonical-chain")?.defaultInput as { nodes: unknown })?.nodes },
      family,
    });
    setEngineVersion((v) => v + 1);
    resetDraft();
    selectEngine(saved.id);
    return saved;
  }, [draft, engineName, resetDraft, selectEngine]);

  return {
    engines, capabilities, engineStatuses,
    selectedEngine, selectedEngineId, selectEngine,
    configuration, setConfigField,
    lastResult, lastChallenges, execute, challenge,
    applicableChallenges: lastResult ? challengesFor(lastResult) : [],
    recordExperiment,
    experiments, selectedExperimentId, setSelectedExperimentId,
    replayExperiment,
    candidates, compositions,
    // composer
    draft, compatibilityFor: (capabilityId: string) => compatibilityFor(draft, capabilityId),
    addCapability, removeLast, moveStepUp, canSwap: (index: number) => canSwap(draft, index),
    engineName, setEngineName, saveDraftAsEngine, resetDraft,
  };
}

export type LabState = ReturnType<typeof useLab>;
