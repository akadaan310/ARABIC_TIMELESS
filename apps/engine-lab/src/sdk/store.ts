/**
 * Experiment persistence. The simplest durable mechanism that fits: a
 * single JSON blob in localStorage, with a pure in-memory fallback for
 * environments without it (tests, or a browser with storage disabled) —
 * deliberately not a database, not a backend, not infrastructure.
 */
import type { ChallengeOutcome, Experiment } from "./types";

const STORAGE_KEY = "engine-lab.experiments.v1";

export interface ExperimentStore {
  list(): readonly Experiment[];
  get(id: string): Experiment | undefined;
  save(experiment: Experiment): void;
  addChallenge(experimentId: string, outcome: ChallengeOutcome): Experiment | undefined;
  clear(): void;
}

interface Backend {
  read(): string | null;
  write(value: string): void;
}

function memoryBackend(): Backend {
  let value: string | null = null;
  return { read: () => value, write: (v) => { value = v; } };
}

function localStorageBackend(): Backend | undefined {
  try {
    const probe = "__engine_lab_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return {
      read: () => window.localStorage.getItem(STORAGE_KEY),
      write: (v) => window.localStorage.setItem(STORAGE_KEY, v),
    };
  } catch {
    return undefined; // storage disabled or unavailable — fall back to memory
  }
}

function createStore(backend: Backend): ExperimentStore {
  const load = (): Experiment[] => {
    const raw = backend.read();
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Experiment[];
    } catch {
      return [];
    }
  };
  const persist = (experiments: readonly Experiment[]) => backend.write(JSON.stringify(experiments));

  return {
    list: () => load().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    get: (id) => load().find((e) => e.id === id),
    save: (experiment) => {
      const experiments = load();
      experiments.push(experiment);
      persist(experiments);
    },
    addChallenge: (experimentId, challengeOutcome) => {
      const experiments = load();
      const index = experiments.findIndex((e) => e.id === experimentId);
      if (index === -1) return undefined;
      const updated: Experiment = { ...experiments[index], challenges: [...experiments[index].challenges, challengeOutcome] };
      experiments[index] = updated;
      persist(experiments);
      return updated;
    },
    clear: () => backend.write(JSON.stringify([])),
  };
}

/** Real store for the running app: localStorage when available, otherwise
 * an in-memory store scoped to this module instance (SSR/no-storage). */
export function createExperimentStore(): ExperimentStore {
  const backend = typeof window !== "undefined" ? localStorageBackend() : undefined;
  return createStore(backend ?? memoryBackend());
}

/** Always in-memory — for unit tests that must not touch real browser
 * storage or leak state between test files. */
export function createInMemoryExperimentStore(): ExperimentStore {
  return createStore(memoryBackend());
}
