/**
 * The capability CONTRACT layer — what Step 2/3 of the composition milestone
 * calls for. The SDK's own @engine/capability type (`Capability.input`/
 * `output`) is deliberately prose ("LabNode[]", "{nodes, relations}") for
 * human documentation; it carries no machine-checkable type information.
 * That is not an SDK gap to fix (the SDK is domain-agnostic and has no
 * reason to know about EngineLab's port-compatibility needs) — it is
 * exactly the "smallest application-level contract" this task explicitly
 * permits EngineLab to add on top, so composition can determine, for real,
 * whether one capability's output can feed another's input.
 *
 * Every ShapeTag below corresponds to an actual TypeScript type already
 * flowing through packages/* and src/sdk/capabilities.ts — this module adds
 * no new computation, only a queryable description of the computation that
 * already exists.
 */
import type { LabNode } from "./labNode";

export type ShapeTag =
  | "LabNode[]" | "StringList"
  | "LocusJoin" | "CoverageReport"
  | "Relation[]" | "Discovery[]"
  | "Structure" | "BasisEvaluation" | "Traversal"
  | "InvertibilityReport" | "SkeletonReading[]";

export interface DataPortSpec {
  readonly key: string;
  readonly shape: ShapeTag;
  readonly required: boolean;
  /** used when required=false and no binding is supplied */
  readonly defaultValue?: unknown;
}

export interface ConfigPortSpec {
  readonly key: string;
  readonly label: string;
  readonly type: "number" | "string";
  readonly default: number | string;
}

export interface OutputPortSpec {
  /** "$" means the capability's whole return value (it isn't a named-field object) */
  readonly key: string;
  readonly shape: ShapeTag;
}

export interface CapabilityContract {
  readonly capabilityId: string;
  readonly dataPorts: readonly DataPortSpec[];
  readonly configPorts: readonly ConfigPortSpec[];
  readonly outputPorts: readonly OutputPortSpec[];
}

// ---------------------------------------------------------------------------
// Root input. Every Engine's raw input is, canonically, { nodes: LabNode[] }
// — the same fixed small synthetic dataset for every Engine in this
// milestone (see README's disclosed scope boundary). `subjects` is a
// derived root field (every LabNode already carries a subject string), not
// a second, independently-editable raw input — this keeps every capability
// composable against the same one dataset instead of requiring the user to
// somehow supply two unrelated root inputs.
// ---------------------------------------------------------------------------

export const ROOT_FIELDS: Readonly<Record<string, ShapeTag>> = {
  nodes: "LabNode[]",
  subjects: "StringList",
};

export function resolveRootField(rawInput: unknown, field: string): unknown {
  const input = rawInput as { nodes?: readonly LabNode[] };
  if (field === "nodes") return input.nodes;
  if (field === "subjects") return (input.nodes ?? []).map((n) => n.subject);
  throw new Error(`resolveRootField: unknown root field "${field}"`);
}

// ---------------------------------------------------------------------------
// Per-capability contracts — one entry per capability registered in
// capabilities.ts. Field keys match the exact parameter-object keys each
// run* function expects, so a resolved binding can be assigned directly.
// ---------------------------------------------------------------------------

