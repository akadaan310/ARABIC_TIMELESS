# Experimental results

Only small, existing, reproducible experiments were run. No enumeration beyond
existing caps, no new artefacts generated, no search for meanings, and no
optimisation for interesting output. Every experiment exists to answer an
architectural question.

**Reproduction command for every experiment below:**

```
npm install
npx vitest run lib/engine/__tests__/archaeology.diagnostic.test.ts
```

That file is marked `DIAGNOSTIC` in its header, asserts almost nothing, and
prints what existing mechanisms actually do. Baseline suite before this pass:
4 files / 50 tests, all passing. After: 5 files / 72 tests, all passing.

Status values: `CONFIRMED` · `REFUTED` · `INCONCLUSIVE`.

---

## E1 — Can an existing computation be written as STATE A → operation → STATE B → observable → constraint → STATE C?

**This is the pass's most important experiment (brief §12).**

| | |
|---|---|
| **QUESTION** | Does a path of that exact shape already exist, using only existing mechanisms and inventing no operation? |
| **INPUT** | `كتب` — from `examples.ts:30`, already a worked example in the repository |
| **MECHANISM** | `parseWord` (`text.ts:65`) → `expand` (`text.ts:152`) → `weightOf` (`band3.ts:185`) → `solveByWeight` (`collapse.ts:142`). All four exported, all pre-existing |
| **EXPECTED** | If the primitive exists, the four calls compose without glue and the true reading survives |
| **ACTUAL** | |

```
STATE A     كتب     skeleton كٮٮ, arity 2, degree 15
OPERATION   expand(word, 5000)
STATE B     15 candidates, truncated = false     (15 == degree → complete)
OBSERVABLE  weightOf([ك,ت,ب]) = 422
CONSTRAINT  solveByWeight(word, 422)
STATE C     { كبت, كتب }  — 2 of 15
A ∈ C       true
```

| | |
|---|---|
| **REPRODUCTION** | `[E1]`; also asserted independently at `engine.test.ts:140` |
| **INTERPRETATION** | The shape exists and required **no glue at all** — the output of each stage is already the input type of the next. A→B is `Word → string[]`; B→C is `string[] → string[]` under a predicate built from an existing observable. The primitive a future traversal abstraction would need is present **at the level of one step** |
| **LIMITATION** | Three, each material: (1) `expand` is exhaustive here only because `degree ≤ cap` — see E6; (2) C is `string[]`, not `Word[]`, so continuing to a state D requires an out-of-band `parseWord`; (3) nothing records that this path was taken |
| **STATUS** | **CONFIRMED** |

### E1b — Is the path A → B → C, or is it A → C?

| | |
|---|---|
| **QUESTION** | Does the intermediate state B have independent existence, or is it an implementation detail inside a single call? |
| **ACTUAL** | B is a real, returned, inspectable value: `expand` returns `{candidates, truncated}` and `solveByWeight` calls it internally but `expand` is separately exported and separately tested (`engine.test.ts:68`). Both framings are available |
| **INTERPRETATION** | The path is genuinely three-state. But the *composed* form (`solveByWeight`) hides B, and the composed form is the one that is exported and tested. The decomposition exists; nothing depends on it |
| **STATUS** | **CONFIRMED** |

### E1c — Does the same shape appear a second time, independently?

| | |
|---|---|
| **QUESTION** | Is E1 a one-off, or a repeated pattern? |
| **ACTUAL** | The same shape appears in `collapse()` seven times over, once per filter: `live` (state) → predicate (constraint) → `kept` (state), with `before`/`after`/`removed` recorded each time (`collapse.ts:51-75`). It appears again in `suggest` (`compose.ts:265-297`): generate → `plausible` → dedupe → per-root cap → `Constraint.admits` → accumulate |
| **INTERPRETATION** | The `state → constraint → state` step is the repository's most repeated internal shape. It occurs in at least three unrelated modules with three unrelated types |
| **LIMITATION** | No two of the three can exchange a state. `collapse` steps on `string`, `suggest` steps on `Suggestion[]`, E1 steps on `Word`/`string[]` |
| **STATUS** | **CONFIRMED** |

---

