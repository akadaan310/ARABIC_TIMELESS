# Operations inventory — what already transforms what

No Operations abstraction was invented for this document. What follows is an
inventory of the transformations that exist, in the three separate families the
repository already keeps them in, **recorded separately rather than merged**.

Evidence vocabulary: see `architecture-review.md` §0.
Reproduction: `npx vitest run lib/engine/__tests__/archaeology.diagnostic.test.ts`

---

## Family 1 — kernel `Transform` (registry-visible, `Word → Word`)

Interface: `lib/engine/types.ts:110`. Six exist. These are the only operations
the Layer 14 invariance table can see (`invariance.ts:53`).

---

### 1.1 `reflect` — الانعكاس

| | |
|---|---|
| source | `lib/engine/layers/band1.ts:251`, helper `reflectLetter` at `band1.ts:177` |
| layer | 3 |
| input / output | `Word` → `Word` |
| parameters | none |
| behaviour | each letter's hijāʾī address `n` → `29 − n`, then `wordFromLetters` re-derives positions |
| observables affected | every position-sensitive reading: skeleton, profile, arity, degree, weight, multiset, residue, path, addresses, intervals |
| observables preserved | `length`, `classCount`, `liftCount` (computed row `111111` for those) |
| constraints | none |
| invertibility | **declared** `invertible: true`; **demonstrated** — `engine.test.ts:52` proves `reflect∘reflect = id` at the letter level and that it has no fixed points. No `Transform`-level inverse function exists |
| composition | none available |
| determinism | yes — ignores `rng` |
| provenance | none beyond the returned `Word` |
| tests | `engine.test.ts:52` |
| example | `كتب` → `reflectLetter` each: ك(22)→ي, ت(3)→ظ, ب(2)→ه ⇒ `يظه` |
| evidence | IMPLEMENTED |

### 1.2 `shift1` — الإزاحة (and 1.3 `shift3`)

| | |
|---|---|
| source | `band1.ts:261` (`shift1`), `band3.ts:97` (`shift3`); helper `shiftLetter` at `band1.ts:183` |
| layer | 3 and 8 respectively |
| behaviour | `i → (i + k) mod 28` on the hijāʾī ring, `k` fixed at 1 and 3 |
| preserved | the interval sequence is *claimed* preserved (`operations.ts:399`, `reader.ts:144`) but the registered observable `intervals` computes row `000000` — it is reported as *changing* under `shift1`. See §4.1 below. |
| invertibility | declared true; no inverse implemented |
| determinism | yes |
| tests | none directly |
| evidence | IMPLEMENTED; the interval-preservation claim is `CONTRADICTED` by the computed table — §4.1 |

**These are two implementations of one concept** (`shiftLetter` with a different
`k`), registered as two transforms on two different layers. Recorded, not merged.

### 1.4 `silent` — الإبدال الصامت

| | |
|---|---|
| source | `band3.ts:86`; map builder `silentSubstitution(rng)` at `band3.ts:58` |
| layer | 8 |
| input / output | `Word` → `Word` |
| parameters | the injected `Rng` selects which element of the subgroup |
| behaviour | shuffles each class of `CLASSES_UNIVERSAL` (`alphabet.ts:101`) and applies the resulting letter map |
| observables preserved | `skeleton`, `profile`, `arity`, `degree`, `cardinality`, `chunkCount`, `bitsWithheld`, `expansionMarks`, `valence`, `faces` — the whole `001000` channel, measured `[E4]` |
| observables destroyed | `weight`, `reduction`, `multiset`, `dotCount`, `residue`, `alignments`, `path`, addresses, intervals |
| constraints | the map is drawn from the *universal* classes, not the medial ones — the distinction is the point (`band3.ts:36-245`) |
| cardinality of the group | 4,608 (universal) vs 92,160 (medial-only), both computed at `band3.ts:30,243` |
| invertibility | declared true; the map is a permutation so an inverse exists mathematically; **no inverse is implemented** |
| determinism | only with a fixed `rng` |
| tests | `engine.test.ts:93,99,104,109,116` — including 40 seeds × 5 words proving the skeleton is fixed |
| example | `العلم نور والجهل ظلام` → `الغلم نور والحهل ظلام`, skeleton `العلم ٮور والحهل طلام` **byte-identical** `[E10]` |
| evidence | IMPLEMENTED, invariance demonstrated |

### 1.5 `permute` — التقليب

