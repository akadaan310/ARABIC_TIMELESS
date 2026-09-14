/**
 * Experiment persistence. The simplest durable mechanism that fits: a
 * single JSON blob in localStorage (via persistence.ts, shared with the
 * custom-Engine store), with a pure in-memory fallback for environments
 * without it (tests, or a browser with storage disabled) — deliberately
 * not a database, not a backend, not infrastructure.
 */
import { createBackend, createMemoryBackend, readJsonList, writeJsonList, type Backend } from "./persistence";
import type { ChallengeOutcome, Experiment } from "./types";

const STORAGE_KEY = "engine-lab.experiments.v1";

export interface ExperimentStore {
  list(): readonly Experiment[];
  get(id: string): Experiment | undefined;
  save(experiment: Experiment): void;
  addChallenge(experimentId: string, outcome: ChallengeOutcome): Experiment | undefined;
  clear(): void;
}

function createStore(backend: Backend): ExperimentStore {
  return {
    list: () => readJsonList<Experiment>(backend).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    get: (id) => readJsonList<Experiment>(backend).find((e) => e.id === id),
    save: (experiment) => {
      const experiments = readJsonList<Experiment>(backend);
      experiments.push(experiment);
      writeJsonList(backend, experiments);
    },
    addChallenge: (experimentId, challengeOutcome) => {
      const experiments = readJsonList<Experiment>(backend);
      const index = experiments.findIndex((e) => e.id === experimentId);
      if (index === -1) return undefined;
      const updated: Experiment = { ...experiments[index], challenges: [...experiments[index].challenges, challengeOutcome] };
      experiments[index] = updated;
      writeJsonList(backend, experiments);
      return updated;
    },
    clear: () => writeJsonList(backend, []),
  };
}

/** Real store for the running app: localStorage when available, otherwise
 * an in-memory store scoped to this module instance (SSR/no-storage). */
export function createExperimentStore(): ExperimentStore {
  return createStore(createBackend(STORAGE_KEY));
}

/** Always in-memory — for unit tests that must not touch real browser
 * storage or leak state between test files. */
export function createInMemoryExperimentStore(): ExperimentStore {
  return createStore(createMemoryBackend());
}