export const CONTRACTS: Readonly<Record<string, CapabilityContract>> = {
  "corpus.join": {
    capabilityId: "corpus.join",
    dataPorts: [{ key: "nodes", shape: "LabNode[]", required: true }],
    configPorts: [],
    outputPorts: [{ key: "join", shape: "LocusJoin" }, { key: "coverage", shape: "CoverageReport" }],
  },
  "arabic.skeleton": {
    capabilityId: "arabic.skeleton",
    dataPorts: [{ key: "subjects", shape: "StringList", required: true }],
    configPorts: [],
    outputPorts: [{ key: "readings", shape: "SkeletonReading[]" }],
  },
  "arabic.verifyTransform": {
    capabilityId: "arabic.verifyTransform",
    dataPorts: [{ key: "subjects", shape: "StringList", required: true }],
    configPorts: [{ key: "transformId", label: "Transform (reverse | truncate-last)", type: "string", default: "reverse" }],
    outputPorts: [{ key: "$", shape: "InvertibilityReport" }],
  },
  "relation.detectSharedSkeleton": {
    capabilityId: "relation.detectSharedSkeleton",
    dataPorts: [{ key: "join", shape: "LocusJoin", required: true }],
    configPorts: [],
    outputPorts: [{ key: "relations", shape: "Relation[]" }],
  },
  "discovery.wrap": {
    capabilityId: "discovery.wrap",
    dataPorts: [{ key: "relations", shape: "Relation[]", required: true }],
    // the fixed default dataset (labNode.ts) always has 6 nodes for this
    // milestone (raw input isn't user-editable yet — see README); a static
    // default is therefore always the honest value, not a guess.
    configPorts: [{ key: "boundsNodeCount", label: "Discovery bound: node count", type: "number", default: 6 }],
    outputPorts: [{ key: "discoveries", shape: "Discovery[]" }],
  },
  "structure.classify": {
    capabilityId: "structure.classify",
    dataPorts: [
      { key: "nodes", shape: "LabNode[]", required: true },
      { key: "supportingRelations", shape: "Relation[]", required: false, defaultValue: [] },
    ],
    configPorts: [],
    outputPorts: [{ key: "$", shape: "Structure" }],
  },
  "spatial.evaluateBasis": {
    capabilityId: "spatial.evaluateBasis",
    dataPorts: [
      { key: "nodes", shape: "LabNode[]", required: true },
      { key: "relations", shape: "Relation[]", required: true },
    ],
    configPorts: [
      { key: "seed", label: "Null-model seed", type: "number", default: 12345 },
      { key: "sampleSize", label: "Null-model sample size", type: "number", default: 2000 },
    ],
    outputPorts: [{ key: "$", shape: "BasisEvaluation" }],
  },
  "traversal.walk": {
    capabilityId: "traversal.walk",
    dataPorts: [
      { key: "nodes", shape: "LabNode[]", required: true },
      { key: "relations", shape: "Relation[]", required: true },
    ],
    configPorts: [
      { key: "seedLocusKey", label: "Traversal seed locus", type: "string", default: "1:1:1" },
      { key: "maxSteps", label: "Traversal max steps", type: "number", default: 5 },
    ],
    outputPorts: [{ key: "$", shape: "Traversal" }],
  },
};

// ---------------------------------------------------------------------------
// Bindings — how one step's input is actually assembled: from the root
// input, or from a named output port of an earlier step in the same chain.
// Never a structural/implicit cast (the same discipline @engine/corpus's
// ProjectionRule enforces for locus granularity, applied here to capability
// composition).
// ---------------------------------------------------------------------------

export type PortBinding =
  | { readonly source: "root"; readonly field: string }
  | { readonly source: "step"; readonly capabilityId: string; readonly port: string };

export interface ExecutionLikeContext {
  readonly rawInput: unknown;
  readonly configuration: Readonly<Record<string, unknown>>;
  readonly outputs: ReadonlyMap<string, unknown>;
}

function resolveBindingValue(binding: PortBinding, ctx: ExecutionLikeContext): unknown {
  if (binding.source === "root") return resolveRootField(ctx.rawInput, binding.field);
  const output = ctx.outputs.get(binding.capabilityId);
  if (output === undefined) {
    throw new Error(`resolveStepInput: capability "${binding.capabilityId}" has not produced output yet`);
  }
  return binding.port === "$" ? output : (output as Record<string, unknown>)[binding.port];
}

/** Assembles one step's input object from its declared bindings (data ports)
 * plus its capability's config ports, read from the Engine's configuration
 * under a namespaced key so two steps (even of the same capability) never
 * collide: `${capabilityId}.${configKey}`. */