## E2 — Is the invariance table reproducible and self-extending?

| | |
|---|---|
| **QUESTION** | Is Layer 14's table computed from the registry (as `types.ts:9-14` claims), and is it deterministic? |
| **INPUT** | `buildInvarianceTable(sampleWords(150))`, twice, independently |
| **MECHANISM** | `invariance.ts:52` over `registry.ts:40,44` |
| **EXPECTED** | Identical cells; dimensions equal to `observables().length × transforms().length` |
| **ACTUAL** | 25 × 6 = **150 cells**, byte-identical across two builds. Five distinct channels found by `channels()`. Full row table in `observables-invariants.md` §2.2 |
| **REPRODUCTION** | `[E4]` |
| **INTERPRETATION** | The self-extension claim holds **structurally**, not just by assertion: `observables()` and `transforms()` read `REGISTERED`, and three independent consumers read the same list (the table, `LayerStack.tsx:17`, `app/layers/page.tsx:6`). Registering a layer adds rows and columns with no other file changing |
| **LIMITATION** | Determinism comes from the fixed seed in `sampleWords(count, seed = 7)`. The seed is **not recorded on the table**, so a table built with a different sample is indistinguishable from this one |
| **STATUS** | **CONFIRMED** |

---

## E3 — Is the `pulse` row a demonstrated invariance?

| | |
|---|---|
| **QUESTION** | The table reports `pulse` invariant under all six transforms. Is that a property of the pulse channel? |
| **INPUT** | `sampleWords(10)`; `parseWord("كَتَبَ")`; `wordFromLetters` of the same letters |
| **MECHANISM** | `scan` (`band3.ts:270`), `sampleWords` (`invariance.ts:41`), `wordFromLetters` (`text.ts:112`) |
| **EXPECTED** | If the row were real, `scan` would return a binary string that survived each transform |
| **ACTUAL** | |

```
sampleWords voweled flags        : false ×10
scan() over the first five       : null | null | null | null | null
scan(parseWord("كَتَبَ"))          : "111"
scan(wordFromLetters(letters))    : null
reported pulse row               : 111111
```

| | |
|---|---|
| **REPRODUCTION** | `[E9]` |
| **INTERPRETATION** | **The row is an artefact.** Two independent sufficient causes: `sampleWords` never produces a voweled word, and every transform rebuilds via `wordFromLetters`, which cannot carry marks. The cell compares `"∅"` with `"∅"`. The `undefined` verdict exists (`invariance.ts:21`) but is reachable only from a thrown exception |
| **LIMITATION** | This refutes the *row*, not the underlying claim that the pulse is an independent channel — which remains untested and, with the current substrate, untestable |
| **STATUS** | **REFUTED** (as an invariance claim) |

---

## E4 — Does the "shift preserves intervals" claim hold?

| | |
|---|---|
| **QUESTION** | Three places in the repository say the interval sequence survives a shift; the computed row says it does not. Which, and why? |
| **INPUT** | `sampleWords(200)`; `كتب`; `كتي` |
| **MECHANISM** | `intervals` (`band1.ts:190`), `shiftLetter` (`band1.ts:183`) |
| **EXPECTED** | Either the prose is wrong or the observable is |
| **ACTUAL** | 39 of 200 words differ; **all 39 contain a letter at hijāʾī address 28**; **0** differ without one. `كتب: -19,-1 → -19,-1` unchanged; `كتي: -19,25 → -19,-3` changed |
| **REPRODUCTION** | `[E11]` |
| **INTERPRETATION** | **Both are internally correct about different objects.** `shiftLetter` wraps modulo 28; `intervals` takes plain integer differences and does not reduce them. Transposition-invariance holds on the ring; the implemented observable measures a line |
| **LIMITATION** | Not fixed. Changing `intervals` to reduce mod 28 would move it from the `000000` channel into a new row and change the channel grouping — a decision, not a repair |
| **STATUS** | **CONFIRMED** (that the pair is inconsistent as stated); the cause is `CONFIRMED` by measurement, not inferred |

---

## E5 — What does a truncated candidate set do downstream?

