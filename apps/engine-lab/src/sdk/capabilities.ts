/**
 * The capability registry. Every entry wraps a real, already-tested Engine
 * SDK function — nothing here is mocked. Registration goes through the
 * SDK's own @engine/capability package (Capability/registerCapability/
 * capabilities), so "what can be composed" is a live read of real SDK
 * state, not a hard-coded application feature list — this is what
 * ENGINE-LAB.md and the mission prompt both ask for under "capability
 * discovery": capability -> possible composition -> Engine.
 */
import {
  registerCapability, capabilities as sdkCapabilities, type Capability,
} from "../../../../packages/capability/index";
import {
  buildLocusJoin, measureCoverage, locusKey, type LocusJoin, type CoverageReport,
} from "../../../../packages/corpus/index";
import {
  verifyInvertibility, type Observable, type Transform, type InvertibilityReport,
} from "../../../../packages/arabic/index";
import {
  registerRelationKind, type Relation,
} from "../../../../packages/relation/index";
import { makeProvenance, type Provenance, type BoundSignature } from "../../../../packages/provenance/index";
import {
  reconcileState, type Discovery, type DiscoveryState,
} from "../../../../packages/discovery/index";
import { describeStructure, type Structure, type Vec3 } from "../../../../packages/structure/index";
import { measureBasis, type BasisEvaluation, type RelationEdge } from "../../../../packages/spatial/index";
import { walk, type Traversal } from "../../../../packages/traversal/index";
import type { LabNode } from "./labNode";

export const ENGINE_VERSION = "0.1.0";
export const CORPUS_VERSION = "synthetic-lab-1.0";

registerRelationKind({
  kind: "shared-skeleton",
  label: { en: "Shared skeleton" },
  description: "two subjects reduce to the same sorted-unique-letter set",
});

// ---------------------------------------------------------------------------
// capability: corpus.join
// ---------------------------------------------------------------------------

export interface CorpusJoinInput { readonly nodes: readonly LabNode[] }
export interface CorpusJoinOutput {
  readonly join: LocusJoin<LabNode>;
  readonly coverage: CoverageReport;
}

export function runCorpusJoin(input: CorpusJoinInput): CorpusJoinOutput {
  const join = buildLocusJoin(input.nodes.map((n) => ({ locus: n.locus, target: n })));
  const coverage = measureCoverage({
    declared: input.nodes.length,
    indexed: input.nodes.length,
    placed: join.placed.size,
    gated: input.nodes.length - join.placed.size,
  });
  return { join, coverage };
}

registerCapability({
  id: "corpus.join", label: { en: "Locus join" }, substrate: "@engine/corpus",
  operators: ["buildLocusJoin", "measureCoverage"],
  input: "LabNode[]", output: "LocusJoin<LabNode> + CoverageReport",
  constraints: ["first placement wins on duplicate locus"],
  reversible: false, provenance: "packages/corpus", status: "KNOWN",
});

// ---------------------------------------------------------------------------
// capability: arabic.skeleton (an Observable over plain strings)
// ---------------------------------------------------------------------------

export const skeletonObservable: Observable<string, string> = {
  id: "skeleton", label: { en: "Skeleton" },
  compute: (s) => [...new Set(s.split(""))].sort().join(""),
  serialize: (v) => v, display: (v) => v,
  lossAccounting: { preserved: ["letter identity"], discarded: ["order", "repetition count"] },
};

export interface SkeletonInput { readonly subjects: readonly string[] }
export interface SkeletonReading { readonly subject: string; readonly skeleton: string }
export interface SkeletonOutput { readonly readings: readonly SkeletonReading[] }

export function runSkeleton(input: SkeletonInput): SkeletonOutput {
  return { readings: input.subjects.map((subject) => ({ subject, skeleton: skeletonObservable.compute(subject) })) };
}