| | |
|---|---|
| source | `band3.ts:152`; `shuffled` at `helpers.ts:69` |
| layer | 9 |
| behaviour | Fisher–Yates over `word.letters` using the injected `rng` |
| preserved | `weight`, `reduction`, `multiset`, `dotCount`, `length` (`000011` row) |
| destroyed | `skeleton`, `profile`, everything positional |
| invertibility | declared true; **not demonstrated** — the permutation actually used is not returned, so the specific inverse is unrecoverable from the result |
| determinism | only with a fixed `rng` |
| tests | `engine.test.ts:188` (weight invariant under permute), `:204` |
| evidence | IMPLEMENTED; `invertible: true` is `CONTRADICTED` in practice — see `architecture-stoppers.md` S-6 |

### 1.6 `reverse` — القلب

| | |
|---|---|
| source | `band3.ts:160` |
| layer | 9 |
| behaviour | `[...letters].reverse()` then re-parse |
| preserved | same `000011` row as `permute` |
| invertibility | declared true; genuinely an involution, though no inverse function exists |
| fixed points | palindromes — `isPalindrome` at `band4.ts:141` |
| determinism | yes |
| evidence | IMPLEMENTED |

---

## Family 2 — passage `Operation` (`Passage → OpResult`)

Interface: `operations.ts:52`. Thirteen exist (`operations.ts:488`). None is
visible to the invariance table. Each declares `preserved[]` and `lost[]` as
**authored strings**, not computed facts — that is the key type-level
difference from Family 1.

Every entry below was run `[E5b]`, `[E10]`.

| id | source | scope | kind | layer | in | out | readable Arabic? | options | deterministic | provenance in result |
|---|---|---|---|---|---|---|---|---|---|---|
| `skeleton` | `operations.ts:148` | letter | reduce | 4 | `Passage` | `OpResult` | yes | — | yes | id only |
| `roots` | `:99` | passage | reduce | 12 | | | yes | — | yes | id only |
| `lemmas` | `:124` | word | reduce | 13 | | | yes | — | yes | id only |
| `repattern` | `:183` | passage | rewrite | 13 | | | yes | `pattern` ∈ 13 ids | yes | **option not recorded** |
| `sameSkeleton` | `:260` | word | rewrite | 5 | | | yes | — | yes (takes `alts[0]`) | id only |
| `sameWeight` | `:286` | word | rewrite | 10 | | | yes | — | yes (takes `alts[0]`) | id only |
| `silent` | `:226` | letter | rewrite | 8 | | | yes | — | **yes** — seed hardcoded `0x5eed` (`:235`) | id only |
| `taqlib` | `:317` | word | rewrite | 9 | | | yes | — | yes (takes `opts[0]`) | id only |
| `reverse` | `:343` | word | rewrite | 9 | | | yes | — | yes | id only |
| `shift` | `:372` | letter | rewrite | 3 | | | **no** | `k` ∈ {1,2,3,7,14} | yes | **option not recorded** |
| `gloss` | `:410` | word | reveal | 6 | | | no | — | yes | id only |
| `openness` | `:434` | passage | reveal | 4 | | | no | — | yes | id only |
| `weightmap` | `:459` | sentence | reveal | 10 | | | no | — | yes | id only |

### 2.1 Which of these are operations, and which are something else

The brief asks this explicitly. Applying the test "does it rewrite the state, or
does it read it":

| id | what it actually is |
|---|---|
| `gloss`, `openness`, `weightmap` | **observables at passage scope**, not operations. `kind: "reveal"`, `readable: false`, `preserved: ["everything"]`, `lost: []`. `openness` returns `String(w.degree)` per word; `weightmap` returns `w.weight`. They are `Observable.display` in an `Operation`'s clothing. |
| `skeleton` | a **projection** — Layer 4's `project` (`text.ts:126`) lifted to passage scope. Lossy and non-invertible by construction. |
| `roots`, `lemmas` | **lexicon lookups**, not computations. Both return `keep(w, "…")` when the lexicon has no entry. Their output depends entirely on `resolvePassage` having run server-side. |
| `sameSkeleton`, `sameWeight` | **index lookups** into the pools built at `resolve.ts:29`, then "take element 0". The choice of element 0 is arbitrary and unrecorded. |
| `taqlib` | **candidate generation + filtering**, collapsed to one answer. `taqlibOf` (`resolve.ts:50`) enumerates all 6 orderings of a triliteral root and keeps those the corpus knows; the operation then takes `opts[0]`. |
| `repattern` | a genuine **function application** at passage scope — `applyPattern(pattern, root)` for every resolved word. |
| `silent`, `reverse`, `shift` | genuine **transformations**, and the passage-scope duplicates of Family 1's `silent`, `reverse`, `shift1/shift3`. |

