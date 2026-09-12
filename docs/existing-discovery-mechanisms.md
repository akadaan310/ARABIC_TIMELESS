# Existing discovery mechanisms

The question this document answers: **where does the system already do
`INPUT → GENERATE → FILTER → COMPARE → COLLAPSE → RECORD`?**

Not "where could it", and not "where does it look like it does on screen". Each
mechanism below was run. Anything that turned out to be presentation rather than
discovery is in §8.

Reproduction: `npx vitest run lib/engine/__tests__/archaeology.diagnostic.test.ts`

---

## Summary

| # | Mechanism | Generates | Filters | Collapses | Records | Verdict |
|---|---|---|---|---|---|---|
| D1 | `collapse()` | yes | yes, 7 ranked filters | yes, to a named terminal | yes, per-step audit | **full loop** |
| D2 | `solveByWeight()` | yes | yes, one predicate | yes | no | generate+filter |
| D3 | `suggest()` | yes | yes, by `Constraint` | no — returns a list | no | generate+filter |
| D4 | `abstractWord()` | yes | yes, exact alignment | no — returns all | no | generate+filter |
| D5 | `taqlibOf()` | yes, exhaustive over S₃ | yes, corpus membership | no | no | generate+filter |
| D6 | `buildInvarianceTable()` + `channels()` | yes (the cross-product) | yes (`break` on witness) | yes (grouping by row) | yes (`witness`) | **full loop, meta-level** |
| D7 | `isNewChannel()` | — | — | yes — a novelty verdict | returns `{novel, signature, matches}` | **discrimination** |
| D8 | `teleport()` | — | — | — | — | addressing, not discovery |
| D9 | `timeline()` / `futures()` | yes | no | no | no | generation only |
| D10 | `read(text, n)` | yes (generator space) | yes (`null` → try next) | yes (one reading) | yes (`n` + `subject`) | **full loop, but over utterances** |

---

## D1 — `collapse()`: the reading procedure

`lib/engine/collapse.ts:42`. The one place in the repository that does the whole
loop and writes down what happened at each step.

| Stage | Mechanism |
|---|---|
| **1. initial state** | a `Word` from `parseWord` — carries `skeleton` and per-glyph `domain` |
| **2. candidate space** | `expand(word, cap)` (`text.ts:152`), the Cartesian product of the domains. Cardinality = `degree(word)`; capped at `options.cap ?? 5000` |
| **3. generation** | eager and complete when `degree ≤ cap`; **prefix-truncated** otherwise (`state-substrate-model.md` §4.1) |
| **4. filtering** | seven `run(...)` calls in fixed rank order (`collapse.ts:78-118`): lexical → segmental → morphological → prosodic → syntactic → semantic → intentional. Each is `(candidate: string) => boolean` |
| **5. stopping** | the pipeline is **straight-line**, not iterative. `spec/06` says "apply in order and iterate to a fixed point" and `band2.ts:135` repeats it; the implementation runs each filter exactly once |
| **6. resulting state** | `survivors: string[]` plus `terminal ∈ {determined, corrupt, intended}` (`collapse.ts:121`) |
| **7. provenance** | per step: `before`, `after`, `removed` (**capped at 40**, `collapse.ts:73`), `cost`, `skipped`, `skipReason`. Plus `degree`, `truncated`, `target`, `targetSurvived`, `totalCost` |
| **8. reproducibility** | total — `collapse` takes no `rng`; the only hidden input is the module-global active lexicon (`lexicon.ts:176`), which is **not recorded on the result** |

Measured `[E1b]` for `كتب`:

```
degree 15  initial 15  truncated false
  1 lexical         15 →   1   removed 14 recorded
  2 segmental        1 →   1   removed 0
  3 morphological    1 →   1   removed 0
  4 prosodic         1 →   1   SKIPPED: the input carries no tashkīl…
  5 syntactic        1 →   1   SKIPPED: needs the surrounding words
  6 semantic         1 →   1   SKIPPED: needs the surrounding text
  7 intentional      1 →   1   SKIPPED: needs a model of the writer
survivors كتب | terminal determined | targetSurvived true
totalCost {"marks":0,"counts":18,"held":4}
```

### What makes this genuinely discovery rather than display

Three things, all checkable:

1. **The ground truth is held and checked.** Because the input is modern Arabic,
   `target` is known, and the last thing the procedure does is test whether the
   truth survived (`collapse.ts:120`). A filter pipeline that never checks
   itself is not auditable; this one is.