registerCapability({
  id: "arabic.skeleton", label: { en: "Skeleton observable" }, substrate: "@engine/arabic",
  operators: ["Observable.compute"],
  input: "string[]", output: "{subject, skeleton}[]",
  constraints: [], reversible: false, provenance: "packages/arabic", status: "KNOWN",
});

// ---------------------------------------------------------------------------
// capability: arabic.verifyReverse / arabic.verifyTruncate
// (two real Transforms — one genuinely invertible, one falsely claimed —
//  so the challenge system has both a real PASS and a real FAIL to show)
// ---------------------------------------------------------------------------

export const reverseTransform: Transform<string> = {
  id: "reverse", label: { en: "Reverse" }, apply: (s) => [...s].reverse().join(""),
  invertibilityClaim: "invertible", lossAccounting: { preserved: ["all"], discarded: [] },
};

export const truncateTransform: Transform<string> = {
  id: "truncate-last", label: { en: "Truncate last character (falsely claims invertible)" },
  apply: (s) => s.slice(0, -1),
  invertibilityClaim: "invertible", lossAccounting: { preserved: ["prefix"], discarded: ["last character"] },
};

export interface VerifyTransformInput { readonly subjects: readonly string[]; readonly transformId: "reverse" | "truncate-last" }
export type VerifyTransformOutput = InvertibilityReport<string>;

export function runVerifyTransform(input: VerifyTransformInput): VerifyTransformOutput {
  const transform = input.transformId === "reverse" ? reverseTransform : truncateTransform;
  return verifyInvertibility({
    transformId: transform.id, claim: transform.invertibilityClaim,
    apply: transform.apply,
    // "truncate-last" is deliberately given the WRONG inverse (re-append a
    // fixed placeholder) to demonstrate refutation with real counterexamples
    // rather than fabricating a verdict — see ChallengePanel.
    invert: transform.id === "reverse" ? reverseTransform.apply : (s) => `${s}?`,
    samples: input.subjects, equals: (a, b) => a === b,
  });
}

registerCapability({
  id: "arabic.verifyTransform", label: { en: "Verify transform invertibility" }, substrate: "@engine/arabic",
  operators: ["verifyInvertibility"],
  input: "{subjects, transformId}", output: "InvertibilityReport",
  constraints: ["verdict is 'unverifiable' when no inverse is supplied — never a silent pass"],
  reversible: false, provenance: "packages/arabic", status: "KNOWN",
});

// ---------------------------------------------------------------------------
// capability: relation.detectSharedSkeleton
// ---------------------------------------------------------------------------

export interface DetectSharedSkeletonInput { readonly join: LocusJoin<LabNode> }
export interface DetectSharedSkeletonOutput { readonly relations: readonly Relation<{ skeleton: string }>[] }

export function runDetectSharedSkeleton(input: DetectSharedSkeletonInput): DetectSharedSkeletonOutput {
  const entries = [...input.join.placed.entries()];
  const relations: Relation<{ skeleton: string }>[] = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [, a] = entries[i];
      const [, b] = entries[j];
      const skelA = skeletonObservable.compute(a.subject);
      const skelB = skeletonObservable.compute(b.subject);
      if (skelA === skelB) {
        relations.push({
          id: `rel-${locusKey(a.locus)}-${locusKey(b.locus)}`,
          kind: "shared-skeleton",
          endpoints: [a.locus, b.locus],
          weight: 1,
          evidence: { skeleton: skelA },
          epistemicType: "textual",
          provenance: makeProvenance({
            source: "corpus.join", operation: "detect", algorithm: "shared-skeleton-match",
            corpusVersion: CORPUS_VERSION, engineVersion: ENGINE_VERSION,
            bounds: { pairsScanned: (entries.length * (entries.length - 1)) / 2 },
          }),
        });
      }
    }
  }
  return { relations };
}