| | |
|---|---|
| **QUESTION** | `expand` caps at 5,000 and sets `truncated`. What happens when the cap bites? |
| **INPUT** | `تبيينيين` — 8 tooth-class letters, degree 78,125 |
| **MECHANISM** | `expand` (`text.ts:152`), `collapse` (`collapse.ts:42`), `read` (`reader.ts:545`) |
| **EXPECTED** | A truncated set is handled as incomplete |
| **ACTUAL** | |

```
degree 78,125   candidates 5,000   truncated true
first  بببببببن   last  بتثيييين   true word present: FALSE
collapse: terminal "corrupt", targetSurvived false

reader, Layer 10 "solve", n = 12:
  title: "weight alone cuts 78,125 to 0"
  body : "…arithmetic removes 78125 of the 78,125 candidates in one pass…
          What survives: ."
```

| | |
|---|---|
| **REPRODUCTION** | `[E8]`, `[E8b]` |
| **INTERPRETATION** | Truncation is **prefix-biased**, not sampled: `expand` breaks out of both loops at the cap (`text.ts:158-168`), so every retained candidate begins with the first member of the first open class. The true word was never generated, and the collapse reported that as `corrupt`. The reader generator mixes a true `degree` with a capped enumeration and emits a false user-facing sentence |
| **LIMITATION** | Measured at one cap on two words. The mechanism is structural and applies to every caller listed in `state-substrate-model.md` §4.2 |
| **STATUS** | **CONFIRMED** — and it is `architecture-stoppers.md` S-1 and S-2 |

---

## E6 — Where is enumeration genuinely exhaustive?

| | |
|---|---|
| **QUESTION** | Which computations are exhaustive under their declared bound? |
| **ACTUAL** | See §B below — the full bounds table |
| **INTERPRETATION** | Four computations are provably exhaustive (`taqlibOf` over S₃, `orderPermutation` over 28 letters, `footOrbits` over 8 feet, `closedIsUnionOfClasses`). `expand` is exhaustive exactly when `degree ≤ cap`, measured `[E2]`: complete for `مال`(1), `كتب`(15), `كهيعص`(20), `بين`(25), `يديه`(50), `نبين`(125), `استكتب`(150), `تبيين`(625); truncated for `تبيينيين`(78,125) and `بتثنيبتثني`(1,953,125) |
| **STATUS** | **CONFIRMED** |

---

## E7 — Do the passage-level operations degrade honestly?

| | |
|---|---|
| **QUESTION** | When an operation has no data, does it guess? |
| **INPUT** | `buildPassage("العلم نور")` — built **without** the lexicon, so no `lex`, no pools |
| **MECHANISM** | `OP_BY_ID[id].apply(passage)` for five lexicon-dependent operations |
| **ACTUAL** | |

```
sameSkeleton  acted 0/2 — 2 unresolved ("nothing else in the corpus shares its skeleton")
sameWeight    acted 0/2 — 2 unresolved ("nothing else in the corpus weighs 171")
roots         acted 0/2 — 2 unresolved ("no root in the lexicon")
taqlib        acted 0/2 — 2 unresolved ("no permutation of its root is used")
gloss         acted 0/2 — 2 unresolved ("unresolved")
```

| | |
|---|---|
| **REPRODUCTION** | `[E10]` |
| **INTERPRETATION** | Every one returns `keep(w, reason)` (`operations.ts:87`) with `unresolved: true` and a specific reason, and `coverage` counts only words that actually changed. **This is the repository's clearest working distinction between "no data" and "no result"** — the very distinction that is missing at the `Terminal` level (E5) |
| **STATUS** | **CONFIRMED** |

---

## E8 — Is the silent-substitution invariant real at passage scope?

| | |
|---|---|
| **QUESTION** | The kernel test proves skeleton invariance for 5 words × 40 seeds. Does it hold for a whole passage under the passage-level operation? |
| **INPUT** | `العلم نور والجهل ظلام` (`corpus.ts:168`) |
| **ACTUAL** | before `العلم ٮور والحهل طلام`, after `العلم ٮور والحهل طلام` — **byte-identical**. Weight moved. `reverse` on `العلم نور`: weight 427 → 427, profile `14 21` → `5 111` |
| **REPRODUCTION** | `[E10]` |
| **INTERPRETATION** | The complementarity claim of `spec/14 §14.1` is demonstrated at passage scope by two operations in opposite directions: `silent` preserves the page and destroys the arithmetic; `reverse` preserves the arithmetic and destroys the page |
| **LIMITATION** | One passage, one fixed seed (`0x5eed`, hardcoded at `operations.ts:235`) |
| **STATUS** | **CONFIRMED** |

