# ENGINE SDK — Architecture Lock (Phase 2, draft)

> **Hosting decision:** this document was drafted before a destination repo
> was available. The user chose to host the SDK inside this repo
> (arabic-timeless) rather than a new standalone one — see
> `packages/README.md` for what has since been implemented as real, tested
> code (Phase 3, partial) against the shapes locked below, and
> `lib/engine/__tests__/engine-sdk-invertibility.test.ts` for the flagship
> integration: `@engine/arabic`'s `verifyInvertibility` running against this
> repo's own real `Transform` objects, closing the confirmed §5/§F2 gap.

Status: DRAFT — for review before Phase 3 (implementation) begins. Every claim
below is labeled `EXISTING` (working code cited in EXTRACTION_LEDGER.md),
`INFERENCE` (a design decision this document is making, justified by evidence),
`PROPOSED` (Sayyarah vocabulary, unimplemented anywhere), `OSS CANDIDATE`
(external library to adopt/wrap, not yet evaluated), or `UNRESOLVED` (an open
question this document deliberately does not answer yet).

This document does not implement anything. It locks the shape so Phase 3 has
something concrete to build against, per the mission's explicit sequencing
("migration comes after the substrate is trustworthy").

---

## 1. Canonical chain

```
Corpus → Locus → Observable → Transform → Relation → Discovery
  → Structure → Operation → Traversal → Provenance → Materialized view
```

`INFERENCE`, directly supported by evidence: this is not a pipeline where each
stage runs once in order — every one of Isnaad, Mirtal, and Sayyarah independently
converges on some subset of this chain, and the ledger's cross-repo-convergence
section (EXTRACTION_LEDGER.md §"Cross-Repo Convergences") is the justification
for treating it as canonical rather than aspirational.

---

## 2. Locus discipline — `EXISTING` gap, `INFERENCE` resolution

**Confirmed by evidence (EXTRACTION_LEDGER.md A2, A3):** both Isnaad and Mirtal
have real, shipped instances of silent granularity coercion — Mirtal infers
granularity from tuple arity and once constructs a word-span from an ayah hit by
grabbing an arbitrary "first 6 words"; Isnaad's root-index build collapses
word-level occurrences into ayah-level loci, permanently, in the shipped data.

**Resolution (`INFERENCE`):**

```ts
type Granularity = 'ayah' | 'word' | 'segment' | 'span';

interface Locus<G extends Granularity = Granularity> {
  readonly granularity: G;
  readonly surah: number;
  readonly ayah: number;
  readonly word?: G extends 'word' | 'segment' | 'span' ? number : never;
  readonly segment?: G extends 'segment' ? number : never;
  readonly wordEnd?: G extends 'span' ? number : never;
}

// A projection between granularities is a named, explicit function —
// never a structural cast — and it returns a Provenance-carrying result.
function project<From extends Granularity, To extends Granularity>(
  locus: Locus<From>,
  to: To,
  rule: ProjectionRule<From, To>,
): { result: Locus<To>; provenance: Provenance };
```

The granularity tag is carried at the type level (discriminated union), not
inferred from which optional fields happen to be present — this directly
targets the Mirtal anti-pattern (A2) where granularity was inferred from tuple
arity. Every projection is a named function with a `ProjectionRule` that must
itself be looked up/declared, so "ayah → word" can never happen by accidentally
constructing a `Locus<'word'>` with a fabricated word index (the specific defect
found at Mirtal `generate.py:139-140`).

**`Selection<T>` / Grip — `PROPOSED`, adapted from Sayyarah (ledger A4):**

```ts
type Selection<G extends Granularity = Granularity> =
  | { kind: 'locus'; locus: Locus<G> }
  | { kind: 'span'; loci: Locus<G>[] }          // قِرَان — contiguous or scattered
  | { kind: 'collection'; loci: Locus<G>[] }    // جَمْع — arbitrary gathered set
  | { kind: 'root-indexed'; root: string }      // جِذْر
  | { kind: 'attribute-indexed'; attribute: string; value: string }; // صِيغَة
```

