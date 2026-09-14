/**
 * Persistence for user-composed Engines (Step 6/7). A saved Engine is never
 * silently overwritten: saving under a `family` that already has versions
 * always creates a NEW version with a new id, so every Experiment that
 * referenced an earlier version keeps resolving to the exact definition
 * that produced it.
 */
import { createBackend, createMemoryBackend, readJsonList, writeJsonList, type Backend } from "./persistence";
import type { EngineDefinition, EngineStep } from "./types";

const STORAGE_KEY = "engine-lab.custom-engines.v1";

export interface SaveEngineInput {
  readonly name: string;
  readonly description: string;
  readonly steps: readonly EngineStep[];
  readonly defaultInput: unknown;
  /** groups versions of "the same" named Engine; omit to start a new family */
  readonly family?: string;
}

export interface CustomEngineStore {
  list(): readonly EngineDefinition[];
  get(id: string): EngineDefinition | undefined;
  save(input: SaveEngineInput): EngineDefinition;
  clear(): void;
}

export function slugify(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || "engine";
}

function createStore(backend: Backend): CustomEngineStore {
  return {
    list: () => readJsonList<EngineDefinition>(backend),
    get: (id) => readJsonList<EngineDefinition>(backend).find((e) => e.id === id),
    save: (input) => {
      const existing = readJsonList<EngineDefinition>(backend);
      const family = input.family ?? slugify(input.name);
      const priorVersions = existing.filter((e) => e.family === family);
      const version = String(priorVersions.length + 1);
      const engine: EngineDefinition = {
        id: `custom-${family}-v${version}`,
        name: input.name,
        version,
        family,
        origin: "composed",
        description: input.description,
        steps: input.steps,
        defaultInput: input.defaultInput,
        createdAt: new Date().toISOString(),
      };
      writeJsonList(backend, [...existing, engine]);
      return engine;
    },
    clear: () => writeJsonList(backend, []),
  };
}

export function createCustomEngineStore(): CustomEngineStore {
  return createStore(createBackend(STORAGE_KEY));
}

export function createInMemoryCustomEngineStore(): CustomEngineStore {
  return createStore(createMemoryBackend());
}