---

# §F — The Furqān question

> Does the existing system already contain a computational mechanism whose
> function is: *given multiple admissible states/candidates, distinguish them
> using declared existing observables, constraints, transformations, or other
> existing rules*?

## **YES. Four such mechanisms exist.** Nothing was created.

### F1 — `collapse()` — the principal one

| | |
|---|---|
| **Location** | `lib/engine/collapse.ts:42` |
| **Input** | a `Word`; options `{cap?, only?}`; implicitly the module-global active lexicon |
| **Output** | `Collapse` — `{skeleton, initial[], degree, truncated, steps[], survivors[], terminal, target, targetSurvived, totalCost}` |
| **What distinguishes** | seven ranked filters, of which two do real work: **lexical** (`lex.has(c)`) and **morphological** (`abstractWord(c).length > 0`), plus **segmental** (profile match, which is admissible-by-construction for candidates of one skeleton) |
| **Demonstrated** | `[E1b]` — `كتب`: 15 → 1, terminal `determined`, true reading recovered. Asserted `engine.test.ts:226,241` |

### F2 — `solveByWeight()` — discrimination by one declared observable

| | |
|---|---|
| **Location** | `collapse.ts:142` |
| **Input** | `Word`, a target weight, an optional cap |
| **Output** | `string[]` — the candidates whose abjad total matches |
| **Demonstrated** | `[E1]` — 15 → 2 by arithmetic alone. Asserted `engine.test.ts:140` |
| **Note** | no UI caller exists |

### F3 — `Constraint.admits` + `suggest()` — discrimination during generation

| | |
|---|---|
| **Location** | `compose.ts:133` (the type), `compose.ts:245` (the generator) |
| **Input** | roots, a `ConstraintId`, `{pieces, target}` |
| **Output** | `Suggestion[]`, each carrying `root`, `pattern`, `word`, `weight`, `degree`, and a `reason` for its admission |
| **Demonstrated** | `[E6]` — from 6 roots × 35 patterns: `free` 12, `determined` 0, `unmoved` 0, `weight 462` → exactly `مكتب`. Asserted `compose.test.ts:32` |
| **Note** | this is the only Furqān-like mechanism a user drives directly, and the only one that carries a stated **reason** on each admitted candidate |

### F4 — `isNewChannel()` — discrimination between *observables*, with evidence

| | |
|---|---|
| **Location** | `invariance.ts:134` |
| **Input** | an unregistered `Observable`, the built table, a sample |
| **Output** | `{novel: boolean, signature: string, matches: string[]}` |
| **Demonstrated** | `[E4b]` — candidate "first letter" → `{novel: false, signature: "000000", matches: ["hijaiAddresses","intervals","residue","alignments","path"]}` |
| **Why it is the strongest** | it is the only discrimination mechanism in the repository that returns **the evidence for its verdict** rather than a boolean, and the only one that operates on the system's own machinery rather than on text |

## What is missing from all four

They share **no type**, **no registry**, and **no result shape**:

```
collapse filter  (candidate: string) => boolean          + skipped/skipReason
Constraint       admits(word, ctx) => boolean            + status(pieces, ctx)
solveByWeight    an inline predicate over string
isNewChannel     (table, candidate, sample) => {novel, signature, matches}
```

Three of the four return a bare boolean per candidate and discard the reason.
Only `collapse` records what it removed, and it caps that record at 40 entries
(`collapse.ts:73`) — measured `[E5c]`: for `نبين`, 80 candidates were removed and
40 were recorded.

**Verdict: FOUND.** Furqān-like discrimination is present four times over. What
is absent is a *common* discrimination interface — and, crucially, any of them
distinguishing *unexplored* from *rejected* (S-2).

---

# §T — The Tartīl question

