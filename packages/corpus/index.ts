/**
 * @engine/corpus — Locus / Selection.
 *
 * Confirmed defect class this module exists to prevent (EXTRACTION_LEDGER.md
 * §A2, §A3): both Mirtal and isnaad silently coerce between address
 * granularities. Mirtal infers granularity from tuple arity and once builds
 * a word-level span from an ayah-level hit by grabbing an arbitrary "first 6
 * words" (generate.py:139-140); isnaad's root-index build collapses every
 * word-level occurrence of a root into a single ayah-level locus, discarding
 * the word index before it reaches shipped data (ingest-quran.ts:181-187).
 *
 * Here, granularity is a type-level discriminant, not an inference from which
 * optional fields happen to be populated, and moving between granularities is
 * only ever possible through `project()`, which requires a named
 * `ProjectionRule` and returns Provenance for the projection it performed.
 * There is no implicit/structural path from a coarser to a finer Locus.
 */

import { makeProvenance, type Provenance } from "../provenance";

export type Granularity = "ayah" | "word" | "segment" | "span";

interface LocusBase {
  readonly surah: number;
  readonly ayah: number;
}

export interface AyahLocus extends LocusBase {
  readonly granularity: "ayah";
}

export interface WordLocus extends LocusBase {
  readonly granularity: "word";
  readonly word: number;
}

export interface SegmentLocus extends LocusBase {
  readonly granularity: "segment";
  readonly word: number;
  readonly segment: number;
}

export interface SpanLocus extends LocusBase {
  readonly granularity: "span";
  readonly wordStart: number;
  readonly wordEnd: number;
}

export type Locus = AyahLocus | WordLocus | SegmentLocus | SpanLocus;

export function ayahLocus(surah: number, ayah: number): AyahLocus {
  return { granularity: "ayah", surah, ayah };
}

export function wordLocus(surah: number, ayah: number, word: number): WordLocus {
  return { granularity: "word", surah, ayah, word };
}

export function segmentLocus(
  surah: number, ayah: number, word: number, segment: number,
): SegmentLocus {
  return { granularity: "segment", surah, ayah, word, segment };
}

export function spanLocus(
  surah: number, ayah: number, wordStart: number, wordEnd: number,
): SpanLocus {
  if (wordEnd < wordStart) {
    throw new RangeError(`spanLocus: wordEnd (${wordEnd}) < wordStart (${wordStart})`);
  }
  return { granularity: "span", surah, ayah, wordStart, wordEnd };
}

export function locusKey(locus: Locus): string {
  switch (locus.granularity) {
    case "ayah": return `${locus.surah}:${locus.ayah}`;
    case "word": return `${locus.surah}:${locus.ayah}:${locus.word}`;
    case "segment": return `${locus.surah}:${locus.ayah}:${locus.word}:${locus.segment}`;
    case "span": return `${locus.surah}:${locus.ayah}:${locus.wordStart}-${locus.wordEnd}`;
  }
}

/**
 * A named, explicit rule for moving between granularities. Registering one
 * is the *only* sanctioned way to go from a coarser Locus to a finer one (or
 * vice versa) — there is no structural cast, and `project()` refuses any
 * (from, to) pair without a registered rule.
 */
export interface ProjectionRule<From extends Granularity, To extends Granularity> {
  readonly id: string;
  readonly from: From;
  readonly to: To;
  readonly algorithm: string;
  project(locus: Extract<Locus, { granularity: From }>): Array<Extract<Locus, { granularity: To }>>;
}

const RULES = new Map<string, ProjectionRule<Granularity, Granularity>>();

export function registerProjection<From extends Granularity, To extends Granularity>(
  rule: ProjectionRule<From, To>,
): void {
  RULES.set(`${rule.from}->${rule.to}`, rule as unknown as ProjectionRule<Granularity, Granularity>);
}

export interface ProjectionResult<To extends Granularity> {
  readonly result: ReadonlyArray<Extract<Locus, { granularity: To }>>;
  readonly provenance: Provenance;
}

/**
 * Project a Locus to a different granularity. Throws if no ProjectionRule is
 * registered for the (from, to) pair — this is intentional: an unregistered
 * projection must fail loudly rather than silently fabricate an address, the
 * exact failure mode documented in Mirtal (generate.py:139-140).
 */
export function project<From extends Granularity, To extends Granularity>(
  locus: Extract<Locus, { granularity: From }>,
  to: To,
  engineVersion: string,
  corpusVersion: string,
): ProjectionResult<To> {
  const rule = RULES.get(`${locus.granularity}->${to}`) as
    | ProjectionRule<From, To>
    | undefined;
  if (!rule) {
    throw new Error(
      `project: no ProjectionRule registered for ${locus.granularity} -> ${to}. ` +
      `Refusing to fabricate an address (see Mirtal generate.py:139-140 for the defect this guards against).`,
    );
  }
  const result = rule.project(locus);
  return {
    result,
    provenance: makeProvenance({
      source: locusKey(locus),
      operation: "project",
      algorithm: rule.algorithm,
      parameters: { from: locus.granularity, to, ruleId: rule.id },
      corpusVersion,
      engineVersion,
    }),
  };
}

/** Sayyarah's قَبْضة (grip) — PROPOSED, ledger A4. Every Operation takes and
 * returns a Selection, never a bare Locus. Richer than the mission brief's
 * minimum granularity list: adds attribute-indexed and arbitrary-union
 * selections as first-class forms rather than afterthoughts. */
export type Selection<G extends Granularity = Granularity> =
  | { readonly kind: "locus"; readonly locus: Extract<Locus, { granularity: G }> }
  | { readonly kind: "span"; readonly loci: ReadonlyArray<Extract<Locus, { granularity: G }>> }
  | { readonly kind: "collection"; readonly loci: ReadonlyArray<Locus> }
  | { readonly kind: "root-indexed"; readonly root: string }
  | { readonly kind: "attribute-indexed"; readonly attribute: string; readonly value: string };

/**
 * Coordinate -> placed-target join with coverage accounting. Ported from
 * isnaad's LocusJoin/buildLocusJoin (src/lib/cosmos/locus.ts) and
 * measureCoverage (src/lib/cosmos/coverage.ts), generalized past
 * ayah-only addressing.
 */
export interface LocusJoin<TTarget> {
  readonly placed: ReadonlyMap<string, TTarget>;
  readonly collisions: ReadonlyArray<{ key: string; discarded: TTarget }>;
}

export function buildLocusJoin<TTarget>(
  entries: ReadonlyArray<{ locus: Locus; target: TTarget }>,
): LocusJoin<TTarget> {
  const placed = new Map<string, TTarget>();
  const collisions: Array<{ key: string; discarded: TTarget }> = [];
  for (const { locus, target } of entries) {
    const key = locusKey(locus);
    if (placed.has(key)) {
      collisions.push({ key, discarded: target }); // first placement wins, per isnaad
    } else {
      placed.set(key, target);
    }
  }
  return { placed, collisions };
}

export interface CoverageReport {
  readonly declared: number;
  readonly indexed: number;
  readonly placed: number;
  readonly gated: number;
}

/** Accounting pattern from isnaad's measureCoverage — explicitly designed to
 * avoid conflating occurrences/loci/findings/drawable-pairs. */
export function measureCoverage(counts: {
  declared: number; indexed: number; placed: number; gated: number;
}): CoverageReport {
  return { ...counts };
}
