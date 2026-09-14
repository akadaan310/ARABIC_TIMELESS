/**
 * @engine/relation — converged from two independent sources
 * (EXTRACTION_LEDGER.md §B): isnaad's Strand (typed endpoints, weight,
 * structured per-kind evidence) and Mirtal's evidence-bearing relation tuple
 * (target, kind, evidence, weight, epistemic type, score, proximity tier).
 *
 * `epistemicType` is Mirtal's نصّي/إدراكي distinction (sabab.py:7,
 * ops.py:5) — confirmed real and load-bearing there (it survives every
 * serialization boundary: Python tuple -> JSON int -> JS label), and
 * confirmed ABSENT from isnaad's Strand. Mission §6 requires it survive as
 * an epistemic-type distinction; this is that field.
 */

import type { Locus } from "../corpus";
import type { Provenance } from "../provenance";

/** نصّي (settled by the text alone) | إدراكي (perceptual — not settled by
 * the text alone; Mirtal's own in-code comment on `tajanus`, sabab.py:129). */
export type EpistemicType = "textual" | "perceptual";

export interface Relation<TEvidence = unknown> {
  readonly id: string;
  /** extensible, not a closed enum — Mission §6 explicitly forbids
   * hard-coding every future research relation into one union */
  readonly kind: string;
  readonly endpoints: readonly [Locus, Locus];
  readonly weight: number;
  readonly evidence: TEvidence;
  readonly epistemicType: EpistemicType;
  readonly provenance: Provenance;
}

export interface RelationKindDescriptor {
  readonly kind: string;
  readonly label: { readonly en: string; readonly ar?: string };
  readonly description: string;
}

/**
 * Extensibility is enforced by convention (a registry), not by the type
 * system closing the set — the same discovery-by-registration pattern as
 * arabic-timeless's own layer registry (lib/engine/registry.ts).
 */
const KIND_REGISTRY = new Map<string, RelationKindDescriptor>();

export function registerRelationKind(descriptor: RelationKindDescriptor): void {
  KIND_REGISTRY.set(descriptor.kind, descriptor);
}

export function relationKinds(): RelationKindDescriptor[] {
  return [...KIND_REGISTRY.values()];
}

export function relationKind(kind: string): RelationKindDescriptor | undefined {
  return KIND_REGISTRY.get(kind);
}