2. **A filter that cannot run says so instead of returning everything.**
   `skipped` + `skipReason` (`types.ts:171`) is a third value beyond
   pass/eliminate.
3. **One filter refuses to report its own ignorance as a finding.** If the
   lexical filter would empty the set, it un-runs itself
   (`collapse.ts:84-91`) and records the reason: *"no candidate is in the seed
   lexicon — the filter would be reporting its own coverage, not the text."*

### Where it stops being discovery

- **Filters 5–7 never run** on any input. They are always skipped
  (`collapse.ts:112-118`) because a single-word analysis has no context. Four of
  seven filters are therefore structural placeholders — honest ones, with
  reasons, but not mechanisms.
- **Filter 4's predicate is `() => true`** (`collapse.ts:107`). When the input is
  voweled the prosodic filter runs and removes nothing. It is declared, not
  implemented.
- **Filter 3 has no self-ignorance fallback.** Measured `[E12]`:

```
word   degree  alignments  morph before→after  skipped  terminal    targetSurvived
كهيعص      20           0        20→   0        false   corrupt     false
الم         1           2         1→   1        false   determined  true
طه          2           0         2→   0        false   corrupt     false
حم          3           0         3→   0        false   corrupt     false
يس         10           0        10→   0        false   corrupt     false
```

  "No template in a 35-entry library aligns" is reported identically to "this
  text is corrupt", even though `band4.ts:103` and `reader.ts:332` both state
  the correct reading in prose.

So: **two filters do real work** (lexical, morphological), one does none, four
never run. The loop is real; two-sevenths of it is populated.

---

## D2 — `solveByWeight()`: constraint solving, backward

`collapse.ts:142`. Given a skeleton and a known abjad total, which bindings
satisfy both?

```
STATE A     كتب — skeleton كٮٮ, arity 2, degree 15
GENERATE    expand(word, 5000)        → 15 candidates, truncated false
OBSERVE     weightOf(letters)         → 422
FILTER      value(c) === 422
STATE C     كبت, كتب                   → 2 of 15
```

Measured `[E1]`. Asserted independently at `engine.test.ts:140`.

This is the cleanest `A → B → C` in the repository and it is discussed as such
in `architecture-examples.md` §1. Two limitations, both recorded:

- **No UI caller exists.** Grep across `lib/`, `components/`, `app/`,
  `artifact/` finds it referenced only by tests and diagnostics.
- **It does not read the `truncated` flag** (`collapse.ts:143`), so above its
  default cap of 20,000 it silently searches a prefix-biased subset.

---

## D3 — `suggest()`: generate-and-filter in the composer

`compose.ts:245`. The one discovery mechanism a user drives directly.

| Stage | Mechanism |
|---|---|
| candidate space | `roots × patterns` — up to 60 roots × 35 patterns |
| generation | `applyPattern(pattern, radicals)` (`compose.ts:270`) |
| filters, in order | `plausible(word)` (`:271`) → dedupe by `seen` (`:271`) → per-root cap (`:269`, 2 or `cap`) → the active `Constraint` (`:274-276`) |
| stopping | `out.length >= cap` → early `return` (`:295`) |
| result | `Suggestion[]`, each carrying `root`, `pattern`, `word`, `weight`, `degree`, `reason` |
| provenance | **good** — `root` and `pattern` are both on the result, so any suggestion is reconstructible by `applyPattern` |

Measured `[E6]`, 6 roots × 35 patterns:

```
free         → 12   كتب(422) كاتب(423) درس(264) دارس(265) علم(140) عالم(141) حكم(68) حاكم(69)
determined   →  0
unmoved      →  0
weight 462   →  1   مكتب(462)
```

The `weight` mode is the interesting one: it is a **backward solve**. The
constraint is `m.weight !== need` where `need = target − currentTotal`
(`compose.ts:259,276`), so the generator is being asked "what lands exactly on
this number", and it answers. Asserted at `compose.test.ts:32`.

### A finding about the empty results

`determined` and `unmoved` return **zero** over those six roots, and this is not
a bug: `[E6]`/`[P3]` confirm that none of the 35 patterns applied to ك-ت-ب,
د-ر-س, ع-ل-م, ح-ك-م or ن-ظ-ر yields a degree-1 word. The constraint is doing
exactly what it says.

The consequence is that `compose.test.ts:24` — "does not let one root fill the
palette" — asserts over an **empty list** and its loop body never executes. The
per-root cap it means to test is untested. Recorded in `architecture-review.md`
§N and `architecture-stoppers.md` S-5.

---

## D4 — `abstractWord()`: reverse-engineering a function from its output