export function resolveStepInput(
  capabilityId: string,
  bindings: Readonly<Record<string, PortBinding>>,
  ctx: ExecutionLikeContext,
): Record<string, unknown> {
  const contract = CONTRACTS[capabilityId];
  if (!contract) throw new Error(`resolveStepInput: unknown capability "${capabilityId}"`);

  const input: Record<string, unknown> = {};
  for (const port of contract.dataPorts) {
    const binding = bindings[port.key];
    if (binding) {
      input[port.key] = resolveBindingValue(binding, ctx);
    } else if (!port.required) {
      input[port.key] = port.defaultValue;
    } else {
      throw new Error(`resolveStepInput: missing required binding for port "${port.key}" of "${capabilityId}"`);
    }
  }
  for (const port of contract.configPorts) {
    const namespacedKey = `${capabilityId}.${port.key}`;
    input[port.key] = ctx.configuration[namespacedKey] ?? port.default;
  }
  return input;
}

/** Every config port of every step, namespaced, with its label/type/default
 * — this is what both the curated-engine forms and the Composer render;
 * there is no separately hand-maintained configFields list to keep in sync. */
export interface ConfigField {
  readonly key: string; // namespaced: `${capabilityId}.${portKey}`
  readonly label: string;
  readonly type: "number" | "string";
  readonly default: number | string;
}

export function deriveConfigFields(steps: readonly { readonly capabilityId: string }[]): readonly ConfigField[] {
  const fields: ConfigField[] = [];
  for (const step of steps) {
    const contract = CONTRACTS[step.capabilityId];
    if (!contract) continue;
    for (const port of contract.configPorts) {
      fields.push({ key: `${step.capabilityId}.${port.key}`, label: `${port.label} (${step.capabilityId})`, type: port.type, default: port.default });
    }
  }
  return fields;
}

// ---------------------------------------------------------------------------
// Compatibility — Step 3. Distinguishes compatible / incompatible /
// requires-configuration, based on the actual shape contracts above, never
// on whether two boxes could be visually connected.
// ---------------------------------------------------------------------------

export type CompatibilityStatus = "compatible" | "requires-configuration" | "incompatible";

export interface DataPortResolution {
  readonly portKey: string;
  readonly required: boolean;
  readonly candidates: readonly PortBinding[];
}

export interface CompatibilityResult {
  readonly capabilityId: string;
  readonly status: CompatibilityStatus;
  readonly resolutions: readonly DataPortResolution[];
  readonly missingPorts: readonly string[];
  readonly ambiguousPorts: readonly string[];
}

/** Describes a binding source for display, e.g. "root.nodes" or "structure.classify.$". */
export function describeBinding(binding: PortBinding): string {
  return binding.source === "root" ? `root.${binding.field}` : `${binding.capabilityId}.${binding.port}`;
}

export function evaluateCompatibility(
  chain: readonly { readonly capabilityId: string }[],
  candidateId: string,
): CompatibilityResult {
  const contract = CONTRACTS[candidateId];
  if (!contract) {
    return { capabilityId: candidateId, status: "incompatible", resolutions: [], missingPorts: ["<unknown capability>"], ambiguousPorts: [] };
  }

  const resolutions: DataPortResolution[] = [];
  const missingPorts: string[] = [];
  const ambiguousPorts: string[] = [];

  for (const port of contract.dataPorts) {
    const candidates: PortBinding[] = [];
    for (const [field, shape] of Object.entries(ROOT_FIELDS)) {
      if (shape === port.shape) candidates.push({ source: "root", field });
    }
    for (const step of chain) {
      const stepContract = CONTRACTS[step.capabilityId];
      for (const outPort of stepContract?.outputPorts ?? []) {
        if (outPort.shape === port.shape) candidates.push({ source: "step", capabilityId: step.capabilityId, port: outPort.key });
      }
    }
    resolutions.push({ portKey: port.key, required: port.required, candidates });
    if (candidates.length === 0) {
      if (port.required) missingPorts.push(port.key);
    } else if (candidates.length > 1) {
      ambiguousPorts.push(port.key);
    }
  }

  const status: CompatibilityStatus =
    missingPorts.length > 0 ? "incompatible" : ambiguousPorts.length > 0 ? "requires-configuration" : "compatible";

  return { capabilityId: candidateId, status, resolutions, missingPorts, ambiguousPorts };
}