> Does the existing system already contain a computational mechanism whose
> behaviour can be described as
> STATE → admissible transition → STATE → admissible transition → STATE?

## **PARTIAL.** The step exists. The walk does not.

### What exists

**T1 — the single admissible transition.** E1 established
`STATE A → operation → STATE B → observable → constraint → STATE C` with no glue
and no invented operation. The primitive is present.

**T2 — a genuine state sequence.** `timeline(raw)` (`timeline.ts:42`) returns
four ordered `Stop`s, measured `[E7]`:

```
era 3  As written    "كَتَبَ"  denotes 1
era 2  Vowels gone   "كتب"    denotes 1
era 1  Dots gone     "كٮٮ"    denotes 15
era 0  The futures   "كٮٮ"    denotes 15
```

Monotone in marking, and each stop carries how many words its surface denotes.

**T3 — genuine, priced edges.** `teleport` (`teleport.ts:85`) gives every word
its exits on five address channels, each with `scanCost` and `indexCost`.
Measured `[E3]`: `كتب` has 47 exits on `profile` and 5 on `root`.

**T4 — two steps, actually taken.** Measured `[E3]`:
`كتب --profile--> علم --weight--> سليم`.

### Exactly what is missing

| Missing piece | Evidence |
|---|---|
| **Type closure.** `teleport(word: Word) → Jump[]` with `destinations: string[]`. Step 2 in `[E3]` required an out-of-band `parseWord`, performed by the diagnostic, not by the engine | `teleport.ts:74-95` |
| **A transition function for the timeline.** The four `Stop`s are all computed in one pass from the same input (`timeline.ts:48-83`); there is no `next(stop)`. Eras 1 and 0 share a surface and differ only in prose | `timeline.ts:42` |
| **A path object.** No `Path`, `Walk`, `Trace`, `Step`, `Edge` or `Node` type exists anywhere | grep over `lib/` |
| **A frontier.** No queue, stack, worklist or `visited` set exists | `architecture-gaps.md` G-4 |
| **Termination.** With no visited set, `علم --weight--> سليم --weight--> علم` is not prevented or detected | `teleport.ts:85` |
| **Accumulated cost.** `HandCost` is computed per operation and `addCost` exists (`types.ts:37`), but nothing sums cost across steps | `architecture-gaps.md` G-12b |
| **A record.** Nothing anywhere stores that a path was walked | `architecture-gaps.md` G-6 |

### Where the walk actually happens today

`components/Workspace.tsx:152` — `onJump={(d) => setText(d)}`. A user clicking a
teleport destination replaces the text box contents and the whole workspace
re-derives. **The traversal exists in React state, not in the engine.** That is
the one place in the entire application where an output becomes the next input.

### Verdict

**PARTIAL.** The primitive (T1) is confirmed present and required no invention.
A state sequence (T2) and an edge relation (T3) both exist as first-class,
tested objects. What does not exist is anything that connects them: no closed
type, no transition function, no path, no frontier, no termination, no record.

This is evidence that a traversal abstraction **may be extractable** from
existing machinery — the pieces are real and they are not imaginary. It is not
evidence that one exists. **Nothing of the kind was implemented in this pass.**

---

# §C — The capability question

> Can the existing runtime already answer "what can this system do"?

## **PARTIAL — substantially more than expected, in six pieces.**

Measured `[INVENTORY]`:

```
layers registered      : 21
observables registered : 25   classCount, strokeCount, liftCount, dotCount, valence,
                              faces, hijaiAddresses, intervals, skeleton, arity, degree,
                              cardinality, profile, chunkCount, multiset, weight,
                              reduction, pulse, residue, alignments, fixedUnder,
                              expansionMarks, path, bitsWithheld, length
transforms registered  :  6   reflect, shift1, silent, shift3, permute, reverse
passage operations     : 13   skeleton, roots, lemmas, repattern, sameSkeleton,
                              sameWeight, silent, taqlib, reverse, shift, gloss,
                              openness, weightmap
compose constraints    :  5   free, weight, unmoved, oneRoot, determined
teleport channels      :  5   skeleton, weight, profile, root, multiset
layer-20 constants     : 13
lexicon                :      1,651 roots / 4,241 lemmas / 16,722 forms
```