`patterns.ts:105`. Generation is over the 35-template library; the filter is
exact alignment (`alignOne`, `patterns.ts:120` — equal length, literal
characters matching exactly, all three radical slots filled).

Measured `[E6b]`:

```
مكتوب    → 1 alignment    patient:كتب
مكتب     → 3 alignments   agentII:كتب  patientII:كتب  place:كتب
استكتب   → 1 alignment    X:كتب
كتب      → 2 alignments   I:كتب  II:كتب
كهيعص    → 0 alignments
```

It **does not collapse**. Returning all three alignments for `مكتب` rather than
choosing one is a deliberate refusal recorded in the source comment
(`patterns.ts:96-104`): the string is genuinely ambiguous between patterns. That
is discovery stopping at the honest place.

The same function is used three ways — as an operation, as the Layer 13
observable `alignments`, and as the collapse pipeline's morphological
**constraint**. See `operations-inventory.md` §3.2.

---

## D5 — `taqlibOf()`: the one exhaustive enumeration

`resolve.ts:50`. Al-Khalīl's method, executed.

```
initial state     a triliteral root string
candidate space   all 6 orderings — the full symmetric group S₃
generation        a literal permutation table (resolve.ts:245-247)
filter            drop the identity; keep those getRoot() recognises
stopping          exhaustion — the space is 6
result            ≤ 5 {root, glosses} pairs, sorted by gloss count
provenance        the source root is the caller's; not stored on the result
```

This is the only enumeration in the repository that is **exhaustive, complete,
and small enough to be provably so**. No cap, no truncation, no sampling.
`IMPLEMENTED`.

---

## D6 — `buildInvarianceTable()`: discovery about the system itself

`invariance.ts:52`. This is the mechanism the repository's own comments call
"the discovery mechanism" (`types.ts:9-14`, `registry.ts:9-10`), and the claim
survives inspection.

| Stage | Mechanism |
|---|---|
| initial state | the registry — 21 layers, 25 observables, 6 transforms |
| candidate space | the full cross-product, 150 cells `[E4]` |
| generation | `sampleWords(400, seed 7)` — reproducible pseudo-random words, length 3–7 |
| comparison | `serialize(compute(w))` vs `serialize(compute(t.apply(w, rng)))` |
| filtering / collapse | `break` on the first difference → `verdict ∈ {invariant, changes, undefined}` |
| second collapse | `channels()` (`invariance.ts:118`) groups observables by identical row → **5 distinct channels** from 25 observables |
| provenance | `Cell.witness` records the actual before/after word and the two readings; `trials` counts attempts before the break |
| reproducibility | **total** — verified `[E4]`: two independent builds produce byte-identical cell sets |

The genuinely self-extending property is real and is structural, not claimed:
`observables()` and `transforms()` read from `REGISTERED` (`registry.ts:40,44`),
so registering a layer adds rows and columns without any other file changing.
Three independent consumers read the same list — the table, `LayerStack.tsx:17`,
and `app/layers/page.tsx:6`.

Caveat, established in `observables-invariants.md` §3: `invariant` means *not
refuted over this sample*, and for `pulse` (§3.1) and `fixedUnder` (§3.3) the
sample cannot refute it.

---

## D7 — `isNewChannel()`: the novelty test

`invariance.ts:134`. Given an observable **not** in the registry, compute its
row and ask whether any registered observable already has it.

```
input     an unregistered Observable + the built table + a sample
output    { novel: boolean, signature: string, matches: string[] }
```

Measured `[E4b]` on a probe observable "first letter":

```
{ "novel": false, "signature": "000000",
  "matches": ["hijaiAddresses","intervals","residue","alignments","path"] }
```

Correct, and useful: the first letter of a word is destroyed by every transform
tested, so it lands in the fragile channel and contributes no new distinction.

**This is the closest thing in the repository to a working discovery
instrument**: a candidate is proposed, measured against existing machinery, and
returned with a verdict and the evidence for it. It is not wired into any UI.

---

## D8 — `teleport()`: addressing, and why it is not traversal

`teleport.ts:85`. Indexes the active lexicon by one of five observables and
jumps to everything sharing an address.

```
[E3]  exits from كتب: profile@"3" → 47 destinations, root@"كتب" → 5 destinations
      step 1: كتب --profile--> علم
      step 2: علم --weight--> سليم
```

The two-step chain works, so something traversal-shaped is reachable. What makes
it *not* a traversal abstraction is recorded precisely in
`architecture-examples.md` §5 and `architecture-gaps.md` G-7:

- **types do not close**: `teleport(word: Word) → Jump[]` whose `destinations`
  are `string[]`. Continuing requires an out-of-band `parseWord`.
- **no visited set, no frontier, no path object**: each call is independent.
- **no cost accumulation across steps**: `Jump.scanCost`/`indexCost`
  (`teleport.ts:80`) price a single hop.
- **the only caller closes the loop by hand**: `Workspace.tsx:152`
  (`onJump={(d) => setText(d)}`) replaces the text box contents. The chaining
  lives in React state, not in the engine.

It is a genuine **address space** — `Jump.indexCost` is 1 regardless of corpus
size, which is the actual claim being made (`teleport.ts:6-13`) — and it is not
a walk.

---

## D9 — `timeline()` / `futures()`: generation without filtering

`timeline.ts:42,87`. Four fixed stops over decreasing marking, measured `[E7]`:

```
era 3  As written    "كَتَبَ"  denotes 1
era 2  Vowels gone   "كتب"    denotes 1
era 1  Dots gone     "كٮٮ"    denotes 15
era 0  The futures   "كٮٮ"    denotes 15
futures("كتب"): total 15, returned 15, truncated false
```

This is a **sequence of states**, and it is the most traversal-shaped object in
the repository — see `architecture-examples.md` §5. But nothing is filtered, no
candidate is eliminated, and eras 1 and 0 are the same surface with different
prose. Generation only.

---

## D10 — `read(text, n)`: discovery over utterances

`reader.ts:545`. A different kind of loop, and it does close.

| Stage | Mechanism |
|---|---|
| candidate space | 24 generators × every word in the text × the `rng` draws inside each |
| generation | `GENERATORS[(n + attempt) % 24]` applied to `words[(n + attempt) % words.length]` |
| filtering | **a generator returns `null` when it does not apply**, and the walker tries the next (`reader.ts:554-562`), up to `2 × 24` attempts |
| collapse | the first non-null result is *the* reading for `n` |
| record | the `Reading` carries `n`, `subject`, `layer`, `op`, `cost` |
| reproducibility | **total in `(text, n)`** — the seed is `hash(text) ^ imul(n+1, …)` (`reader.ts:549`); verified `[E5]` and at `reader.test.ts:23` |

The null-return-and-walk-on is a real admissibility filter: a Layer 5 generator
returns `null` for a degree-1 word (`reader.ts:191`), a Layer 9 generator returns
`null` for words under 3 letters (`reader.ts:264`). Asserted at
`reader.test.ts:6`: 200 readings for each of 13 examples, all non-null.

What it records is **prose**, not state. Nothing consumes a `Reading`.

---

## §8 — Things that look like discovery and are not

| Surface | What it looks like | What it is |
|---|---|---|
| `XRay` slot binding (`XRay.tsx:62`) | narrowing a candidate set one mark at a time — Layer 4 binding by hand | a `useState` record `{index: letter}` rendered over the glyph. **The bound value never re-enters the engine**: `degree`, `collapse` and everything else still see the original `Word`. Pure display. |
| `LiveMode` infinite scroll (`LiveMode.tsx:27`) | a system generating endlessly | `readMany(text, 0, count)` with `count` incremented by an `IntersectionObserver`. The stream is a deterministic function of `(text, n)`; nothing accumulates and nothing is explored |
| `TimeTravel` slider | moving through states | `useState<Era>` selecting one of four precomputed `Stop`s |
| `openness` / `weightmap` operations | passage-scale analysis | observables (`operations-inventory.md` §2.1) |
| `PassageReader` operation buttons | composing transformations | a single `opId` in state (`PassageReader.tsx:25`); the result is rendered and discarded. Applying a second operation re-runs it **on the original passage**, never on the first result |
| `InvarianceView` | a live experiment | genuinely live — `buildInvarianceTable(sampleWords(300))` runs in the browser on mount. **This one is not presentation.** |

---

## What this establishes

1. The generate → filter → collapse → record loop **exists and runs**, in
   `collapse()` for candidate words and in `buildInvarianceTable()` for the
   system's own structure.
2. Candidate generation exists in **six** places and is bounded in all six;
   exhaustiveness is guaranteed in only one (`taqlibOf`, over S₃).
3. Discrimination between admissible alternatives exists in **four** places
   (D1, D2, D3, D7) with four unrelated signatures.
4. **Nothing composes.** No result of any of these mechanisms is an admissible
   input to another one of them without a manual type conversion.
5. **Nothing is recorded beyond the call.** Every loop above returns its result
   to a React render and the result is dropped on the next state change.
