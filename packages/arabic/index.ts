/**
 * @engine/arabic — Observable<T> / Transform, generalized from this repo's
 * own lib/engine/types.ts (EXTRACTION_LEDGER.md §F).
 *
 * Confirmed by direct source reading, not assumed from the name:
 * `Observable<T>` here (lib/engine/types.ts:96-108) is real, well-tested,
 * and matches the mission's requirement closely — it is generalized below
 * from `compute(word: Word)` to `compute(subject: TSubject)`.
 *
 * `Transform` (lib/engine/types.ts:110-118) is materially thinner than its
 * billing: only 6 instances exist in the whole app, all `invertible: true`,
 * and — confirmed by exhaustive repo-wide search — NOTHING anywhere applies
 * a transform, inverts it, and compares to the original. `verifyInvertibility`
 * below is the generic verification utility Mission §5 explicitly requires
 * ("a transform may not simply declare itself invertible and be trusted")
 * and which existed nowhere in any of the three source repos (ledger §F5,
 * a confirmed GAP). See lib/engine/__tests__/engine-sdk-invertibility.test.ts
 * for it running against this repo's own real transforms.
 */

export interface LossAccounting {
  readonly preserved: readonly string[];
  readonly discarded: readonly string[];
}

export interface Observable<TSubject, TValue> {
  readonly id: string;
  readonly label: { readonly en: string; readonly ar?: string };
  compute(subject: TSubject): TValue;
  /** stable string form, for invariance comparison */
  serialize(value: TValue): string;
  /** human-readable form, for display */
  display(value: TValue): string;
  readonly lossAccounting: LossAccounting;
}

export type InvertibilityClaim = "invertible" | "lossy" | "unknown";

export interface Transform<TIn, TOut = TIn> {
  readonly id: string;
  readonly label: { readonly en: string; readonly ar?: string };
  apply(input: TIn): TOut;
  readonly invertibilityClaim: InvertibilityClaim;
  readonly lossAccounting: LossAccounting;
}

export interface InvertibilityCounterexample<T> {
  readonly input: T;
  readonly output: unknown;
  readonly recovered: T;
}

export type InvertibilityVerdict = "confirmed" | "refuted" | "unverifiable";

export interface InvertibilityReport<T> {
  readonly transformId: string;
  readonly claim: InvertibilityClaim;
  readonly samplesTotal: number;
  readonly samplesPassed: number;
  readonly counterexamples: ReadonlyArray<InvertibilityCounterexample<T>>;
  readonly verdict: InvertibilityVerdict;
}

export interface VerifyInvertibilityParams<TIn, TOut> {
  readonly transformId: string;
  readonly claim: InvertibilityClaim;
  readonly apply: (input: TIn) => TOut;
  /**
   * The proposed inverse, deterministic and requiring no information beyond
   * `output` itself. Omit this when the transform's actual bijection is not
   * exposed by its public interface (e.g. it depends on an internal random
   * map the caller cannot recover from the output alone) — the verifier then
   * honestly reports "unverifiable" rather than silently trusting the claim.
   * This is precisely the situation found in 2 of this repo's own 6
   * transforms (`silent`, `permute`) — see the wiring test for both cases.
   */
  readonly invert?: (output: TOut) => TIn;
  readonly samples: readonly TIn[];
  readonly equals: (a: TIn, b: TIn) => boolean;
  readonly maxCounterexamples?: number;
}

/**
 * Test a Transform's declared invertibility against controlled samples by
 * actually applying it, inverting the result, and comparing to the original
 * — the specific generic utility Mission §5 requires and which no repo in
 * the evidence base implements for Transform (arabic-timeless's own
 * `invariance.ts` tests a related but different property: whether an
 * Observable's *reading* is blind to a Transform, not whether the Transform
 * itself round-trips — see lib/engine/invariance.ts).
 */
export function verifyInvertibility<TIn, TOut>(
  params: VerifyInvertibilityParams<TIn, TOut>,
): InvertibilityReport<TIn> {
  const { transformId, claim, apply, invert, samples, equals } = params;
  const maxCounterexamples = params.maxCounterexamples ?? 5;

  if (!invert) {
    return {
      transformId, claim,
      samplesTotal: samples.length,
      samplesPassed: 0,
      counterexamples: [],
      verdict: "unverifiable",
    };
  }

  let passed = 0;
  const counterexamples: InvertibilityCounterexample<TIn>[] = [];
  for (const input of samples) {
    const output = apply(input);
    const recovered = invert(output);
    if (equals(input, recovered)) {
      passed++;
    } else if (counterexamples.length < maxCounterexamples) {
      counterexamples.push({ input, output, recovered });
    }
  }

  return {
    transformId, claim,
    samplesTotal: samples.length,
    samplesPassed: passed,
    counterexamples,
    verdict: passed === samples.length ? "confirmed" : "refuted",
  };
}

/**
 * Cross-product Observable x Transform invariance sampler. Generalized from
 * arabic-timeless's own real, live, UI-wired `buildInvarianceTable`
 * (lib/engine/invariance.ts) — the algorithm (sample -> serialize-before ->
 * apply -> serialize-after -> compare) is generic; only its hardcoding to
 * `Word` is removed here.
 */
export type InvarianceVerdict = "invariant" | "changes" | "undefined";

export interface InvarianceCell {
  readonly observableId: string;
  readonly transformId: string;
  readonly verdict: InvarianceVerdict;
  readonly trials: number;
}

export function checkInvariance<TSubject, TValue>(
  observable: Observable<TSubject, TValue>,
  transform: Transform<TSubject, TSubject>,
  samples: readonly TSubject[],
): InvarianceCell {
  let trials = 0;
  for (const subject of samples) {
    let before: string, after: string;
    try {
      before = observable.serialize(observable.compute(subject));
      after = observable.serialize(observable.compute(transform.apply(subject)));
    } catch {
      return { observableId: observable.id, transformId: transform.id, verdict: "undefined", trials };
    }
    trials++;
    if (before !== after) {
      return { observableId: observable.id, transformId: transform.id, verdict: "changes", trials };
    }
  }
  return { observableId: observable.id, transformId: transform.id, verdict: "invariant", trials };
}