registerCapability({
  id: "relation.detectSharedSkeleton", label: { en: "Detect shared-skeleton relations" }, substrate: "@engine/relation",
  operators: ["registerRelationKind"],
  input: "LocusJoin<LabNode>", output: "Relation[]",
  constraints: ["exhaustive over all pairs in the join — O(n^2)"],
  reversible: false, provenance: "packages/relation + packages/provenance", status: "KNOWN",
});

// ---------------------------------------------------------------------------
// capability: discovery.wrap
// ---------------------------------------------------------------------------

export interface DiscoveryWrapInput {
  readonly relations: readonly Relation<{ skeleton: string }>[];
  /** node count the relation scan was exhaustive over — a plain number so
   * this capability composes on a single scalar config port; wrapped into a
   * real BoundSignature internally. */
  readonly boundsNodeCount: number;
}
export interface DiscoveryWrapOutput { readonly discoveries: readonly Discovery<Relation>[] }

export function runDiscoveryWrap(input: DiscoveryWrapInput): DiscoveryWrapOutput {
  const bounds: BoundSignature = { nodeCount: input.boundsNodeCount };
  const discoveries = input.relations.map((relation, i): Discovery<Relation> => ({
    id: `disc-${i}-${relation.id}`,
    generatedBy: "relation.detectSharedSkeleton",
    parents: [relation.id],
    score: relation.weight,
    bounds,
    engineVersion: ENGINE_VERSION,
    corpusVersion: CORPUS_VERSION,
    evidence: relation,
    epistemicType: relation.epistemicType,
    state: "EXHAUSTED", // a full O(n^2) scan was actually run — see relation.detectSharedSkeleton
    provenance: relation.provenance,
  }));
  return { discoveries };
}

/** Re-check every discovery's EXHAUSTED claim against a (possibly different)
 * bound signature — the exact bound-relative demotion rule ported from
 * Mirtal (packages/discovery §D2/§D3). Used by the parameter-sensitivity
 * challenge, not part of the default pipeline. */
export function reconcileDiscoveries(
  discoveries: readonly Discovery<Relation>[],
  currentBounds: BoundSignature,
): readonly { readonly id: string; readonly state: DiscoveryState }[] {
  return discoveries.map((d) => ({ id: d.id, state: reconcileState(d, currentBounds) }));
}

registerCapability({
  id: "discovery.wrap", label: { en: "Wrap relations as bound-relative discoveries" }, substrate: "@engine/discovery",
  operators: ["reconcileState", "summarize"],
  input: "{relations, boundsNodeCount}", output: "Discovery[]",
  constraints: ["EXHAUSTED is only ever valid relative to the bound signature it was computed under"],
  reversible: false, provenance: "packages/discovery", status: "KNOWN",
});

// ---------------------------------------------------------------------------
// capability: structure.classify
// ---------------------------------------------------------------------------

export interface StructureClassifyInput {
  readonly nodes: readonly LabNode[];
  readonly supportingRelations: readonly Relation[];
}
export type StructureClassifyOutput = Structure;

export function runStructureClassify(input: StructureClassifyInput): StructureClassifyOutput {
  const n = input.nodes.length;
  const possiblePairs = n > 1 ? (n * (n - 1)) / 2 : 1;
  const confidence = Math.min(1, input.supportingRelations.length / possiblePairs);
  return describeStructure({
    members: input.nodes.map((n) => locusKey(n.locus)),
    points: input.nodes.map((n) => n.position),
    basisId: "lab-default", algorithm: "pca-jacobi",
    parameters: { pointCount: n },
    confidence,
    supportingRelations: input.supportingRelations.map((r) => r.id),
  });
}

registerCapability({
  id: "structure.classify", label: { en: "PCA shape classification" }, substrate: "@engine/structure",
  operators: ["shapeOf", "describeStructure"],
  input: "{nodes, supportingRelations}", output: "Structure",
  constraints: ["confidence = supportingRelations / possiblePairs, always attached"],
  reversible: false, provenance: "packages/structure", status: "KNOWN",
});