### 2.2 Coverage is reported honestly

Every operation that cannot act on a word returns `keep(w, reason)`
(`operations.ts:87`) with `unresolved: true` and a reason string, and
`OpResult.coverage` counts only words that changed. Measured on a passage built
**without** the lexicon `[E10]`:

```
sameSkeleton  acted 0/2 — 2 unresolved ("nothing else in the corpus shares its skeleton")
sameWeight    acted 0/2 — 2 unresolved ("nothing else in the corpus weighs 171")
roots         acted 0/2 — 2 unresolved ("no root in the lexicon")
taqlib        acted 0/2 — 2 unresolved ("no permutation of its root is used")
gloss         acted 0/2 — 2 unresolved ("unresolved")
```

This is the clearest example in the repository of *"no data"* being kept
distinct from *"no result"*. `IMPLEMENTED`.

### 2.3 One narrative overstatement, recorded

`silent`'s summary opens "Every letter replaced…" while the same result reports
`coverage {acted: 2, total: 4}` `[E10]` — two of the four words were fixed
points of the drawn substitution. The prose and the computed coverage disagree.
`CONTRADICTED` (mild). Logged in `architecture-stoppers.md` S-7.

---

## Family 3 — morphological functions (in neither registry)

### 3.1 `applyPattern` — the only operation with a demonstrated inverse

| | |
|---|---|
| source | `patterns.ts:81` |
| input | `Pattern` (`patterns.ts:15`) × `root: string[3]` |
| output | `string` (a written word), or `""` if the root is shorter than 3 |
| behaviour | substitute template digits `1`,`2`,`3` with the radicals; digits are used as placeholders precisely because they cannot occur in Arabic text (`patterns.ts:4-8`) |
| library | 35 patterns: 10 verb forms, 5 participles/agents, 8 nouns, 6 maṣdars, 6 broken plurals |
| determinism | yes, total |
| tests | `engine.test.ts:158` |
| example | `patient` × ك–ت–ب → `مكتوب`; `X` × ك–ت–ب → `استكتب`; `place` × ك–ت–ب → `مكتب` |
| evidence | IMPLEMENTED |

### 3.2 `abstractWord` — alignment, the partial inverse

| | |
|---|---|
| source | `patterns.ts:105`, helper `alignOne` at `:120` |
| input | `letters: string[]` |
| output | `Alignment[]` = every `(pattern, root)` pair that could have produced the string |
| behaviour | exact length match + exact literal match; returns **all** alignments because the mapping is genuinely many-to-one |
| measured `[E6b]` | `مكتوب` → 1 (`patient`); `مكتب` → 3 (`agentII`, `patientII`, `place`); `استكتب` → 1 (`X`); `كتب` → 2 (`I`, `II`); `كهيعص`/`طه`/`حم`/`يس` → **0** |
| invertibility | `abstractWord(applyPattern(p, r))` contains `(p, r)` — asserted for `place`, `patient`, `agent`, `X` at `engine.test.ts:173` |
| used as | a *constraint* inside `collapse` (`collapse.ts:100`: a candidate survives iff `abstractWord(...).length > 0`) and as an *observable* at Layer 13 (`alignments`, `band4.ts:87`) |
| evidence | IMPLEMENTED |

**This is the clearest case in the repository of one function serving as
operation, observable and constraint at once.** Recorded as such rather than
split.

### 3.3 `candidateRoots`, `fibre`

`candidateRoots` (`patterns.ts:138`) de-duplicates the roots of `abstractWord`.
`fibre` (`patterns.ts:152`) is the whole image of one root under the library —
the set of every word the 35 patterns can build on it. Both deterministic, both
bounded by the library size. `IMPLEMENTED`.

### 3.4 `taqlibOf`

`resolve.ts:50`. Enumerates all 6 permutations of a triliteral root, drops the
identity, and keeps those `getRoot()` recognises. Exhaustive over `S₃` and
bounded at 5. The only exhaustive-and-complete enumeration in the repository.
`IMPLEMENTED`.

---

