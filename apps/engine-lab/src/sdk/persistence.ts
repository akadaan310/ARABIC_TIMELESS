/**
 * Shared localStorage-with-in-memory-fallback backend, factored out so
 * ExperimentStore and the custom-Engine store don't each reimplement it —
 * "do not duplicate existing functionality" applies to EngineLab's own code
 * too, not only to the SDK.
 */

export interface Backend {
  read(): string | null;
  write(value: string): void;
}

function memoryBackend(): Backend {
  let value: string | null = null;
  return { read: () => value, write: (v) => { value = v; } };
}

function localStorageBackend(storageKey: string): Backend | undefined {
  try {
    const probe = "__engine_lab_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return {
      read: () => window.localStorage.getItem(storageKey),
      write: (v) => window.localStorage.setItem(storageKey, v),
    };
  } catch {
    return undefined; // storage disabled or unavailable — fall back to memory
  }
}

/** Real backend for the running app: localStorage when available, otherwise
 * an in-memory store scoped to this module instance (SSR/no-storage). */
export function createBackend(storageKey: string): Backend {
  const backend = typeof window !== "undefined" ? localStorageBackend(storageKey) : undefined;
  return backend ?? memoryBackend();
}

/** Always in-memory — for unit tests that must not touch real browser
 * storage or leak state between test files. */
export function createMemoryBackend(): Backend {
  return memoryBackend();
}

export function readJsonList<T>(backend: Backend): T[] {
  const raw = backend.read();
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export function writeJsonList<T>(backend: Backend, items: readonly T[]): void {
  backend.write(JSON.stringify(items));
}
