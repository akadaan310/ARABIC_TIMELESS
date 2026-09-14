# ENGINE SDK — Extraction Ledger

Phase 1 (reconnaissance) + start of Phase 2 (architecture lock). Built from direct
source-code forensic research in `isnaad`, `ARABIC_TIMELESS`, `CHATGPTNMYOWNER`
(branch `claude/new-session-ujuo0k` in each, as attached to this session) and the
`sayyarah` spec upload (a single static page, never implemented — treated strictly
as vocabulary evidence per the mission's own instruction).

**Ground rule applied throughout:** nothing below was extracted because a name
matched. Every row is backed by a file:line citation from a live research agent
that read the actual logic, not just identifiers or comments. Where the research
could not confirm a claim from the synthesis brief, that is recorded as a
**discrepancy**, not silently resolved in the brief's favor — per the mission's
explicit instruction: *"When the report and current source code disagree: inspect
the source code, determine actual current behavior, preserve the evidence, and
explicitly document the discrepancy."*

Legend for STATUS: `EXISTING` = working code found; `PARTIAL` = interface/shape
exists but a stated core property is unverified or unimplemented; `GAP` = the
mission calls for this and no repo has it — must be built in the SDK, not
extracted; `PROPOSED` = Sayyarah vocabulary only, no implementation anywhere.

---

## A. Locus / Address

### A1. Isnaad `Locus` / `LocusJoin`
- **SOURCE REPOSITORY:** isnaad
- **SOURCE LOCATION:** `src/lib/cosmos/locus.ts:15-129`
- **ORIGINAL CONCEPT:** `Locus {surah, ayah}` + `buildLocusJoin` mapping coordinates to a placed-node index, with coverage accounting.
- **ENGINE CONCEPT:** `AyahLocus` + a generic `LocusJoin<TCoordinate, TTarget>` resolution/coverage utility.
- **EXTRACTION TYPE:** EXTRACT (join/coverage mechanism), ADAPT (locus type — must be widened, see A4)
- **PRESERVED BEHAVIOR:** coordinate→placed-entity join; "first placement wins" collision rule; coverage accounting.
- **INTENTIONALLY DISCARDED BEHAVIOR:** none — mechanism is sound as-is.
- **TEST COVERAGE:** none found in source repo.
- **PROVENANCE:** isnaad `src/lib/cosmos/locus.ts`.
- **STATUS:** EXISTING (generic core), narrow (ayah-only — see A4).

### A2. Mirtal `Seg` / `Span`
- **SOURCE REPOSITORY:** chatgptnmyowner (Mirtal)
- **SOURCE LOCATION:** `corpus.py:14,16-48`; `ops.py:3`
- **ORIGINAL CONCEPT:** `Seg = (sura,aya,word,seg,form,pos,feats,root,lem,rasm)` at ingest; everything downstream narrows to `Span = (sura,aya,w0,w1)`.
- **ENGINE CONCEPT:** the segment→word→span hierarchy motivates ENGINE's `AyahLocus`/`WordLocus`/`SegmentLocus`/`SpanLocus` family (Mission §4).
- **EXTRACTION TYPE:** REJECT the implementation, ADAPT the idea
- **PRESERVED BEHAVIOR:** the *hierarchy concept itself* (finer-grained addresses roll up to coarser ones).
- **INTENTIONALLY DISCARDED BEHAVIOR:** the *mechanism* — granularity is implicit in tuple arity, never a typed tag. The `seg` (sub-word) field is silently dropped the moment code leaves `Corpus` (`corpus.py:46-48`). `generate.py:139-140` constructs a word-level span from an ayah-level hit by grabbing an arbitrary "first 6 words" — an undocumented, silent granularity promotion.
- **TEST COVERAGE:** none found.
- **PROVENANCE:** chatgptnmyowner `corpus.py`, `ops.py`.
- **STATUS:** REJECT-as-implementation. This is a **documented anti-pattern**, cited as direct justification for Mission §4's rule that granularity must never be inferred from shape and coercion must always be explicit, typed, and validated.

### A3. Isnaad silent word→ayah collapse in root index
- **SOURCE REPOSITORY:** isnaad
- **SOURCE LOCATION:** `scripts/ingest-quran.ts:181-187`
- **ORIGINAL CONCEPT:** root index built by iterating every word/segment occurrence of a root and inserting into a `Set<string>` keyed `` `${surah}:${ayah}` ``.
- **ENGINE CONCEPT:** none — this is a REJECT, recorded specifically as evidence for the Locus Discipline rule.
- **EXTRACTION TYPE:** REJECT
- **PRESERVED BEHAVIOR:** none.
- **INTENTIONALLY DISCARDED BEHAVIOR:** word-level occurrence data is discarded before `roots.json` is written — multiple distinct word-level root occurrences within one ayah are silently collapsed to a single ayah-level locus. Word-level root provenance is unrecoverable from the shipped data.
- **TEST COVERAGE:** none.
- **PROVENANCE:** isnaad `scripts/ingest-quran.ts`.
- **STATUS:** REJECT — second independent confirmation (alongside A2) that silent ayah/word conflation is a real, historically-occurring defect class, not a hypothetical risk. Mission §4's "never silently coerce ayah↔word↔segment" rule is empirically justified twice over.

### A4. Sayyarah `قَبْضة` (Grip) — six locus forms
- **SOURCE REPOSITORY:** sayyarah (spec only)
- **SOURCE LOCATION:** `index.html`, section "ثالثًا — القَبْضَة"
- **ORIGINAL CONCEPT:** a selection/working-unit with six typed forms: `مَوْقِع` (single ayah, all layers), `قِرَان` (a set of ayat, contiguous or scattered), `كَلِمَة` (one exact word-occurrence, e.g. `18:9#11`), `جَمْع` (an arbitrary gathered set of word-occurrences from anywhere), `جِذْر` (a root, with all its forms and occurrences), `صِيغَة` (a paradigm/case/rhyme-ending value treated as a selection criterion).
- **ENGINE CONCEPT:** `Selection<TLocus>` / `Grip` — a typed wrapper that is *either* a single `Locus` at a declared granularity, *or* a named attribute-indexed collection (root-indexed, paradigm-indexed), *or* an explicit ad-hoc union — every ENGINE Operation takes and returns one of these, never a bare locus.
- **EXTRACTION TYPE:** RESEARCH / PROPOSED
- **PRESERVED BEHAVIOR:** n/a — never implemented.
- **INTENTIONALLY DISCARDED BEHAVIOR:** n/a.
- **TEST COVERAGE:** none (no implementation exists).
- **PROVENANCE:** sayyarah `index.html` §3.
- **STATUS:** PROPOSED. This is genuinely richer than the mission brief's minimum granularity list (`AyahLocus/WordLocus/SegmentLocus/SpanLocus`) — it adds attribute-indexed and arbitrary-union selections as first-class, typed forms rather than afterthoughts. Recommend adopting the six-form shape as the SDK's `Selection` type, explicitly labeled PROPOSED until built and tested.

---

## B. Relation

### B1. Isnaad `Strand`
- **SOURCE REPOSITORY:** isnaad
- **SOURCE LOCATION:** `src/lib/cosmos/strands.ts:33-75`
- **ORIGINAL CONCEPT:** `Strand = {id, a, b (node indices), kind, weight (0-1), evidence}`; `evidence` is a discriminated union, one structured variant per `kind` (sunbula/motif/root/discovery/resonance).
- **ENGINE CONCEPT:** the base shape of `Relation` (Mission §6).
- **EXTRACTION TYPE:** EXTRACT (shape), ADAPT (add epistemic type — see B3)
- **PRESERVED BEHAVIOR:** id/endpoints/kind/weight/structured-evidence-union shape; per-kind evidence typing (not free text).
- **INTENTIONALLY DISCARDED BEHAVIOR:** the evidence payload's field names (`gloss`, `pattern`, Arabic-language keys) are corpus-specific and are not canonicalized — only the *shape* (typed union keyed by kind) is kept.
- **TEST COVERAGE:** none found.
- **PROVENANCE:** isnaad `src/lib/cosmos/strands.ts`.
- **STATUS:** EXISTING, missing an epistemic-type field (confirmed gap — no such field anywhere in Isnaad's Strand).

### B2. Mirtal evidence-bearing relation tuple
- **SOURCE REPOSITORY:** chatgptnmyowner (Mirtal)
- **SOURCE LOCATION:** `sabab.py` (generator methods, 48-130); materialized at `generate.py:69-70,93`; reified client-side `majra.html:460,870-871`.
- **ORIGINAL CONCEPT:** 7-field tuple `(target, kind/sabab, evidence:str, bits:float, type:نصّي|إدراكي, score:float, tier:str)`.
- **ENGINE CONCEPT:** the second half of the "Isnaad Strand + Mirtal relation tuple → ENGINE Relation" example given verbatim in Mission §"NO PREMATURE MERGE".
- **EXTRACTION TYPE:** EXTRACT (shape → formalize as a real record, it is a bare positional tuple in source)
- **PRESERVED BEHAVIOR:** target/kind/evidence/weight/epistemic-type/score/proximity-tier as distinct fields.
- **INTENTIONALLY DISCARDED BEHAVIOR:** no `id` field and no explicit source-endpoint field in the raw tuple (source is implicit from call context) — ENGINE Relation must add both explicitly rather than inherit Mirtal's implicit-source pattern.
- **TEST COVERAGE:** none found.
- **PROVENANCE:** chatgptnmyowner `sabab.py`, `generate.py`.
- **STATUS:** EXISTING but informally typed (positional tuple, not a validated struct anywhere in the source).

### B3. Mirtal `نصّي` (nassi/textual) vs `إدراكي` (idraki/perceptual) epistemic type
- **SOURCE REPOSITORY:** chatgptnmyowner (Mirtal)
- **SOURCE LOCATION:** constants duplicated at `ops.py:5` and `sabab.py:7`; assigned at `sabab.py:54,66,80,100,114` (نصّي, 5 of 6 generators) and `sabab.py:129` (إدراكي, `tajanus` only, with an explicit in-code comment: *"PERCEPTUAL: not settled by the text alone, so it is typed إدراكي and must be declared"*); survives serialization as a boolean bit `edges_table.py:23` and is decoded back to the label client-side `majra.html:871,969`.
- **ORIGINAL CONCEPT:** a real, load-bearing epistemic-type tag that survives every serialization boundary in the pipeline (Python tuple → JSON int → JS label) and appears in the exposed `mirtal.provenance()` API output.
- **ENGINE CONCEPT:** `Relation.epistemicType: 'textual' | 'perceptual'` (Mission §6's literal requirement — "Mirtal's distinction between نصّي / إدراكي must survive as an epistemic-type distinction").
- **EXTRACTION TYPE:** EXTRACT
- **PRESERVED BEHAVIOR:** the tag itself, and the discipline of assigning it at generation time based on whether the claim is settled by the text alone.
- **INTENTIONALLY DISCARDED BEHAVIOR:** in Mirtal, the tag has **no behavioral effect beyond display/labeling** — no code path filters, scores, or trusts differently by epistemic type. This is worth improving in the SDK (e.g. an engine-level policy that can treat `perceptual` relations differently), but that improvement should be labeled PROPOSED, not attributed to Mirtal.
- **TEST COVERAGE:** none found.
- **PROVENANCE:** chatgptnmyowner `sabab.py`, `ops.py`, `generate.py`, `edges_table.py`, `majra.html`.
- **STATUS:** EXISTING, real, verified genuinely load-bearing (not merely a comment or doc claim) — the single strongest, most literally-reusable primitive from Mirtal.

### B4. Isnaad `RibatVector`
- **SOURCE REPOSITORY:** isnaad
- **SOURCE LOCATION:** `src/lib/cosmos/strands.ts:277-327`
- **ORIGINAL CONCEPT:** typed signed-displacement record between two endpoints (person/tense shift, axis delta, distances, score) built from `ribat`-kind discoveries.
- **ENGINE CONCEPT:** a generic "signed displacement between two typed endpoints, with a score" shape, usable as an Observable/Relation variant.
- **EXTRACTION TYPE:** ADAPT
- **PRESERVED BEHAVIOR:** the generic shape (node, to, from, axisDelta, distances, score).
- **INTENTIONALLY DISCARDED BEHAVIOR:** person/tense-shift fields, which are Arabic-morphology-specific.
- **TEST COVERAGE:** none found.
- **PROVENANCE:** isnaad `src/lib/cosmos/strands.ts`.
- **STATUS:** EXISTING, minor generalization needed.

---

## C. Detectors / Relation Generators

### C1. Isnaad detectors
- **SOURCE REPOSITORY:** isnaad
- **SOURCE LOCATION:** `src/lib/engine/detectors.ts` — 8 functions (`detectIstihdar`, `detectRootReturn`, `detectNabaBridge`, `detectRibat`, `detectNasikhMirror`, `detectKhalq`, `detectTabaqat`, `detectRusul`), lines 122-606; orchestration `runAllDetectors`/`dedupe` 640-673.
- **ORIGINAL CONCEPT:** each detector scans a `DetectorContext` and computes a weighted-feature heuristic score against a fixed threshold (`minScore=0.28`), emitting a flat `Discovery[]`.
- **ENGINE CONCEPT:** the generic `Detector` interface (`DetectorContext → Discovery[]`, pluggable, thresholded).
- **EXTRACTION TYPE:** WRAP (interface), REJECT (the 8 concrete detectors as canonical logic)
- **PRESERVED BEHAVIOR:** context→weighted-feature-scoring→thresholded-discovery architecture.
- **INTENTIONALLY DISCARDED BEHAVIOR:** all 8 concrete detectors — entirely Qur'an/Arabic-isnād-specific (tense/person/nāsikh/khalq semantics) and must remain in isnaad as domain implementations, not become canonical SDK logic.
- **TEST COVERAGE:** none found (a `scripts/verify-cosmos.ts` script exists but is not an assertion-based test harness).
- **PROVENANCE:** isnaad `src/lib/engine/detectors.ts`.
- **STATUS:** EXISTING (interface-level), no lifecycle (see D1).

### C2. Mirtal `SababIndex` generators
- **SOURCE REPOSITORY:** chatgptnmyowner (Mirtal)
- **SOURCE LOCATION:** `sabab.py:48-130` — `tajawur`, `takrar`, `ishtimal`, `sigha`, `tamathul`, `tajanus`.
- **ORIGINAL CONCEPT:** six deterministic index-lookup generators (adjacency, lemma/root inverted index, n-gram, POS-pattern, Levenshtein-bounded rasm comparison) over a precomputed `SababIndex`.
- **ENGINE CONCEPT:** converges with C1 into the same generic `Detector`/relation-generator interface.
- **EXTRACTION TYPE:** WRAP (interface), REJECT (6 concrete generators as canonical)
- **PRESERVED BEHAVIOR:** pluggable-generator-over-indexed-corpus pattern; deterministic, no ML/randomness.
- **INTENTIONALLY DISCARDED BEHAVIOR:** the 6 concrete generators — Qur'an-morphology-specific.
- **TEST COVERAGE:** none found.
- **PROVENANCE:** chatgptnmyowner `sabab.py`.
- **STATUS:** EXISTING (interface-level), converges with C1.

---

## D. Discovery Lifecycle

### D1. Isnaad — NOT FOUND
- **SOURCE REPOSITORY:** isnaad
- **SOURCE LOCATION:** n/a — searched `Motif` (`types.ts:192-204`), `Discovery` (`types.ts:169-189`), `RootIndex` (`graph.ts:32`); no `status`/`state` field, no lifecycle enum anywhere in the repo.
- **ORIGINAL CONCEPT:** none — flat, stateless, score-sorted arrays only.
- **ENGINE CONCEPT:** n/a for this entry — recorded as a confirmed absence.
- **EXTRACTION TYPE:** n/a
- **STATUS:** GAP (confirmed absent, not merely under-documented).

### D2. Mirtal discovery ledger — the strongest single primitive found across all three repos
- **SOURCE REPOSITORY:** chatgptnmyowner (Mirtal)
- **SOURCE LOCATION:** `majra.html:745-910` — `discRecord` (864-871), `discFrontier` (875-886), `discSummary` (887-910), `boundSig`/`boundsNow` (762-766).
- **ORIGINAL CONCEPT:** a genuine multi-state, **bound-relative** lifecycle: `UNEXPLORED`, `KNOWN`, `EXHAUSTED` (only relative to a stored `boundSig` — re-evaluated as stale/`KNOWN` again if bounds changed), `DERIVED`, `INVALID`/`REFUSED`, `WITHHELD`, `NOT ADMITTED`. Explicit in-code design comment: *"it never reports unexplored as exhausted... exhaustion is only ever made relative to the bounds in force."* Persisted ledger capped at `DMAX=4096`; frontier capped at `FRONT_MAX=500`.
- **ENGINE CONCEPT:** `Discovery.lifecycleState` (Mission §7) — this maps almost exactly onto the mission's required states (`UNEXPLORED, KNOWN, EXHAUSTED, WITHHELD, INVALID`), independently converged rather than copied from the brief.
- **EXTRACTION TYPE:** EXTRACT (near-verbatim as a pattern, decoupled from Qur'an-specific coordinates/scope names)
- **PRESERVED BEHAVIOR:** the full state machine, the bound-relativity of "exhausted," the frontier computation, cap-bounded ledger.
- **INTENTIONALLY DISCARDED BEHAVIOR:** Mirtal-specific scope names (`cross/depth/field/qalam/huna`) and coordinate shapes — only the lifecycle machinery is canonicalized.
- **TEST COVERAGE:** none found.
- **PROVENANCE:** chatgptnmyowner `majra.html`.
- **STATUS:** EXISTING, high confidence, top extraction priority for `@engine/discovery`.

### D3. Mirtal bounded computation / `boundSig`
- **SOURCE REPOSITORY:** chatgptnmyowner (Mirtal)
- **SOURCE LOCATION:** `generate.py:21-38,157-164`; `majra.html:754,762-766`.
- **ORIGINAL CONCEPT:** every numeric limit governing a search (`min_bits`, `min_score`, `CROSS_BAR`, `DMAX`, `SWEEP_MAX`, pacing constants) is captured as a comparable, serialized "bound signature" attached to every discovery-ledger record, so an "exhaustive" claim automatically invalidates when a threshold changes.
- **ENGINE CONCEPT:** Mission §7's requirement — *"A search can be exhaustive only relative to explicitly recorded bounds. Every exhaustive claim must record those bounds."* — is directly and independently satisfied by this pattern.
- **EXTRACTION TYPE:** EXTRACT
- **PRESERVED BEHAVIOR:** bound-signature computation + attachment + staleness comparison.
- **INTENTIONALLY DISCARDED BEHAVIOR:** the specific tuned constants (corpus-specific).
- **TEST COVERAGE:** none found.
- **PROVENANCE:** chatgptnmyowner `generate.py`, `majra.html`.
- **STATUS:** EXISTING, pairs directly with D2.

---

## E. Structure / Spatial

### E1. Isnaad `Shape` / `shapeOf` (PCA + Jacobi eigensolver)
- **SOURCE REPOSITORY:** isnaad
- **SOURCE LOCATION:** `src/lib/cosmos/structures.ts:25-37,58-130`.
- **ORIGINAL CONCEPT:** genuine 3×3 covariance PCA (24-sweep cyclic Jacobi diagonalization, hand-rolled, correct) producing `linearity=(λ1-λ2)/λ1`, `planarity=(λ2-λ3)/λ1`, `sphericity=λ3/λ1`.
- **ENGINE CONCEPT:** `@engine/structure`'s PCA/shape classifier (Mission §8).
- **EXTRACTION TYPE:** EXTRACT (near-verbatim — operates on arbitrary `Vec3[]`, nothing Qur'an-specific except display labels)
- **PRESERVED BEHAVIOR:** full numerical method, shape-classification formulas.
- **INTENTIONALLY DISCARDED BEHAVIOR:** Arabic display-label strings only.
- **TEST COVERAGE:** none found.
- **PROVENANCE:** isnaad `src/lib/cosmos/structures.ts`.
- **STATUS:** EXISTING, high confidence, one of the cleanest extraction candidates in the whole evidence base.

### E2. Isnaad `findStructures` / `communities` (label propagation)
- **SOURCE REPOSITORY:** isnaad
- **SOURCE LOCATION:** `src/lib/cosmos/structures.ts:39-54,142-273`.
- **ORIGINAL CONCEPT:** groups nodes by motif/root membership and graph communities (label propagation over the *independent* — non-sunbula — strand graph); requires `minSupport` (default 2) distinct non-sunbula strand-kinds to agree; scores `log2(size) × support × max(linearity, planarity)`.
- **ENGINE CONCEPT:** `Structure` result with basis/algorithm/parameters/confidence/supporting-relations/provenance (Mission §8's exact requirement — "never return a bare statement... without saying under which basis, using which algorithm, with which parameters, with what confidence").
- **EXTRACTION TYPE:** EXTRACT
- **PRESERVED BEHAVIOR:** multi-family support requirement; explicit exclusion of sunbula (derived-similarity) edges from independent-support scoring, with the in-code rationale *"they agree with everything by design"* — this is exactly the discipline Mission §8 demands.
- **INTENTIONALLY DISCARDED BEHAVIOR:** none material.
- **TEST COVERAGE:** none found.
- **PROVENANCE:** isnaad `src/lib/cosmos/structures.ts`.
- **STATUS:** EXISTING.

### E3. Isnaad `Basis` / `positionsFor` / `measureBasis` (null-model locality evaluator)
- **SOURCE REPOSITORY:** isnaad
- **SOURCE LOCATION:** `src/lib/cosmos/basis.ts:24-33,49-56,65-118,133-202,234-322`.
- **ORIGINAL CONCEPT:** four candidate bases (`constellation`, `isnad`, `contour`, `spectral` — the last a genuine spectral graph embedding via power-iteration + deflation); `measureBasis` computes `locality = medianRelated / medianRandom` against **20,000 deterministic random-pair draws** (fixed LCG seed) as a null model, plus a `convergences` count (≥3 independent families agreeing within a local radius).
- **ENGINE CONCEPT:** Mission §9's explicit requirement — *"a reusable primitive for evaluating relation locality, random-pair locality, null-model comparison, basis quality."* Independently, exactly built.
- **EXTRACTION TYPE:** EXTRACT (mechanism, near-verbatim); ADAPT (the `Basis` interface itself is fully generic; the 4 concrete basis bodies are app-specific implementations of it)
- **PRESERVED BEHAVIOR:** the entire locality/null-model methodology.
- **INTENTIONALLY DISCARDED BEHAVIOR:** `constellationBasis`, `isnadBasis`, `contourBasis` bodies (app-specific); keep `Basis` interface + `measureBasis` + `spectralBasis` (the latter is itself fully generic — only its input strand weights are app-specific).
- **TEST COVERAGE:** none found (a `scripts/compare-basis.ts` exists as an offline verification script, not an automated test).
- **PROVENANCE:** isnaad `src/lib/cosmos/basis.ts`.
- **STATUS:** EXISTING, high confidence — **but see the discrepancy noted below.**

> **DOCUMENTED DISCREPANCY (mandatory per mission instructions):** the synthesis brief that prompted this mission specifically warns: *"Do not mistake the current Rihlah visual geometry for validated relational geometry."* Source-code inspection **confirms this warning is accurate and currently true in production**: the default, server-baked node position (`CosmosNode.p`, written once in `scripts/ingest-cosmos.ts:196-231`) is the `constellation` (zodiac) basis, whose own in-code comment reads `"لا يُشتقّ من حسابٍ"` — "not derived from any computation." The empirically-measured, higher-locality bases (`isnad`, `contour`, `spectral`) exist, are wired to a real API (`src/app/api/cosmos/basis/route.ts`) and a live UI toggle (`BasisControl`), but are **not the default** — a viewer must manually switch. When the SDK extracts "the Isnaad embedding," it must pull `spectralBasis` + `measureBasis`, never `node.p`/`constellationBasis`, or it will silently canonicalize the unvalidated basis the mission explicitly warned against.

### E4. Isnaad sunbula (top-7 k-NN navigation graph)
- **SOURCE REPOSITORY:** isnaad
- **SOURCE LOCATION:** `scripts/ingest-cosmos.ts:233-261`; `src/lib/cosmos/types.ts:31-32`; `src/lib/cosmos/strands.ts:92-109`.
- **ORIGINAL CONCEPT:** fixed-k (k=7, hardcoded, thematically motivated — "seven ears of grain") nearest-neighbor graph over a weighted sum of shared-root count, isnād-vector similarity, and time-axis proximity; used purely as cheap navigation edges, **explicitly excluded from independent-evidence/support scoring** because "they agree with everything by design."
- **ENGINE CONCEPT:** a generic "precomputed k-NN navigation layer, distinct from and never counted as evidentiary support" pattern.
- **EXTRACTION TYPE:** ADAPT
- **PRESERVED BEHAVIOR:** the navigation/evidence separation discipline.
- **INTENTIONALLY DISCARDED BEHAVIOR:** k=7 and the specific weighting formula — arbitrary/thematic, not empirically justified in-code.
- **TEST COVERAGE:** none found.
- **PROVENANCE:** isnaad `scripts/ingest-cosmos.ts`, `src/lib/cosmos/strands.ts`.
- **STATUS:** EXISTING, minor generalization needed.

### E5. Isnaad `measureCoverage`
- **SOURCE REPOSITORY:** isnaad
- **SOURCE LOCATION:** `src/lib/cosmos/coverage.ts:55-129`.
- **ORIGINAL CONCEPT:** arithmetic accounting (corpus count vs. indexed vs. placed vs. gated, per family) explicitly designed to avoid conflating occurrences/loci/findings/drawable-pairs.
- **ENGINE CONCEPT:** a generic coverage-accounting utility for `@engine/corpus`/`@engine/discovery`.
- **EXTRACTION TYPE:** EXTRACT (near-verbatim)
- **PRESERVED BEHAVIOR:** the full accounting model and its explicit conflation-avoidance discipline.
- **INTENTIONALLY DISCARDED BEHAVIOR:** none material.
- **TEST COVERAGE:** none found.
- **PROVENANCE:** isnaad `src/lib/cosmos/coverage.ts`.
- **STATUS:** EXISTING.

---

## F. Observable / Transform

### F1. Arabic-Timeless `Observable<T>`
- **SOURCE REPOSITORY:** arabic_timeless
- **SOURCE LOCATION:** `lib/engine/types.ts:96-108`.
- **ORIGINAL CONCEPT:** `{id, layer, label, discards:string, compute(word):T, serialize(value):string, display(value):string, cost(word):HandCost}` — a pure one-shot projection `Word → T` plus stable-serialize/display/cost. **Not** Rx-style despite the name — no subscription/stream semantics.
- **ENGINE CONCEPT:** `Observable<T>` (Mission §5).
- **EXTRACTION TYPE:** EXTRACT (shape), ADAPT (generalize `compute(word: Word)` to `compute(subject: T_in)` over an arbitrary domain type, not hardcoded to `Word`)
- **PRESERVED BEHAVIOR:** the compute/serialize/display/cost quadruple.
- **INTENTIONALLY DISCARDED BEHAVIOR:** `discards: string` (free-text loss accounting) is replaced by a structured field — see F4 (GAP).
- **TEST COVERAGE:** indirect, via `lib/engine/__tests__/engine.test.ts` (invariance-table tests reference specific observable IDs) — real but not a dedicated interface-level test.
- **PROVENANCE:** arabic_timeless `lib/engine/types.ts`.
- **STATUS:** EXISTING, well-tested relative to the other findings, genericity currently shallow (every concrete instance still typed to `Word`).

### F2. Arabic-Timeless `Transform`
- **SOURCE REPOSITORY:** arabic_timeless
- **SOURCE LOCATION:** `lib/engine/types.ts:110-118`; concrete instances `lib/engine/layers/band1.ts:250-267`, `band3.ts:84-107,151-170`.
- **ORIGINAL CONCEPT:** `{id, layer, label, invertible:boolean, apply(word,rng):Word, cost(word):HandCost}`. Only **6 Transform objects exist in the entire registry**, all `invertible:true`, all trivial self-inverse bijections (letter substitution/permutation); 14 of 20 layers register `transforms: []`.
- **ENGINE CONCEPT:** `Transform` (Mission §5) — declared identity/input-type/output-type/invertibility-claim/information-loss/provenance.
- **EXTRACTION TYPE:** ADAPT (shape is a starting point, materially thinner than billed)
- **PRESERVED BEHAVIOR:** id/layer/label/apply/cost.
- **INTENTIONALLY DISCARDED BEHAVIOR:** the bare `invertible: boolean` — **confirmed, not merely suspected, to be unverified**: repo-wide search found zero code that applies a transform, inverts it, and compares to the original. This is a documented discrepancy against the mission brief's framing (which implied invertibility claims plus verification already existed).
- **TEST COVERAGE:** none directly on `Transform.invertible`. The closest thing to a round-trip check in the repo (`engine.test.ts:173-180`, "application and abstraction are inverse") tests **unrelated plain functions** (`applyPattern`/`abstractWord` in `patterns.ts`) that are not `Transform` objects at all — Layer 13, where they'd belong, registers `transforms: []`.
- **PROVENANCE:** arabic_timeless `lib/engine/types.ts`, `lib/engine/layers/*.ts`.
- **STATUS:** PARTIAL — shape exists, the one property the mission cares most about (declared invertibility) is unverified anywhere.

### F3. Arabic-Timeless registry / "composition"
- **SOURCE REPOSITORY:** arabic_timeless
- **SOURCE LOCATION:** `lib/engine/registry.ts` (59 lines).
- **ORIGINAL CONCEPT:** `REGISTERED: Layer[]` array; `observables()`/`transforms()` are flatMaps; `register()` allows late overwrite by id.
- **ENGINE CONCEPT:** the registry skeleton for `@engine/arabic` (and generically, any Observable/Transform registry).
- **EXTRACTION TYPE:** ADAPT
- **PRESERVED BEHAVIOR:** array + flatMap + late-register discovery pattern (generic, works).
- **INTENTIONALLY DISCARDED BEHAVIOR:** none removed, but a real composition operator (`.then()`, pipeline) must be **added** — none exists (see F5, GAP).
- **TEST COVERAGE:** used transitively by `engine.test.ts`; no dedicated registry test.
- **PROVENANCE:** arabic_timeless `lib/engine/registry.ts`.
- **STATUS:** EXISTING (skeleton), missing composition (GAP, see F5).

### F3a. `compose.ts` — false-positive name match (explicitly flagged per mission's forensic warning)
- **SOURCE REPOSITORY:** arabic_timeless
- **SOURCE LOCATION:** `lib/engine/compose.ts:61-89,115`.
- **ORIGINAL CONCEPT:** despite the filename, this is a **UI feature** for building Arabic word "compositions" (lines/poems) from `Piece` objects — unrelated to transform-pipeline composition.
- **ENGINE CONCEPT:** none.
- **EXTRACTION TYPE:** REJECT
- **PRESERVED BEHAVIOR:** n/a.
- **INTENTIONALLY DISCARDED BEHAVIOR:** all of it, for SDK purposes.
- **TEST COVERAGE:** n/a.
- **PROVENANCE:** arabic_timeless `lib/engine/compose.ts`.
- **STATUS:** REJECT — recorded specifically as a concrete instance of the mission's own warning: *"Do not extract a concept merely because two files happen to have similar names."*

### F4. Structured information-loss accounting — GAP
- **SOURCE REPOSITORY:** arabic_timeless (searched, absent); isnaad (searched, absent); chatgptnmyowner (searched, absent)
- **SOURCE LOCATION:** n/a. Arabic-Timeless's `discards: string` (`types.ts:100-101`) is the closest thing found, and it is hand-authored free-text prose per observable, not a score/enum/bit-count. `spec/*.md` files contain a documentation table with prose verdicts ("Pass") that nothing in code checks against actual behavior.
- **ORIGINAL CONCEPT:** none — confirmed absent as structured data anywhere.
- **ENGINE CONCEPT:** `Transform`/`Observable` structured loss field (Mission §5 — "preserved information / discarded information / computational cost" as distinguishable, presumably machine-usable data).
- **EXTRACTION TYPE:** RESEARCH
- **STATUS:** GAP — must be designed from scratch for the SDK; no repo provides more than prose.

### F5. Generic invariance/round-trip verifier — GAP
- **SOURCE REPOSITORY:** searched in all three; closest analog is arabic_timeless `lib/engine/invariance.ts:52-98` (`buildInvarianceTable`), which is real and live (wired to `components/InvarianceView.tsx`) but tests a **different property**: whether an Observable's *reading* is blind to a Transform, not whether the Transform's `apply` has a working inverse.
- **SOURCE LOCATION:** arabic_timeless `lib/engine/invariance.ts` (partial analog only).
- **ORIGINAL CONCEPT:** cross-product `(Observable × Transform)` invariance test over up to 400 sampled synthetic words, comparing `serialize(compute(word))` before/after `transform.apply`.
- **ENGINE CONCEPT:** Mission §5's explicit requirement — *"generic verification utilities capable of testing declared invariance/round-trip properties against controlled samples"* — and *"a transform may not simply declare itself invertible and be trusted."*
- **EXTRACTION TYPE:** EXTRACT (the sampling/comparison machinery in `invariance.ts` — real algorithm, generalize away from `Word`) + RESEARCH (the actual apply→invert→compare verifier, which does not exist anywhere and must be built new)
- **TEST COVERAGE:** `invariance.ts`'s existing machinery is tested (`engine.test.ts:188-215`); the *missing* invertibility verifier has, by definition, no tests anywhere.
- **PROVENANCE:** arabic_timeless `lib/engine/invariance.ts` (as partial building block only).
- **STATUS:** GAP for the specific property the mission asks for; EXISTING for reusable adjacent machinery (sampling + serialize-compare harness).

### F6. `isNewChannel` — dead code, flagged not extracted as "working"
- **SOURCE REPOSITORY:** arabic_timeless
- **SOURCE LOCATION:** `lib/engine/invariance.ts:134-160`.
- **ORIGINAL CONCEPT:** a "discovery detector" per its header comment — defined but **never called anywhere** in the repo (confirmed by exhaustive grep).
- **ENGINE CONCEPT:** potential seed for a discovery-detection hook once `@engine/discovery`'s lifecycle (from D2) exists.
- **EXTRACTION TYPE:** RESEARCH
- **PRESERVED BEHAVIOR:** n/a until revived and tested.
- **INTENTIONALLY DISCARDED BEHAVIOR:** n/a.
- **TEST COVERAGE:** none — the function itself is unreachable.
- **PROVENANCE:** arabic_timeless `lib/engine/invariance.ts`.
- **STATUS:** flagged as dead code; do not cite as evidence of working discovery-detection anywhere else in this ledger.

---

## G. Operations

### G1. Mirtal operator algebra
- **SOURCE REPOSITORY:** chatgptnmyowner (Mirtal)
- **SOURCE LOCATION:** `ops.py:11-37` — `hamal`, `wasl`, `aks`, `daght`, `ihata`, `fasl` (18-21), `isqat` (23-28, mode-gated via `Mode` enum, raises unless `TAWJIH`), `jam` (30-37, admissible only if union is itself an attested cluster).
- **ORIGINAL CONCEPT:** pure, deterministic, freely composable functions over `Span`/`Retlah` values; `isqat`'s mode gate is a genuine runtime precondition (exception-raising), not decorative.
- **ENGINE CONCEPT:** the generic `Operation` primitive (Mission §10), with `isqat`'s mode-gating as a template for an "epistemic mode" precondition mechanism.
- **EXTRACTION TYPE:** EXTRACT (algebra pattern), REJECT (Arabic operator semantics as canonical — keep as reference vocabulary)
- **PRESERVED BEHAVIOR:** purity, composability, mode-gating discipline.
- **INTENTIONALLY DISCARDED BEHAVIOR:** operator names/semantics themselves (`jam` requiring fawātiḥ-cluster attestation, etc.) — domain-specific.
- **TEST COVERAGE:** none (only `fasl`'s own internal `assert`).
- **PROVENANCE:** chatgptnmyowner `ops.py`.
- **STATUS:** PARTIAL — real in the Python layer; `majra.html:821-834` **explicitly documents that `hamal, wasl, fasl, ihata, isqat, jam` are declared but UNAVAILABLE in the shipped JS runtime** ("span-level substrate is not shipped to this runtime"). Python/JS parity gap, honestly self-disclosed in the source (not discovered by the research agent as a hidden defect — Mirtal's own code says so).

### G2. Sayyarah operation vocabulary (24 named operations, 4 families)
- **SOURCE REPOSITORY:** sayyarah (spec only)
- **SOURCE LOCATION:** `index.html`, section "رابعًا — العَمَليّات" — سَيْر (traversal: سِرْ فانظر, اضرب في الأرض, ارتدّ قصصًا, بَلَغَ مَجْمَعَ البَحْرَيْن, أوى), نَظَر (observation: انظر, تدبّر, تفكّر, استمع وأنصت, مراء ظاهرا), جَمْعٌ وفَصْل (union/split: اجمع, ألّف بين, زوّج, فصّل, ميّز, صرّف), كَشْفٌ وتِلاوَة (reveal: أعثر, التقط, أثر الأرض, اتل/رتل, أيها أزكى).
- **ORIGINAL CONCEPT:** every named operation is anchored to a specific Qur'anic verse citation (its own naming discipline) and each is described purely in terms of grip-in/grip-out effect.
- **ENGINE CONCEPT:** extension-point vocabulary for `@engine/operations`, explicitly required by Mission §10 to be designed-for without being implemented yet.
- **EXTRACTION TYPE:** RESEARCH / PROPOSED
- **STATUS:** PROPOSED — richer and more systematically organized (4 clean families) than the mission brief's own partial vocabulary list; recommend adopting the 4-family grouping as the SDK's `Operation.family` taxonomy, all entries labeled PROPOSED until implemented.

### G3. Sayyarah `بَلَغَ مَجْمَعَ البَحْرَيْن` — two-thread traversal join
- **SOURCE REPOSITORY:** sayyarah (spec only)
- **SOURCE LOCATION:** `index.html`, operation table row, ref `18:60`.
- **ORIGINAL CONCEPT:** run two traversals on different "threads" (keys/criteria) simultaneously until they converge on a shared locus; the meeting point is the result.
- **ENGINE CONCEPT:** `Traversal.joinWith(other: Traversal): Locus | null` — an extension point named explicitly in Mission §10.
- **EXTRACTION TYPE:** RESEARCH / PROPOSED
- **STATUS:** PROPOSED. Buildable once base Traversal (H1/H2 below) exists — no new primitive required, only a join operator over two traversal step-sequences.

### G4. Sayyarah `أَعْثِرْ` — serendipitous discovery
- **SOURCE REPOSITORY:** sayyarah (spec only)
- **SOURCE LOCATION:** `index.html`, ref `18:21`.
- **ORIGINAL CONCEPT:** surface unrequested loci sharing a layer with the current grip that the user was not looking at — explicitly *not* an ML/recommendation black box, but a stated-layer coincidence.
- **ENGINE CONCEPT:** an extension point on discovery, distinct from an explicit detector — a "what else happens to match on a layer you weren't querying" pass.
- **EXTRACTION TYPE:** RESEARCH / PROPOSED
- **STATUS:** PROPOSED.

---

## H. Traversal

### H1. Mirtal `furqan()` / `tarteel()`
- **SOURCE REPOSITORY:** chatgptnmyowner (Mirtal)
- **SOURCE LOCATION:** `generate.py:33-198`.
- **ORIGINAL CONCEPT:** `furqan()` is a single bounded expansion cycle around one anchor, returning the *full* step list (`retlat`: role + spans per step) plus edges-used-with-evidence; `tarteel()` runs it repeatedly, greedily picking the best-scoring next anchor, with explicit "local-first" warm-up and post-crossing "cooldown" pacing. `bundle.py:46-51` serializes the entire path (not just endpoints) into the shipped artifact.
- **ENGINE CONCEPT:** `Traversal` (Mission §11) — "the path is computational evidence... a traversal must be replayable... do not store only the destination."
- **EXTRACTION TYPE:** EXTRACT (near-verbatim algorithm), ADAPT (scoring constants and step-role vocabulary are tuned/app-specific)
- **PRESERVED BEHAVIOR:** full step log with per-step role, spans, and (for reach steps) the generating rule and evidence; warm-up/cooldown pacing; bounded greedy selection.
- **INTENTIONALLY DISCARDED BEHAVIOR:** the specific scoring constants (`ADJACENT=7.0`, `CROSS_BAR=14.0`, etc.) and the step-role vocabulary (`ابتداء/تفريق/توسّع/رجوع/ضغط`) — tuned/app-specific, not general algorithm parameters.
- **TEST COVERAGE:** none found.
- **PROVENANCE:** chatgptnmyowner `generate.py`, `bundle.py`.
- **STATUS:** EXISTING, strong — genuinely replayable given the same inputs, not merely destination-only. Best traversal-replay evidence of the three repos.

### H2. Isnaad `chooseLeg` / `Course` / `legsFrom`
- **SOURCE REPOSITORY:** isnaad
- **SOURCE LOCATION:** `src/lib/cosmos/voyage.ts:20-108`.
- **ORIGINAL CONCEPT:** heading-steered greedy graph walk: at each node, candidates are the 7 sunbula branches plus incident strands; score = `steerWeight·alignment(heading) + (1-steerWeight)·edgeWeight`, with a recency penalty against a rolling `memory` window (default 24). Deterministic given `(node, heading, visited-window)`, but driven by continuous live UI heading input (`rihla-scene.tsx:485`); visited window capped at 64 with older history discarded — **not fully replayable beyond that window**, no persisted course log found.
- **ENGINE CONCEPT:** an alternative Traversal strategy (interactive/steered, vs. Mirtal's autonomous-greedy) — useful as a second reference implementation of the same `Traversal` interface.
- **EXTRACTION TYPE:** ADAPT
- **PRESERVED BEHAVIOR:** heading-steered scoring formula, recency-penalty mechanism.
- **INTENTIONALLY DISCARDED BEHAVIOR:** the capped/discarding window as the *canonical* replay mechanism — Mission §11 requires full replay, so ENGINE's Traversal must persist the whole path (as H1 already does), not truncate it like this UI-driven implementation does.
- **TEST COVERAGE:** none found.
- **PROVENANCE:** isnaad `src/lib/cosmos/voyage.ts`, `src/components/cosmos/rihla-scene.tsx`.
- **STATUS:** EXISTING (partial — bounded-history variant, not full-replay).

### H3. Isnaad `walkChamber`
- **SOURCE REPOSITORY:** isnaad
- **SOURCE LOCATION:** `src/lib/engine/graph.ts:187-342`.
- **ORIGINAL CONCEPT:** deterministic (no RNG) greedy walk over curated seed āyāt using 6 named operation types, anti-repeat (excludes operations used in the last 2 steps), self-describing stations (each `TarteelStation` records surah/ayah/operation/bridge-reason/distance/vector).
- **ENGINE CONCEPT:** third convergent reference implementation of `Traversal`; the "candidate generation → scored greedy pick with anti-repeat, self-describing stations" machinery generalizes.
- **EXTRACTION TYPE:** WRAP (machinery), REJECT (the 6 concrete operations and `CHAMBER_SEEDS` — Qur'an-specific)
- **PRESERVED BEHAVIOR:** anti-repeat scored-greedy machinery, self-describing station records.
- **INTENTIONALLY DISCARDED BEHAVIOR:** the 6 concrete operations, seed list.
- **TEST COVERAGE:** none found.
- **PROVENANCE:** isnaad `src/lib/engine/graph.ts`.
- **STATUS:** EXISTING (machinery).

### H4. Sayyarah `ارْتَدَّ ... قَصَصًا` — step-replay
- **SOURCE REPOSITORY:** sayyarah (spec only)
- **SOURCE LOCATION:** `index.html`, ref `18:64`.
- **ORIGINAL CONCEPT:** return along one's own recorded traces (الآثار), one step at a time, back to the starting point — the path itself is shown, not the destination.
- **ENGINE CONCEPT:** `Traversal.replay(direction: 'forward' | 'reverse')`.
- **EXTRACTION TYPE:** RESEARCH / PROPOSED, but buildable now
- **STATUS:** PROPOSED, low-risk — the substrate already exists (H1's `retlat` and H3's self-describing stations both already store enough state to reverse-walk); this is essentially "add a `.reverse()` view over an already-recorded Traversal," not a new capability.

---

## I. Capability

### I1. Mirtal `CAPS` descriptor array
- **SOURCE REPOSITORY:** chatgptnmyowner (Mirtal)
- **SOURCE LOCATION:** `majra.html:770-835`.
- **ORIGINAL CONCEPT:** `{id, ar, substrate, operators[], input, transformation, output, constraints[], depth, reversible, implementation, provenance, reproducible, status: KNOWN|DERIVED|UNAVAILABLE}`; queried via `mirtal.capabilities(id?)`, returning `{id, status:'UNAVAILABLE', reason:...}` for unknown ids rather than throwing. Six operators are honestly listed `status:'UNAVAILABLE'` with an explicit parity-gap reason (matches G1's finding).
- **ENGINE CONCEPT:** `Capability` (Mission §13).
- **EXTRACTION TYPE:** EXTRACT (near-verbatim schema)
- **PRESERVED BEHAVIOR:** the full descriptor schema, including honest self-declared unavailability with a reason (rather than silent omission).
- **INTENTIONALLY DISCARDED BEHAVIOR:** none material to the schema.
- **TEST COVERAGE:** none found.
- **PROVENANCE:** chatgptnmyowner `majra.html`.
- **STATUS:** EXISTING, strong.

### I2. Mirtal scope-gating (`SCOPES` / `may()`)
- **SOURCE REPOSITORY:** chatgptnmyowner (Mirtal)
- **SOURCE LOCATION:** `majra.html:664-689,485,490,493-494,851-852`.
- **ORIGINAL CONCEPT:** named scopes (`cross, depth, field, qalam, huna`) with `governs` descriptions, unlock/grant state in `localStorage`, `may(id)` predicate genuinely branches runtime behavior (walk length, discovery filtering) — not decorative.
- **ENGINE CONCEPT:** none to extract as enforcement — recorded as a cautionary example.
- **EXTRACTION TYPE:** REJECT (as an enforcement mechanism), ADAPT (the shape: named-scope → governs-description → grant/revoke/persist, as a UI/preference concept only)
- **PRESERVED BEHAVIOR:** the *shape* only.
- **INTENTIONALLY DISCARDED BEHAVIOR:** the enforcement itself — **confirmed client-side-only security theater**: all underlying data ships to the browser regardless of lock state (static bundle, no server); a console call to `fieldRaw()` bypasses the gate entirely. It genuinely gates this runtime's own code paths but does not protect the underlying data.
- **TEST COVERAGE:** none found.
- **PROVENANCE:** chatgptnmyowner `majra.html`.
- **STATUS:** confirmed anti-pattern — direct, concrete justification for Mission §13's explicit warning: *"do NOT copy client-side security theater... if a capability controls actual authority, enforcement must occur at the appropriate server/runtime boundary."*

---

## J. Provenance

### J1. Formal `Provenance` type — GAP across all three repos
- **SOURCE REPOSITORY:** searched in isnaad (zero hits for "provenance" repo-wide), chatgptnmyowner (partial, see J2), arabic_timeless (not investigated as a named type — no evidence found for one either).
- **SOURCE LOCATION:** n/a.
- **ORIGINAL CONCEPT:** none exists as a formal, structured, multi-hop derivation record anywhere.
- **ENGINE CONCEPT:** `Provenance` (Mission §12: source, operation, parents, algorithm, parameters, bounds, corpus version, engine version, timestamp/run identity).
- **EXTRACTION TYPE:** RESEARCH
- **STATUS:** GAP — must be designed and built new. This is one of the mission's most emphasized invariants ("a researcher must be able to answer 'why does this object exist?' by walking backwards through its derivation... do not permit anonymous derived facts") and none of the three repos satisfies it.

### J2. Mirtal `mirtal.provenance()` — closest partial analog
- **SOURCE REPOSITORY:** chatgptnmyowner (Mirtal)
- **SOURCE LOCATION:** `majra.html:943-958`.
- **ORIGINAL CONCEPT:** per-edge/per-transition record: `{from, to, sabab (rule), evidence, bits, score, tier, type, boundsAtDiscovery, boundsNow}`, plus an explicit disclaimer string returned with every query: *"a transition exists under this rule — nothing is asserted about what it means."*
- **ENGINE CONCEPT:** a building block toward J1, not J1 itself.
- **EXTRACTION TYPE:** ADAPT
- **PRESERVED BEHAVIOR:** rule + evidence + bound-signature attached to every derived fact; the explicit non-interpretation disclaimer string (a genuinely good, reusable pattern for the COMPUTATION/INTERPRETATION boundary).
- **INTENTIONALLY DISCARDED BEHAVIOR:** none — but materially incomplete relative to Mission §12.
- **CONFIRMED GAPS:** no `corpus_version` field anywhere in the repo (the corpus text path is a hardcoded scratch filesystem path, not a checksum/version tag); only ever records **one-hop** transitions (`from → to`), never a multi-hop parent chain across multiple operator applications.
- **TEST COVERAGE:** none found.
- **PROVENANCE:** chatgptnmyowner `majra.html`.
- **STATUS:** PARTIAL — real and worth adapting, but the SDK's `Provenance` type (J1) must add corpus versioning and multi-hop parent chains that no repo provides.

---

## K. Agents / Computation-Interpretation Boundary

### K1. Sayyarah `البَعْث` (the bestow-to-agent contract)
- **SOURCE REPOSITORY:** sayyarah (spec only)
- **SOURCE LOCATION:** `index.html`, section "سادسًا — البَعْث".
- **ORIGINAL CONCEPT:** a fully specified agent-interaction protocol: the engine hands an agent (named "Hermes" in the spec) the grip + all layers + the trace that produced it, and asks exactly one thing — "describe what you witnessed" (`صِفْ ما وقفتَ عليه`) — no requested name, no classification, no ruling. On return, every locus the agent's description *references* is matched (مُطابَقة) against the real corpus and flagged if it doesn't check out; the agent's *description itself* is explicitly never validated or endorsed by the engine ("not the tool's business to ratify it") — only recorded, alongside what motivated the stop (`الوَجْه`), and it becomes a seed for the next traversal.
- **ENGINE CONCEPT:** direct, concrete operationalization of Mission §16 — *"the agent must never be allowed to invent canonical relations or findings outside engine rules... canonical computational state must be validated and recorded by the engine."*
- **EXTRACTION TYPE:** RESEARCH / PROPOSED
- **PRESERVED BEHAVIOR:** n/a — never implemented.
- **STATUS:** PROPOSED, but unusually concrete for a "vocabulary-only" source — recommend adopting this protocol shape directly as the SDK's agent-interface contract once agent packages are in scope: engine validates every *factual locus reference* an agent makes against the corpus, never validates the agent's *interpretive description*, and always records both plus what triggered the interaction.

### K2. Sayyarah's explicit refusals — COMPUTATION/INTERPRETATION boundary as engine-wide constraints
- **SOURCE REPOSITORY:** sayyarah (spec only)
- **SOURCE LOCATION:** `index.html`, section "ثامنًا — ما تَمتَنِع عنه الأداة".
- **ORIGINAL CONCEPT:** four explicit refusals stated as design law, not preference: **الإحصاء** (no statistics/counts presented as facts about the corpus — positions are shown, never counted); **التَّسمية** (no auto-naming or classification of what's shown — even operation names are called "handles for the hand, replaceable when they fall short," not judgments); **الإبْدال** (no foreign-language substitution into canonical/reading data — translation must be explicitly requested and rendered in a separate, marked pane, never merged into the addressable record); **التأويل** (no interpretation — the engine shows script/layer/adjacency and stops; what it means is left to the reader, or to a model explicitly asked to witness, never asserted by the engine itself).
- **ENGINE CONCEPT:** Mission §26's central thesis — *"the engine must make [these] questions easier to ask without pretending that the computational answer is itself tafsir"* — given four sharp, enforceable, named boundary rules rather than a single vague principle.
- **EXTRACTION TYPE:** RESEARCH / PROPOSED (as enforceable design constraints, not code)
- **STATUS:** PROPOSED — recommend encoding these as explicit invariants/lint rules across every ENGINE package (e.g. no field anywhere is allowed to silently substitute a translation for a `Locus`'s canonical text; every `Structure`/`Discovery` result must carry algorithm+params+confidence rather than a bare label) rather than leaving them as prose in a README.

---

## Cross-Repo Convergences (multiple independent sources agreeing)

1. **Relation** — Isnaad `Strand` (B1) + Mirtal evidence tuple (B2) + Mirtal's real `نصّي`/`إدراكي` tag (B3) converge into one `Relation` type with an epistemic-type field that neither Isnaad alone nor a naive merge would have produced.
2. **Discovery lifecycle** — mission-specified states (UNEXPLORED/KNOWN/EXHAUSTED/WITHHELD/INVALID) are **absent from Isnaad** (D1, confirmed gap) but **independently, almost exactly present in Mirtal** (D2) — meaning the mission brief's requirement was not copied from either repo's docs; it was inferred correctly from real working code the brief's authors evidently examined.
3. **Traversal replay** — three independent implementations (Mirtal H1, Isnaad H2 and H3) converge on "store the full step sequence, not just the destination," with H1 (Mirtal) being the most complete (full serialized path in shipped artifacts) and H2 (Isnaad) the clearest cautionary counterexample (capped/discarding history window).
4. **Basis validation vs. visual default** — E3's discrepancy (validated basis exists but isn't the default) is the single clearest confirmation that the mission's own warning about "mistaking Rihlah visual geometry for validated relational geometry" was necessary, not boilerplate caution.
5. **Security theater warning** — I2 is a concrete, real instance of exactly the anti-pattern Mission §13 warns against, independently discovered rather than assumed.
