/**
 * The Engine registry. Every step names a real, registered capability id
 * (validated at module load — see assertKnownCapabilities below) and an
 * explicit input adapter. No engine here invents computation of its own;
 * each is purely a composition + configuration of packages/* functions.
 */
import { locusKey } from "../../../../packages/corpus/index";
import {
  listCapabilities,
  runCorpusJoin, runDetectSharedSkeleton, runDiscoveryWrap,
  runStructureClassify, runEvaluateBasis, runTraversalWalk, runVerifyTransform,
  type CorpusJoinOutput, type DetectSharedSkeletonOutput,
} from "./capabilities";
import { DEFAULT_NODES, type LabNode } from "./labNode";
import type { EngineContext, EngineDefinition } from "./types";

/** capability id -> the function that actually runs it. The only place in
 * the app that casts through `unknown` — every capability's own module
 * keeps full static types on its `run*` function. */
export const CAPABILITY_RUNNERS: Readonly<Record<string, (input: unknown) => unknown>> = {
  "corpus.join": (input) => runCorpusJoin(input as Parameters<typeof runCorpusJoin>[0]),
  "arabic.verifyTransform": (input) => runVerifyTransform(input as Parameters<typeof runVerifyTransform>[0]),
  "relation.detectSharedSkeleton": (input) => runDetectSharedSkeleton(input as Parameters<typeof runDetectSharedSkeleton>[0]),
  "discovery.wrap": (input) => runDiscoveryWrap(input as Parameters<typeof runDiscoveryWrap>[0]),
  "structure.classify": (input) => runStructureClassify(input as Parameters<typeof runStructureClassify>[0]),
  "spatial.evaluateBasis": (input) => runEvaluateBasis(input as Parameters<typeof runEvaluateBasis>[0]),
  "traversal.walk": (input) => runTraversalWalk(input as Parameters<typeof runTraversalWalk>[0]),
};

function assertKnownCapabilities(steps: EngineDefinition["steps"]): void {
  const known = new Set(listCapabilities().map((c) => c.id));
  for (const step of steps) {
    if (!known.has(step.capabilityId)) {
      throw new Error(`Engine references unknown capability "${step.capabilityId}" — refusing to register.`);
    }
    if (!CAPABILITY_RUNNERS[step.capabilityId]) {
      throw new Error(`Capability "${step.capabilityId}" is registered but has no runner wired — refusing to register.`);
    }
  }
}

interface CanonicalInput { readonly nodes: readonly LabNode[] }

const canonicalChain: EngineDefinition = {
  id: "canonical-chain",
  name: "Canonical Chain",
  version: "1.0.0",
  description:
    "corpus.join → relation.detectSharedSkeleton → discovery.wrap → structure.classify → " +
    "spatial.evaluateBasis → traversal.walk — the SDK's own canonical chain (docs/engine-sdk/ARCHITECTURE.md §1), " +
    "run as a single Engine over a small synthetic node set.",
  configFields: [
    { key: "seed", label: "Null-model seed", type: "number", default: 12345 },
    { key: "sampleSize", label: "Null-model sample size", type: "number", default: 2000 },
    { key: "maxSteps", label: "Traversal max steps", type: "number", default: 5 },
    { key: "seedLocusKey", label: "Traversal seed locus", type: "string", default: "1:1:1" },
  ],
  defaultInput: { nodes: DEFAULT_NODES } satisfies CanonicalInput,
  steps: [
    { capabilityId: "corpus.join", buildInput: (ctx) => ({ nodes: (ctx.rawInput as CanonicalInput).nodes }) },
    {
      capabilityId: "relation.detectSharedSkeleton",
      buildInput: (ctx) => ({ join: (ctx.outputs.get("corpus.join") as CorpusJoinOutput).join }),
    },
    {
      capabilityId: "discovery.wrap",
      buildInput: (ctx) => {
        const nodes = (ctx.rawInput as CanonicalInput).nodes;
        const { relations } = ctx.outputs.get("relation.detectSharedSkeleton") as DetectSharedSkeletonOutput;
        return { relations, bounds: { nodeCount: nodes.length } };
      },
    },
    {
      capabilityId: "structure.classify",
      buildInput: (ctx) => {
        const nodes = (ctx.rawInput as CanonicalInput).nodes;
        const { relations } = ctx.outputs.get("relation.detectSharedSkeleton") as DetectSharedSkeletonOutput;
        return { nodes, supportingRelations: relations };
      },
    },
    {
      capabilityId: "spatial.evaluateBasis",
      buildInput: (ctx) => {
        const nodes = (ctx.rawInput as CanonicalInput).nodes;
        const { relations } = ctx.outputs.get("relation.detectSharedSkeleton") as DetectSharedSkeletonOutput;
        return {
          nodes, relations,
          seed: Number(ctx.configuration.seed ?? 12345),
          sampleSize: Number(ctx.configuration.sampleSize ?? 2000),
        };
      },
    },
    {
      capabilityId: "traversal.walk",
      buildInput: (ctx) => {
        const nodes = (ctx.rawInput as CanonicalInput).nodes;
        const { relations } = ctx.outputs.get("relation.detectSharedSkeleton") as DetectSharedSkeletonOutput;
        return {
          nodes, relations,
          seedLocusKey: String(ctx.configuration.seedLocusKey ?? locusKey(nodes[0].locus)),
          maxSteps: Number(ctx.configuration.maxSteps ?? 5),
        };
      },
    },
  ],
};

interface InvertibilityInput { readonly subjects: readonly string[] }

const invertibilityProbe: EngineDefinition = {
  id: "invertibility-probe",
  name: "Invertibility Probe",
  version: "1.0.0",
  description:
    "A single-capability Engine: verify a Transform's declared invertibility against sample subjects. " +
    "Composition is not mandatory — an Engine may wrap exactly one capability.",
  configFields: [
    { key: "transformId", label: "Transform (reverse | truncate-last)", type: "string", default: "reverse" },
  ],
  defaultInput: { subjects: ["abcab", "babca", "xyz", "qrstu"] } satisfies InvertibilityInput,
  steps: [
    {
      capabilityId: "arabic.verifyTransform",
      buildInput: (ctx) => ({
        subjects: (ctx.rawInput as InvertibilityInput).subjects,
        transformId: ctx.configuration.transformId === "truncate-last" ? "truncate-last" : "reverse",
      }),
    },
  ],
};

const shapeProbe: EngineDefinition = {
  id: "shape-probe",
  name: "Shape Probe",
  version: "1.0.0",
  description:
    "corpus.join → structure.classify, with no relation-detection step — confidence is honestly 0 " +
    "(no supporting relations were computed), demonstrating a second, shorter, equally valid composition " +
    "of the same capability set used by Canonical Chain.",
  configFields: [],
  defaultInput: { nodes: DEFAULT_NODES } satisfies CanonicalInput,
  steps: [
    { capabilityId: "corpus.join", buildInput: (ctx) => ({ nodes: (ctx.rawInput as CanonicalInput).nodes }) },
    {
      capabilityId: "structure.classify",
      buildInput: (ctx) => ({ nodes: (ctx.rawInput as CanonicalInput).nodes, supportingRelations: [] }),
    },
  ],
};

const ENGINES: readonly EngineDefinition[] = [canonicalChain, invertibilityProbe, shapeProbe];
for (const engine of ENGINES) assertKnownCapabilities(engine.steps);

export function listEngines(): readonly EngineDefinition[] {
  return ENGINES;
}

export function getEngine(id: string): EngineDefinition | undefined {
  return ENGINES.find((e) => e.id === id);
}

export type { EngineContext };
