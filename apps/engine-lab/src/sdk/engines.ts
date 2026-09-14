/**
 * The Engine registry: curated (built-in, immutable) + composed (user-saved,
 * versioned). Every step names a real, registered capability id (validated
 * at module load — see assertKnownCapabilities) and declarative `bindings`
 * (ports.ts) — no engine here invents computation of its own; each is
 * purely a composition + configuration of packages/* functions, and a
 * composed Engine is stored/executed through exactly the same shape and the
 * same executor as a curated one.
 */
import {
  listCapabilities,
  runCorpusJoin, runSkeleton, runDetectSharedSkeleton, runDiscoveryWrap,
  runStructureClassify, runEvaluateBasis, runTraversalWalk, runVerifyTransform,
} from "./capabilities";
import { DEFAULT_NODES } from "./labNode";
import { CONTRACTS } from "./ports";
import { createCustomEngineStore, type SaveEngineInput } from "./customEngineStore";
import type { EngineDefinition, EngineStep } from "./types";

/** capability id -> the function that actually runs it. The only place in
 * the app that casts through `unknown` — every capability's own module
 * keeps full static types on its `run*` function. */
export const CAPABILITY_RUNNERS: Readonly<Record<string, (input: unknown) => unknown>> = {
  "corpus.join": (input) => runCorpusJoin(input as Parameters<typeof runCorpusJoin>[0]),
  "arabic.skeleton": (input) => runSkeleton(input as Parameters<typeof runSkeleton>[0]),
  "arabic.verifyTransform": (input) => runVerifyTransform(input as Parameters<typeof runVerifyTransform>[0]),
  "relation.detectSharedSkeleton": (input) => runDetectSharedSkeleton(input as Parameters<typeof runDetectSharedSkeleton>[0]),
  "discovery.wrap": (input) => runDiscoveryWrap(input as Parameters<typeof runDiscoveryWrap>[0]),
  "structure.classify": (input) => runStructureClassify(input as Parameters<typeof runStructureClassify>[0]),
  "spatial.evaluateBasis": (input) => runEvaluateBasis(input as Parameters<typeof runEvaluateBasis>[0]),
  "traversal.walk": (input) => runTraversalWalk(input as Parameters<typeof runTraversalWalk>[0]),
};

function assertKnownCapabilities(steps: readonly EngineStep[]): void {
  const known = new Set(listCapabilities().map((c) => c.id));
  for (const step of steps) {
    if (!known.has(step.capabilityId)) {
      throw new Error(`Engine references unknown capability "${step.capabilityId}" — refusing to register.`);
    }
    if (!CONTRACTS[step.capabilityId]) {
      throw new Error(`Capability "${step.capabilityId}" has no port contract — refusing to register.`);
    }
    if (!CAPABILITY_RUNNERS[step.capabilityId]) {
      throw new Error(`Capability "${step.capabilityId}" is registered but has no runner wired — refusing to register.`);
    }
  }
}

const BUILT_IN_CREATED_AT = "2025-01-01T00:00:00.000Z";
const DEFAULT_INPUT = { nodes: DEFAULT_NODES };
const root = (field: string) => ({ source: "root" as const, field });
const fromStep = (capabilityId: string, port: string) => ({ source: "step" as const, capabilityId, port });

const canonicalChain: EngineDefinition = {
  id: "canonical-chain", name: "Canonical Chain", version: "1.0.0", family: "canonical-chain",
  origin: "curated", createdAt: BUILT_IN_CREATED_AT,
  description:
    "corpus.join → relation.detectSharedSkeleton → discovery.wrap → structure.classify → " +
    "spatial.evaluateBasis → traversal.walk — the SDK's own canonical chain (docs/engine-sdk/ARCHITECTURE.md §1), " +
    "run as a single Engine over a small synthetic node set.",
  defaultInput: DEFAULT_INPUT,
  steps: [
    { capabilityId: "corpus.join", bindings: { nodes: root("nodes") } },
    { capabilityId: "relation.detectSharedSkeleton", bindings: { join: fromStep("corpus.join", "join") } },
    { capabilityId: "discovery.wrap", bindings: { relations: fromStep("relation.detectSharedSkeleton", "relations") } },
    {
      capabilityId: "structure.classify",
      bindings: { nodes: root("nodes"), supportingRelations: fromStep("relation.detectSharedSkeleton", "relations") },
    },
    {
      capabilityId: "spatial.evaluateBasis",
      bindings: { nodes: root("nodes"), relations: fromStep("relation.detectSharedSkeleton", "relations") },
    },
    {
      capabilityId: "traversal.walk",
      bindings: { nodes: root("nodes"), relations: fromStep("relation.detectSharedSkeleton", "relations") },
    },
  ],
};

const invertibilityProbe: EngineDefinition = {
  id: "invertibility-probe", name: "Invertibility Probe", version: "1.0.0", family: "invertibility-probe",
  origin: "curated", createdAt: BUILT_IN_CREATED_AT,
  description:
    "A single-capability Engine: verify a Transform's declared invertibility against sample subjects. " +
    "Composition is not mandatory — an Engine may wrap exactly one capability.",
  defaultInput: DEFAULT_INPUT,
  steps: [{ capabilityId: "arabic.verifyTransform", bindings: { subjects: root("subjects") } }],
};

const shapeProbe: EngineDefinition = {
  id: "shape-probe", name: "Shape Probe", version: "1.0.0", family: "shape-probe",
  origin: "curated", createdAt: BUILT_IN_CREATED_AT,
  description:
    "corpus.join → structure.classify, with no relation-detection step — confidence is honestly 0 " +
    "(no supporting relations were computed), demonstrating a second, shorter, equally valid composition " +
    "of the same capability set used by Canonical Chain.",
  defaultInput: DEFAULT_INPUT,
  steps: [
    { capabilityId: "corpus.join", bindings: { nodes: root("nodes") } },
    { capabilityId: "structure.classify", bindings: { nodes: root("nodes") } },
  ],
};

const CURATED_ENGINES: readonly EngineDefinition[] = [canonicalChain, invertibilityProbe, shapeProbe];
for (const engine of CURATED_ENGINES) assertKnownCapabilities(engine.steps);

const customEngines = createCustomEngineStore();

export function listEngines(): readonly EngineDefinition[] {
  return [...CURATED_ENGINES, ...customEngines.list()];
}

export function getEngine(id: string): EngineDefinition | undefined {
  return listEngines().find((e) => e.id === id);
}

export function versionsOf(family: string): readonly EngineDefinition[] {
  return listEngines().filter((e) => e.family === family).sort((a, b) => Number(a.version) - Number(b.version));
}

/** Saves a user-composed Engine as a NEW version — never overwrites an
 * existing definition (Step 7). `family` groups versions of "the same"
 * named Engine; omit it to start a brand-new family. */
export function saveCustomEngine(input: SaveEngineInput): EngineDefinition {
  assertKnownCapabilities(input.steps);
  return customEngines.save(input);
}

export function clearCustomEngines(): void {
  customEngines.clear();
}