Every `Operation` (§6) takes and returns a `Selection`, never a bare `Locus` —
this is the SDK's answer to Sayyarah's "every operation takes a grip and gives
a grip" discipline, and it composes cleanly with the granularity-typed `Locus`
above.

---

## 3. Relation — `EXISTING` (converged from 2 independent sources)

```ts
type EpistemicType = 'textual' | 'perceptual'; // نصّي | إدراكي — EXISTING, ledger B3

interface Relation<TEvidence = unknown> {
  readonly id: string;
  readonly kind: string;               // extensible, not a closed enum — see §UNRESOLVED
  readonly endpoints: [Locus, Locus];  // generalizes Isnaad's node-index pair
  readonly weight: number;
  readonly evidence: TEvidence;        // structured per-kind, per Isnaad's discriminated union (B1)
  readonly epistemicType: EpistemicType; // EXISTING in Mirtal, ABSENT in Isnaad — added here
  readonly provenance: Provenance;     // GAP in both source repos — new requirement, see §7
}
```

`kind` is deliberately `string`, not a closed union — Mission §6 explicitly
forbids hard-coding every future research relation into one enum. Extensibility
is enforced by convention (a relation-kind registry, analogous to
arabic_timeless's `registry.ts` pattern, EXISTING per ledger F3) rather than by
the type system closing the set.

---

## 4. Discovery lifecycle — `EXISTING`, extracted near-verbatim (ledger D2, D3)

```ts
type DiscoveryState = 'UNEXPLORED' | 'KNOWN' | 'EXHAUSTED' | 'WITHHELD' | 'INVALID';

interface BoundSignature {
  // every numeric/config limit that gated the search that produced this result,
  // serialized so two runs can be compared for staleness — EXISTING pattern,
  // Mirtal majra.html boundSig()/boundsNow()
  readonly [param: string]: string | number | boolean;
}

interface Discovery<TEvidence = unknown> {
  readonly id: string;
  readonly generatedBy: string;        // rule/algorithm id
  readonly parents: string[];          // ids of inputs this was derived from
  readonly score: number;
  readonly bounds: BoundSignature;
  readonly engineVersion: string;
  readonly corpusVersion: string;      // GAP in all 3 repos — new requirement
  readonly evidence: TEvidence;
  readonly epistemicType: EpistemicType;
  readonly state: DiscoveryState;
  readonly provenance: Provenance;
}

// EXHAUSTED is only ever valid relative to a stored BoundSignature —
// re-checking against a changed BoundSignature demotes it back to KNOWN/stale.
// This directly reproduces Mirtal's design comment (majra.html:750-753):
// "it never reports unexplored as exhausted... exhaustion is only ever made
// relative to the bounds in force."
```

This is the single highest-confidence extraction in the whole ledger (D2) —
independently convergent with the mission brief's own required states, found
in real, currently-shipped code, not invented for this document.

---

## 5. Observable / Transform — `EXISTING` shape, `GAP` on two required properties

```ts
interface Observable<TSubject, TValue> {
  readonly id: string;
  readonly label: { en: string; ar?: string };
  compute(subject: TSubject): TValue;
  serialize(value: TValue): string;
  display(value: TValue): string;
  readonly lossAccounting: LossAccounting;  // GAP — see below, was free-text prose in source
}

// GAP (ledger F4): no repo has structured loss accounting; arabic_timeless's
// `discards: string` is prose only. This SDK requires:
interface LossAccounting {
  readonly preserved: string[];   // named facets of the subject preserved
  readonly discarded: string[];   // named facets discarded
  readonly reversible: boolean;   // machine-checkable, not asserted — see Transform below
}

interface Transform<TIn, TOut> {
  readonly id: string;
  readonly label: { en: string; ar?: string };
  readonly inputType: string;
  readonly outputType: string;
  apply(input: TIn): TOut;
  readonly invertibilityClaim: 'invertible' | 'lossy' | 'unknown';
  readonly lossAccounting: LossAccounting;
  readonly provenance: Provenance;
}
```

**`GAP`, confirmed by ledger F2/F5, top implementation priority:** no repo
contains code that verifies a declared `invertibilityClaim` against sample
data. Arabic-Timeless's `invariance.ts` (ledger F5) is real, live, and tested,
but verifies a *different* property (observable-blindness-to-transform, not
transform-round-trip). The SDK must build, new:

```ts
function verifyInvertibility<TIn, TOut>(
  transform: Transform<TIn, TOut>,
  invert: (out: TOut) => TIn,
  samples: TIn[],
  equals: (a: TIn, b: TIn) => boolean,
): InvertibilityReport; // { claim, samplesTotal, samplesPassed, counterexamples }
```

This closes the specific, confirmed gap where a `Transform.invertible === true`
flag was set and never checked anywhere in any of the three repos.

The sampling/comparison machinery from `invariance.ts` (`buildInvarianceTable`,
generalized away from `Word`) is `EXISTING` and directly reusable as the harness
`verifyInvertibility` runs on top of.

---

## 6. Structure & Spatial — `EXISTING`, high confidence (ledger E1-E5)

```ts
interface Embedding {
  readonly basisId: string;
  readonly corpusVersion: string;
  readonly algorithm: string;
  readonly parameters: Record<string, unknown>;
  readonly coordinates: Map<string, [number, number, number]>; // locus id -> position
  readonly evaluation: BasisEvaluation;  // see below — EXISTING, ledger E3
  readonly provenance: Provenance;
}

interface BasisEvaluation {
  readonly locality: number;         // medianRelated / medianRandom — EXISTING, isnaad basis.ts
  readonly nullModelSampleSize: number;
  readonly convergences: number;
}

interface Shape {
  readonly linearity: number;   // (λ1-λ2)/λ1
  readonly planarity: number;   // (λ2-λ3)/λ1
  readonly sphericity: number;  // λ3/λ1
}

interface Structure {
  readonly members: string[];        // locus/node ids
  readonly shape: Shape;
  readonly basisId: string;          // which Embedding this was computed under — MANDATORY
  readonly algorithm: string;
  readonly parameters: Record<string, unknown>;
  readonly confidence: number;
  readonly supportingRelations: string[]; // relation ids — must span >=1 family per minSupport rule
  readonly provenance: Provenance;
}
```

`EXISTING`, near-verbatim from isnaad's `shapeOf`/PCA/Jacobi-eigensolver (E1)
and `measureBasis` null-model locality evaluator (E3) — both operate on
arbitrary `Vec3[]`/typed relations already, minimal generalization needed.

**Mandatory rule, directly justified by ledger E3's documented discrepancy:**
`Embedding.evaluation` is a required field, not optional — the SDK must never
expose an embedding without its locality score attached, specifically because
the evidence shows a real system (Isnaad) currently defaults to showing an
unevaluated embedding (`constellation`/zodiac) instead of the evaluated one
(`spectral`) unless a viewer manually switches. Making `evaluation` mandatory
on the type is the structural fix for that class of bug.

---

## 7. Provenance — `GAP` in all 3 repos, `INFERENCE` design

```ts
interface Provenance {
  readonly source: string;             // where the input came from
  readonly operation: string;          // what produced this
  readonly parents: string[];          // multi-hop — Mirtal only ever recorded ONE hop (ledger J2)
  readonly algorithm: string;
  readonly parameters: Record<string, unknown>;
  readonly bounds: BoundSignature;     // reuse §4's type — EXISTING pattern, Mirtal
  readonly corpusVersion: string;      // GAP everywhere — no repo has this
  readonly engineVersion: string;
  readonly timestamp?: string;
  readonly disclaimer?: string;        // e.g. Mirtal's "a transition exists under this
                                        // rule — nothing is asserted about what it means"
                                        // (majra.html:952) — EXISTING, worth keeping verbatim
}
```

Mirtal's `mirtal.provenance()` (ledger J2) is the best partial analog found —
adapted, not extracted verbatim, because it only ever records one-hop
transitions and has no corpus-version field. Both gaps are closed above.

---

## 8. Capability — `EXISTING` schema, `REJECT` on enforcement pattern

```ts
type CapabilityStatus = 'KNOWN' | 'DERIVED' | 'UNAVAILABLE';

interface Capability {
  readonly id: string;
  readonly label: { en: string; ar?: string };
  readonly substrate: string;
  readonly operators: string[];
  readonly input: string;
  readonly output: string;
  readonly constraints: string[];
  readonly reversible: boolean;
  readonly provenance: string;
  readonly status: CapabilityStatus;
  readonly reason?: string;            // populated when status === 'UNAVAILABLE'
}
```

`EXISTING`, near-verbatim from Mirtal's `CAPS` array (ledger I1), including the
"honest unavailability" discipline (declare a capability that doesn't work yet,
with a reason, rather than omitting it silently).

**Explicitly rejected (ledger I2):** any client-side `may(scopeId)` gate as an
*authority* mechanism. Mirtal's own scope-gating is confirmed, by direct code
reading, to be bypassable from the browser console because the underlying data
ships regardless of lock state. Any capability that gates real authority in the
SDK must be enforced server/runtime-side; a client-side `Capability.status`
check may drive UI, never security.

---

## 9. Operation & Traversal — `EXISTING` machinery, `PROPOSED` extension points

```ts
interface Operation<TIn extends Selection, TOut extends Selection> {
  readonly id: string;
  readonly family: 'traversal' | 'observation' | 'union-split' | 'reveal'; // PROPOSED,
    // adopted from Sayyarah's 4-family grouping (ledger G2) — cleaner than
    // anything found in working code across the 3 repos
  apply(input: TIn, context: TraversalContext): { output: TOut; step: TraversalStep };
  readonly deterministic: boolean;
  readonly provenance: Provenance;
}

interface TraversalStep {
  readonly operationId: string;
  readonly input: Selection;
  readonly output: Selection;
  readonly relationsTraversed: string[]; // relation ids
  readonly rationale?: string;           // e.g. Mirtal's step "role" (ابتداء/تفريق/...)
}

interface Traversal {
  readonly id: string;
  readonly seed: Selection;
  readonly steps: TraversalStep[];        // FULL log — never destination-only (H1, EXISTING)
  readonly stoppingCondition: string;
  readonly provenance: Provenance;

  replay(direction: 'forward' | 'reverse'): TraversalStep[]; // PROPOSED, ارْتَدَّ...قَصَصًا (H4)
                                          // — near-zero new work: H1's retlat and H3's
                                          // self-describing stations already store enough
                                          // state to reverse-walk; this is a view, not new capability
  joinWith(other: Traversal): Locus | null; // PROPOSED, مَجْمَعَ البَحْرَيْن (G3)
}
```

`EXISTING`, full-step-log discipline extracted from Mirtal's `furqan()`/
`tarteel()` (H1, strongest evidence) with Isnaad's `chooseLeg`/`walkChamber`
(H2, H3) as convergent but partial (H2 truncates history — explicitly NOT
adopted as the canonical replay mechanism, see ledger H2's discarded-behavior
note).

---

## 10. Computation/Interpretation boundary — `PROPOSED`, adopted from Sayyarah (ledger K1, K2)

Four enforceable constraints, adopted directly rather than left as prose,
because Sayyarah states them as sharp, named design law rather than vague
principle:

1. **لا إحصاء (no statistics-as-fact):** no SDK query surface returns a bare
   count as if it were a corpus fact. Counts may appear in `Structure`/
   `Discovery` results only alongside algorithm/parameters/confidence — never alone.
2. **لا تسمية (no auto-naming):** `Structure.shape`/`Discovery` results are
   never auto-labeled with an interpretive name ("this is a filament") —
   only numeric shape descriptors + basis + algorithm + confidence, per §6's
   mandatory-fields rule (which independently derives the same discipline from E1/E2).
3. **لا إبدال (no silent substitution):** `Locus`/canonical text data never
   carries a translated/transliterated value merged into the addressable
   record. Any `lisan` (language) layer is a separate, explicitly-requested,
   clearly-marked structure — never substituted into `Locus`.
4. **لا تأويل (no interpretation):** the engine emits `Observable`/`Relation`/
   `Structure`/`Discovery` data and stops. Meaning-assignment is a client/agent
   concern. §K1's `البَعْث` agent contract operationalizes this precisely: the
   engine validates every *locus an agent's output references* against the
   corpus, but never validates or endorses the agent's *interpretive description*.

These four map directly onto Mission §26 ("never confuse the computational
answer with tafsir") and are recommended as lint-enforced invariants once
implementation starts, not just documentation.

---

## 11. Package structure — `INFERENCE`, following Mission §21 with evidence-based adjustments

```
@engine/corpus        — Locus, Selection/Grip, LocusJoin, coverage accounting (A1, A4, E5)
@engine/arabic        — Observable<T>/Transform shapes + invertibility verifier (F1-F6)
@engine/relation       — Relation, epistemic type, relation-kind registry (B1-B4)
@engine/discovery      — Discovery, lifecycle state machine, BoundSignature (D1-D3)
@engine/structure      — Shape/PCA classifier, community detection (E1, E2)
@engine/spatial        — Embedding, Basis, null-model locality evaluator (E3, E4)
@engine/operations     — Operation, operator algebra, family taxonomy (G1-G4)
@engine/traversal      — Traversal, replay, join — (was folded into "operations" in
                          Mission §21's list; separated here because H1-H4's evidence
                          shows Traversal has enough independent structure — full step
                          log, replay, join — to be its own package rather than a
                          sub-concept of Operation)
@engine/provenance     — Provenance, BoundSignature (shared with discovery) (J1, J2)
@engine/capability     — Capability descriptor schema only, no enforcement (I1, I2)
@engine/audio          — deferred, ADOPT/WRAP strategy per Mission §14, not started
```

**Deviation from Mission §21's literal package list, flagged:** the mission
lists `@engine/traversal` implicitly under `@engine/operations`; this document
proposes splitting it out because the evidence (three independent working
traversal implementations, H1-H3) shows materially more structure than a
generic Operation sub-type — full replayable step logs, join semantics, and a
distinct `TraversalContext`. This is a proposal, not yet locked — see
UNRESOLVED below.

Dependency direction: `provenance` and `corpus` have no dependencies on other
`@engine/*` packages (primitive layer); everything else may depend on those two
plus, where needed, `relation`/`discovery`. No circular dependencies.

---

## 12. UNRESOLVED

- Whether `@engine/traversal` is genuinely a separate package or a sub-module
  of `@engine/operations` — proposed split above needs review before Phase 3.
- `Relation.kind` extensibility mechanism — "a registry, analogous to
  arabic_timeless's `registry.ts`" is named but not designed; needs its own
  short design pass before implementation.
- Audio (`@engine/audio`) — Mission §14 names OSS candidates
  (c.pfair/quran-align, Wider-Community/quranic-universal-audio,
  tarteel-ai/whisper-base-ar-quran, whisper.cpp) but this document has not
  evaluated any of them (license, maintenance, format, browser feasibility) —
  `OSS CANDIDATE`, unevaluated, deferred entirely, not started in Phase 1/2.
- Realtime and Agent packages — per Mission §15/§16, deliberately left as thin
  contracts or fully deferred; K1 (`البَعْث` protocol) is the only concrete
  design input so far and is `PROPOSED`, not built.
- Exact `Selection` (§2) vs. Mission's minimum `AyahLocus/WordLocus/
  SegmentLocus/SpanLocus` list — this document recommends the richer
  Sayyarah-derived six-form shape (A4) as PROPOSED; needs explicit user sign-off
  since it's a bigger surface than the mission's stated minimum.