// ---------------------------------------------------------------------------
// capability: spatial.evaluateBasis
// ---------------------------------------------------------------------------

export interface EvaluateBasisInput {
  readonly nodes: readonly LabNode[];
  readonly relations: readonly Relation[];
  readonly seed?: number;
  readonly sampleSize?: number;
}
export type EvaluateBasisOutput = BasisEvaluation;

export function runEvaluateBasis(input: EvaluateBasisInput): EvaluateBasisOutput {
  const positions: Vec3[] = input.nodes.map((n) => n.position);
  const indexByKey = new Map(input.nodes.map((n, i) => [locusKey(n.locus), i]));
  const edges: RelationEdge[] = [];
  for (const r of input.relations) {
    const a = indexByKey.get(locusKey(r.endpoints[0]));
    const b = indexByKey.get(locusKey(r.endpoints[1]));
    if (a !== undefined && b !== undefined) edges.push({ a, b, kind: r.kind });
  }
  return measureBasis(positions, edges, {
    seed: input.seed ?? 12345, sampleSize: input.sampleSize ?? 5000,
  });
}

registerCapability({
  id: "spatial.evaluateBasis", label: { en: "Null-model locality evaluation" }, substrate: "@engine/spatial",
  operators: ["measureBasis"],
  input: "{nodes, relations, seed?, sampleSize?}", output: "BasisEvaluation",
  constraints: ["deterministic given seed", "locality = medianRelated / medianRandom"],
  reversible: false, provenance: "packages/spatial", status: "KNOWN",
});

// ---------------------------------------------------------------------------
// capability: traversal.walk
// ---------------------------------------------------------------------------

export interface TraversalWalkInput {
  readonly nodes: readonly LabNode[];
  readonly relations: readonly Relation[];
  readonly seedLocusKey: string;
  readonly maxSteps: number;
}
export type TraversalWalkOutput = Traversal<string>;

export function runTraversalWalk(input: TraversalWalkInput): TraversalWalkOutput {
  const adjacency = new Map<string, Array<{ to: string; relationId: string; weight: number }>>();
  const addEdge = (from: string, to: string, relationId: string, weight: number) => {
    const list = adjacency.get(from) ?? [];
    list.push({ to, relationId, weight });
    adjacency.set(from, list);
  };
  for (const r of input.relations) {
    const [a, b] = r.endpoints.map(locusKey);
    addEdge(a, b, r.id, r.weight);
    addEdge(b, a, r.id, r.weight); // relations are undirected here
  }
  const seed = input.nodes.find((n) => locusKey(n.locus) === input.seedLocusKey);
  if (!seed) throw new Error(`traversal.walk: no node with locus key ${input.seedLocusKey}`);

  return walk<string>("shared-skeleton-walk", {
    seed: input.seedLocusKey, maxSteps: input.maxSteps,
    candidates: (state, recent) =>
      (adjacency.get(state) ?? [])
        .filter((e) => !recent.includes(e.relationId))
        .map((e) => ({
          operationId: e.relationId, output: e.to, relationsTraversed: [e.relationId], score: e.weight,
        })),
  });
}

registerCapability({
  id: "traversal.walk", label: { en: "Bounded greedy relation walk" }, substrate: "@engine/traversal",
  operators: ["walk", "replay", "joinWith"],
  input: "{nodes, relations, seedLocusKey, maxSteps}", output: "Traversal<string>",
  constraints: ["deterministic: candidate scoring uses only relation.weight, no randomness"],
  reversible: false, provenance: "packages/traversal", status: "KNOWN",
});

// ---------------------------------------------------------------------------

/** Live read of every registered capability — this is what the
 * CapabilitiesPanel renders. Not a hard-coded list. */
export function listCapabilities(): readonly Capability[] {
  return sdkCapabilities();
}

export type { Provenance };
