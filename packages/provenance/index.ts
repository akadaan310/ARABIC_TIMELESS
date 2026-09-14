/**
 * @engine/provenance — GAP in all three prior-research repos (isnaad, Mirtal,
 * arabic-timeless): none of them has a formal, multi-hop derivation record.
 * See EXTRACTION_LEDGER.md §J. Mirtal's `mirtal.provenance()` is the closest
 * partial analog (per-edge rule+evidence+bound-signature, one-hop only, no
 * corpus version) and is adapted, not copied, here.
 */

/** Every numeric/config limit that gated the computation, serialized so two
 * runs can be compared for staleness. Ported from Mirtal's boundSig()
 * pattern (majra.html), which is real and load-bearing there. */
export type BoundSignature = Readonly<Record<string, string | number | boolean>>;

export interface Provenance {
  readonly source: string;
  readonly operation: string;
  /** multi-hop — Mirtal only ever recorded one hop (from -> to) */
  readonly parents: readonly string[];
  readonly algorithm: string;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly bounds: BoundSignature;
  readonly corpusVersion: string;
  readonly engineVersion: string;
  readonly timestamp?: string;
  /** e.g. Mirtal's "a transition exists under this rule — nothing is
   * asserted about what it means" (majra.html:952) */
  readonly disclaimer?: string;
}

export interface ProvenanceInput {
  source: string;
  operation: string;
  parents?: readonly string[];
  algorithm: string;
  parameters?: Readonly<Record<string, unknown>>;
  bounds?: BoundSignature;
  corpusVersion: string;
  engineVersion: string;
  timestamp?: string;
  disclaimer?: string;
}

export function makeProvenance(input: ProvenanceInput): Provenance {
  return {
    source: input.source,
    operation: input.operation,
    parents: input.parents ?? [],
    algorithm: input.algorithm,
    parameters: input.parameters ?? {},
    bounds: input.bounds ?? {},
    corpusVersion: input.corpusVersion,
    engineVersion: input.engineVersion,
    timestamp: input.timestamp,
    disclaimer: input.disclaimer,
  };
}

/** Two bound signatures match iff every key/value pair is identical.
 * Used by @engine/discovery to decide whether an EXHAUSTED claim is stale. */
export function boundsMatch(a: BoundSignature, b: BoundSignature): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => a[k] === b[k]);
}