### Existing structures that already provide capability evidence

No new capability system is needed to read any of this. The evidence is already
there:

| Structure | What it already declares | File:line |
|---|---|---|
| `Layer` | `id`, `slug`, `name`, `band`, `statement`, its observables, its transforms | `types.ts:142` |
| `Observable` | `id`, `layer`, `label`, **`discards`** — a self-declared statement of loss — and `cost` | `types.ts:96` |
| `Transform` | `id`, `layer`, `label`, `invertible`, `cost` | `types.ts:110` |
| `Operation` | `id`, `name`, `scope`, `kind`, `readable`, `layer`, `note`, `options`, and `preserved`/`lost` on each result | `operations.ts:52` |
| `Constraint` | `id`, `name`, `note`, `admits`, `status` | `compose.ts:133` |
| `constants()` | 13 checkable constants, each with `label`, `value`, `layer` and **`method`** — how it was derived | `band5.ts:187` |
| the computed invariance table | what each observable survives, **measured** rather than declared | `invariance.ts:52` |

Three consumers already read these: `app/layers/page.tsx:6` renders the
registry, `LayerStack.tsx:17` runs it over a word, `InvarianceView.tsx:18`
cross-products it.

### What stops it being an answer

1. **No single entry point.** A caller must import from six modules.
2. **No HTTP surface.** `GET /api/passage` returns lexicon counts
   (`route.ts:29`) and nothing else.
3. **`GENERATORS` (`reader.ts:80`) is not exported** — the 24 reading operations
   cannot be enumerated at all.
4. **The richest capability strings are authored, not derived.**
   `Operation.preserved[]`, `Operation.note` and `Observable.discards` are human
   prose. The runtime can say that `silent` preserves the skeleton because
   someone typed it (`operations.ts:254`), not because it measured it — even
   though, for the six registered transforms, it **could** read exactly that off
   the invariance table it already computes.

**No capability system was built.** The above is an inventory of the evidence
that already exists for one.

---

# §B — Bounds

For every exhaustive or combinatorial computation found:

| Computation | File:line | Search space | Cardinality | Bound | Termination | Exhaustive under the bound? | Reproducible? | Persisted? |
|---|---|---|---|---|---|---|---|---|
| `expand` | `text.ts:152` | ∏ glyph domains | `degree(word)` | `cap`, default 5000 | cap or exhaustion | **only when `degree ≤ cap`**; above it, prefix-biased `[E8]` | yes (pure) | no |
| `solveByWeight` | `collapse.ts:142` | same, then filtered | ≤ `degree` | `cap` 20000 | exhaustion of the generated set | inherits `expand`'s limit; **does not read `truncated`** | yes | no |
| `collapse` | `collapse.ts:42` | `expand`'s output | ≤ `cap` | `cap` 5000 | seven filters, straight line | inherits `expand`'s limit | yes, given the lexicon | no |
| `abstractWord` | `patterns.ts:105` | 35 templates | ≤ 35 | the library | full scan | **yes** over the library; the library ≠ the language | yes | no |
| `taqlibOf` | `resolve.ts:50` | S₃ | 6, minus identity | none needed | exhaustion | **yes, provably** | yes | no |
| `fibre` | `patterns.ts:152` | 35 templates | ≤ 35 | the library | full scan | yes | yes | no |
| `suggest` | `compose.ts:245` | roots × patterns | ≤ 60 × 35 | `cap` 24, per-root 2 | early `return` at `:295` | **no** | yes | no |
| `orderPermutation` | `band1.ts:197` | 28 letters | 28 | none | every cycle walked | **yes** | yes | no |
| `footOrbits` | `band3.ts:252` | 8 feet | 8 | none | exhaustion | **yes** | yes | no |
| `closedIsUnionOfClasses` | `band2.ts:193` | 6 closed letters | 6 | none | exhaustion | **yes** | yes | no |
| `rootSpace(k)` | `band3.ts:127` | ordered k-subsets of 28 | 19,656 (k=3); 11,793,600 (k=5) | closed form | arithmetic | **yes, not enumerated** | yes | no |
| `buildIndex` | `teleport.ts:53` | the active lexicon | `lex.wordCount` | the lexicon | full scan | yes over that lexicon | yes | in-memory cache only |
| `indexes()` pools | `resolve.ts:29` | 16,722 forms | 16,722 | 24 per bucket, 12 delivered | full scan | scan is exhaustive; **buckets are capped** | yes | in-memory |
| `buildInvarianceTable` | `invariance.ts:52` | observables × transforms | 150 | 400 sample words | `break` on first witness | exhaustive over **cells**; **sampled** per cell | yes (seed 7) | no |
| `read(text, n)` | `reader.ts:545` | 24 generators × words | unbounded in `n` | `2 × 24` attempts per `n` | first non-null | n/a — not a search | yes in `(text, n)` | no |

