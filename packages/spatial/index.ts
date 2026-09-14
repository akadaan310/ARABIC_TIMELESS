/**
 * @engine/spatial — Embedding / Basis / null-model locality evaluator.
 *
 * `measureBasis` is ported near-verbatim from isnaad's real `measureBasis`
 * (src/lib/cosmos/basis.ts:261-322): for a candidate spatial basis, compute
 * the median distance between related endpoints and compare it against the
 * median distance between deterministically-sampled RANDOM pairs (the null
 * model). `locality = medianRelated / medianRandom` — at 1 the basis is
 * blind to structure; below 1, related things really do land closer than
 * chance. This is exactly Mission §9's requirement ("a reusable primitive
 * for evaluating relation locality, random-pair locality, null-model
 * comparison, basis quality") and it is EXISTING, working code, not a
 * proposal (EXTRACTION_LEDGER.md §E3).
 *
 * CONFIRMED DISCREPANCY this package exists to structurally prevent
 * (ledger §E3): in isnaad, the basis actually shipped as the *default* to
 * every viewer is `constellation`, whose own source comment reads
 * "لا يُشتقّ من حسابٍ" — "not derived from any computation." The evaluated,
 * higher-locality bases exist but require a manual UI toggle. Here,
 * `Embedding.evaluation` is a REQUIRED field — an Embedding cannot be
 * constructed without running measureBasis first, so there is no type-level
 * way to ship an unevaluated embedding as if it were validated.
 */

export type { Vec3 } from "../structure";
import type { Vec3 } from "../structure";

export interface Basis {
  readonly id: string;
  readonly label: string;
  readonly note: string;
  /** unit direction per node index */
  readonly directions: readonly Vec3[];
}

export function positionsFor(basis: Basis, radii: readonly number[]): Vec3[] {
  return basis.directions.map((d, i) => {
    const r = radii[i] ?? 0;
    return [d[0] * r, d[1] * r, d[2] * r];
  });
}

export interface RelationEdge {
  readonly a: number;
  readonly b: number;
  readonly kind: string;
}

export interface BasisEvaluation {
  readonly medianByKind: Readonly<Record<string, number>>;
  readonly medianRelated: number;
  readonly medianRandom: number;
  readonly locality: number;
  readonly nullModelSampleSize: number;
  readonly convergences: number;
}

function median(xs: readonly number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export interface MeasureBasisOptions {
  readonly sampleSize?: number;
  readonly seed?: number;
  readonly localRadiusFactor?: number;
  readonly convergenceThreshold?: number;
}

/** Ported verbatim from isnaad's measureBasis — same LCG null-model sampler,
 * same median-ratio locality metric, same convergence definition. */
export function measureBasis(
  positions: readonly Vec3[],
  edges: readonly RelationEdge[],
  options: MeasureBasisOptions = {},
): BasisEvaluation {
  const sampleSize = options.sampleSize ?? 20_000;
  const localRadiusFactor = options.localRadiusFactor ?? 0.18;
  const convergenceThreshold = options.convergenceThreshold ?? 3;

  const dist = (a: number, b: number) =>
    Math.hypot(positions[a][0] - positions[b][0], positions[a][1] - positions[b][1], positions[a][2] - positions[b][2]);

  const byKind = new Map<string, number[]>();
  const allLengths: number[] = [];
  for (const e of edges) {
    const d = dist(e.a, e.b);
    allLengths.push(d);
    const list = byKind.get(e.kind);
    if (list) list.push(d); else byKind.set(e.kind, [d]);
  }

  const n = positions.length;
  const random: number[] = [];
  let seed = options.seed ?? 12345;
  for (let k = 0; k < sampleSize && n > 1; k++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const a = seed % n;
    seed = (seed * 1103515245 + 12345) >>> 0;
    const b = seed % n;
    if (a !== b) random.push(dist(a, b));
  }

  const medianRelated = median(allLengths);
  const medianRandom = median(random);
  const local = medianRandom * localRadiusFactor;

  const families = new Map<number, Set<string>>();
  for (const e of edges) {
    if (dist(e.a, e.b) > local) continue;
    for (const end of [e.a, e.b]) {
      const set = families.get(end) ?? new Set<string>();
      set.add(e.kind);
      families.set(end, set);
    }
  }

  const medianByKind: Record<string, number> = {};
  for (const [k, xs] of byKind) medianByKind[k] = median(xs);

  return {
    medianByKind,
    medianRelated,
    medianRandom,
    locality: medianRandom ? medianRelated / medianRandom : 1,
    nullModelSampleSize: random.length,
    convergences: [...families.values()].filter((s) => s.size >= convergenceThreshold).length,
  };
}

export interface Embedding {
  readonly basisId: string;
  readonly corpusVersion: string;
  readonly algorithm: string;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly coordinates: ReadonlyMap<string, Vec3>;
  /** required — see module doc: no unevaluated Embedding can be constructed */
  readonly evaluation: BasisEvaluation;
}

export function buildEmbedding(input: {
  basis: Basis;
  radii: readonly number[];
  nodeIds: readonly string[];
  edges: readonly RelationEdge[];
  corpusVersion: string;
  algorithm: string;
  parameters?: Readonly<Record<string, unknown>>;
  options?: MeasureBasisOptions;
}): Embedding {
  const positions = positionsFor(input.basis, input.radii);
  const evaluation = measureBasis(positions, input.edges, input.options);
  const coordinates = new Map<string, Vec3>();
  input.nodeIds.forEach((id, i) => coordinates.set(id, positions[i]));
  return {
    basisId: input.basis.id,
    corpusVersion: input.corpusVersion,
    algorithm: input.algorithm,
    parameters: input.parameters ?? {},
    coordinates,
    evaluation,
  };
}