## Family 4 — things that look like operations and are not

| Thing | File | What it really is |
|---|---|---|
| `expand` | `text.ts:152` | **candidate generation**, not a transformation — one state to a *set* |
| `collapse` | `collapse.ts:42` | **a pipeline of constraints**, returning an audit record, not a `Word` |
| `solveByWeight` | `collapse.ts:142` | **a constraint applied to a generated set**; no UI caller exists |
| `teleport` | `teleport.ts:85` | **an index lookup** — an address, not a rewrite. Its output type (`string[]`) differs from its input type (`Word`) |
| `timeline` | `timeline.ts:42` | **a projection sequence** over four fixed erasure depths |
| `undot` | `timeline.ts:34` | the projection `Word → skeleton string`, same content as `project` (`text.ts:126`) — **two implementations, one concept**, recorded not merged |
| `read` | `reader.ts:545` | **a generator over a fixed generator list**, returning prose + stats |
| `parseWord` | `text.ts:65` | **a parser** |
| `normalizeForLookup` / `fold` | `passage.ts:34`, `text.ts:25` | **normalisers**. They are separate implementations of the same fold: `passage.ts:25` uses regex replaces, `variants.ts:15` uses a map. The comment at `passage.ts:19` says they "must match `scripts/build-lexicon.mjs` exactly" — a third copy, in `scripts/build-lexicon.mjs:37`. **Three implementations of one normalisation.** |
| `render` | `passage.ts:191` | a renderer — and it is **imported but never called** in `operations.ts:18` |
| `metricsOf` | `compose.ts:49` | **an observable bundle** at word scope, computed outside the registry |
| `XRay` slot click | `XRay.tsx:62` | **a UI action** that binds a slot in local React state; the bound value never re-enters the engine |

---

## §4. Two claims in this family that the computation does not support

### 4.1 "Shift preserves the interval sequence"

Claimed at `operations.ts:399` ("The interval sequence of every word is
untouched"), at `reader.ts:144` ("Shift every letter equally and this sequence
is unchanged"), and in `spec/03-order.md`.

Measured `[E4]`: the registered observable `intervals` (`band1.ts:240`) has row
`000000` — it is reported as **changing** under `shift1`.

Cause, **measured not inferred** `[E11]`: over 200 sample words, 39 have a
different interval sequence after `shift1` and **all 39 contain a letter at
hijāʾī address 28** (ي, the last on the ring); **0** differ without one.

```
كتب  -19,-1  → shift1 →  -19,-1     unchanged
كتي  -19,25  → shift1 →  -19,-3     changed
```

`shiftLetter` wraps modulo 28 (`band1.ts:186`); `intervals` (`band1.ts:190`)
takes plain integer differences of `hijaiAddress` and does **not** reduce them
modulo 28. The claim is true of the ring; the implemented observable measures a
line. Both are internally correct about different objects.

Compounding it, the verdict rule is **existential**: `buildInvarianceTable`
`break`s on the first differing word (`invariance.ts:74-86`), so one
boundary-crossing witness out of 400 sets the whole row to `changes`, and
`Cell.trials` records how many words were tried before that break — **not** a
sample size. For `intervals × shift1`, `trials` is `1` `[E11b]`.

Status: the prose claim is `DOCUMENTED`; the computed cell is `IMPLEMENTED` and
correct for what it measures; the pair as usually stated is `CONTRADICTED`.
**Not fixed here.**

### 4.2 `invertible: true` on all six transforms

All six declare `invertible: true` (`[E4]` prints the flags). No inverse is
implemented anywhere in `lib/` — grep for `invert` returns only the six
declarations and the interface field. For `permute` the inverse is not merely
unimplemented but **unrecoverable**, because the permutation drawn from `rng` is
not returned with the result.

The Layer Contract's fourth condition ("every operation either inverts, or its
loss is exactly quantifiable", `README.md`) is therefore `DOCUMENTED`, not
`IMPLEMENTED`, at the level of the `Transform` type.

---

## Counts

- kernel `Transform`s: **6**
- passage `Operation`s: **13** (of which 3 are observables, 2 are projections,
  4 are lookups, 4 are genuine transformations)
- morphological functions: **4** (`applyPattern`, `abstractWord`,
  `candidateRoots`/`fibre`, `taqlibOf`)
- concepts implemented twice or three times: **5** (silent substitution,
  reversal, shift, projection/undot, normalisation ×3)