### The four distinctions, as the bounds table expresses them

| Concept | Expressible? | How |
|---|---|---|
| **EXHAUSTED** | partially — `truncated === false` says it, and **nothing consumes it** to qualify a terminal | `types.ts:184` |
| **NO RESULT** | `terminal: "corrupt"` **when `truncated` is false** | `collapse.ts:121` |
| **INVALID** | `FilterStep.removed[]`, capped at 40 | `collapse.ts:73` |
| **NOT EXPLORED** | **not expressible** | — |

Measured collision `[E8]`/`[E12]`: `تبيينيين` (never generated) and `كهيعص`
(generated and eliminated) both return `terminal: "corrupt"`,
`targetSurvived: false`.

**No computation in the repository persists its result.** Every row above is
recomputed on every call or on every render.

---

# §P — Provenance audit

Could another developer reconstruct where a result came from? Five computations
audited, three required by the brief.

## P1 — `collapse(parseWord("كتب"))`

| Question | Answer |
|---|---|
| **origin** | partially — `skeleton` and `target` are on the result; the original `raw` string is not |
| **operation** | yes — each `FilterStep.id` names its filter |
| **parameters** | **no** — the `cap` and the `only[]` filter selection are not recorded |
| **intermediate states** | partially — `before`/`after` per step are exact; `removed[]` is **capped at 40** (`collapse.ts:73`). Measured `[E5c]` for `نبين`: morphological removed **80**, recorded **40** |
| **constraints** | by id only; the predicates are closures inside `collapse` and are not addressable |
| **observables** | not recorded — the segmental filter uses `profileOf`, the morphological uses `abstractWord`, neither is named on the result |
| **final result** | yes — `survivors`, `terminal`, `targetSurvived`, `totalCost` |
| **hidden input** | **the active lexicon** (`lexicon.ts:176`), a module-level mutable global, is not recorded. The same call under a different lexicon gives different survivors with nothing on the result to say so |
| **Verdict** | **NOT fully reconstructible.** Missing: `cap`, `only[]`, lexicon identity, and removals beyond 40 |

## P2 — `read("إفتح سمسم", 5)`

| Question | Answer |
|---|---|
| **origin** | yes — `subject` carries the word (`"سمسم"`), `n` carries the index |
| **operation** | yes — `layer: 5`, `op: "expand"` etc. |
| **parameters** | the rng seed is **not** stored, but it does not need to be: it is `hash(text) ^ imul(n+1, 2654435761)` (`reader.ts:549`), fully determined by `(text, n)` |
| **intermediate states** | no |
| **final result** | yes — `title`, `body`, `chips`, `stats`, `cost` |
| **reproducibility** | **total.** Verified `[E5]`: two independent `readMany("إفتح سمسم", 0, 12)` calls produce identical titles. Asserted `reader.test.ts:23` |
| **Verdict** | **RECONSTRUCTIBLE**, provided the caller still holds `text`. `Reading` carries `subject` (one word) but not the full input text, so a `Reading` in isolation cannot be replayed |

## P3 — `OP_BY_ID.repattern.apply(passage, "agent")`

| Question | Answer |
|---|---|
| **origin** | **no** — `OpResult` carries no reference to the input passage. `changes[].from` carries each word's normalised form, which is a partial reconstruction of the input |
| **operation** | yes — `OpResult.id` |
| **parameters** | **no** — the chosen `option` (`"agent"`) is **not** on the result. `repattern` and `shift` are the two parameterised operations and neither records its argument (`operations.ts:199`, `:386`) |
| **intermediate states** | no |
| **constraints** | none apply |
| **observables** | `preserved[]`/`lost[]` are **authored strings**, not measurements |
| **final result** | yes — `text`, `changes[]`, `coverage`, `summary` |
| **hidden input** | the whole server-side resolution: `w.lex`, `w.taqlib`, `w.sameSkeleton`, `w.sameWeight` were written by `resolvePassage` (`resolve.ts:100`) against `lib/data/*.json`. The lexicon version is nowhere on the result |
| **Verdict** | **NOT reconstructible.** Missing: the input passage, the option, and the lexicon version |

## P4 — a `Cell` from the invariance table

| Question | Answer |
|---|---|
| **origin** | `witness.before`/`after` when the verdict is `changes`; **nothing** when it is `invariant` |
| **operation** | yes — `observableId` and `transformId` |
| **parameters** | **no** — neither the sample size nor the seed is recorded on `Cell` or on `InvarianceTable` |
| **intermediate states** | `trials` — a counter of words tried before the `break`, not a sample size `[E11b]` |
| **Verdict** | **PARTIALLY reconstructible.** The default sample is `sampleWords(400, 7)`, but `InvarianceView.tsx:18` passes `sampleWords(300)` and `engine.test.ts:188` passes `sampleWords(150)`. Three different tables are built in the repository and none records which it is |

## P5 — a `Suggestion` from `suggest()`

| Question | Answer |
|---|---|
| **origin** | yes — `root: RootOption` |
| **operation** | yes — `pattern: Pattern` |
| **parameters** | the constraint is not on the result, but `reason` names it in prose |
| **final result** | `word`, `weight`, `degree` |
| **Verdict** | **RECONSTRUCTIBLE** — `applyPattern(s.pattern, [...s.root.root].slice(0,3))` regenerates `s.word` exactly |

## Summary

| Result | Reconstructible? | What is missing |
|---|---|---|
| `Collapse` | no | cap, filter selection, lexicon identity, removals past 40 |
| `Reading` | yes, given `text` | nothing |
| `OpResult` | no | input passage, chosen option, lexicon version |
| `Cell` | partial | sample size and seed |
| `Suggestion` | yes | nothing |

**No provenance infrastructure was added.** The pattern in the failures is
uniform and worth naming once: **every unreconstructible result is missing a
parameter that was passed as a function argument or read from a module global,
and every reconstructible one carries its inputs on the result object.**

---

# Summary of experimental status

| Experiment | Question | Status |
|---|---|---|
| E1 / E1b / E1c | Does `A → operation → B → observable → constraint → C` already exist? | **CONFIRMED** |
| E2 | Is the invariance table reproducible and self-extending? | **CONFIRMED** |
| E3 | Is the `pulse` invariance row real? | **REFUTED** |
| E4 | Does "shift preserves intervals" hold as stated? | **CONFIRMED inconsistent**; cause measured |
| E5 | Is a truncated candidate set handled as incomplete? | **CONFIRMED that it is not** |
| E6 | Where is enumeration genuinely exhaustive? | **CONFIRMED** — 4 places provably, 1 conditionally |
| E7 | Do passage operations degrade honestly? | **CONFIRMED** |
| E8 | Does the silent-substitution invariant hold at passage scope? | **CONFIRMED** |
| §F | Does Furqān-like discrimination exist? | **FOUND** — four mechanisms |
| §T | Does Tartīl-like traversal exist? | **PARTIAL** — step yes, walk no |
| §C | Can the runtime describe its capabilities? | **PARTIAL** — six pieces, no entry point |
| §P | Can results be reconstructed? | **PARTIAL** — 2 of 5 yes, 1 partial, 2 no |

One question remains **INCONCLUSIVE** and is recorded as such rather than
resolved: whether the Layer 11 pulse is an independent channel
(`band3.ts:317`). E3 refuted the table's row but could not test the underlying
claim, because no transform in the repository can carry tashkīl across itself
(`state-substrate-model.md` §1.2). Establishing it would require a transform
that preserves marks, which would be new machinery — **outside this pass**.
