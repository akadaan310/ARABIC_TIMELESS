# State and substrate model — what this system considers a computational object

The brief warns against forcing a unified model. **There is not one.** This
repository contains **five distinct state representations** that do not share a
type, plus three normalisation regimes that do not share an implementation. The
boundaries between them are the most important content of this document.

Evidence vocabulary: `architecture-review.md` §0.

---

## 1. The five state representations

| # | Representation | Type | File:line | Scope | Carries |
|---|---|---|---|---|---|
| S1 | `Word` | interface | `types.ts:80` | one word | `raw`, `letters[]`, `glyphs[]`, `skeleton`, `voweled` |
| S2 | `PassageWord` / `Sentence` / `Passage` | interfaces | `passage.ts:60,81,89` | a composition | pre-computed metrics + optional `lex` + optional pools |
| S3 | `Piece` / `Piece[]` | interface | `compose.ts:26` | a composed line | `word`, `root`, `patternId`, random `id` |
| S4 | bare `string` | — | everywhere | a candidate, an address, a destination | nothing |
| S5 | `Reading` | interface | `reader.ts:40` | one utterance about a text | prose + chips + stats + `cost` |

**No two of these can be passed to the same function.** There is no widening
conversion, no common interface, and no identity shared across them. That is
the substrate as found.

### 1.1 What crosses the boundaries, and how

| From | To | Mechanism | Lossy? |
|---|---|---|---|
| raw text → S1 | | `parseWord` (`text.ts:65`) | yes — tashkīl stripped to `marks[]`, variants folded, non-letters dropped |
| S1 → S4 | | `word.letters.join("")`, `word.skeleton`, `project` (`text.ts:126`), `undot` (`timeline.ts:34`) | yes |
| S4 → S1 | | `parseWord` / `wordFromLetters` (`text.ts:112`) | **yes — `wordFromLetters` cannot carry marks**, so `voweled` is always false on the way back |
| raw text → S2 | | `buildPassage` (`passage.ts:136`) via `normalizeForLookup` then `parseWord` per word | yes |
| S2 → S1 | | only by re-parsing `w.norm`; done inline in `operations.ts:243,246,300` | the `lex` fields are dropped |
| S1 → S2 | | **does not exist** | — |
| S3 → S1 | | `parseWord(p.word)` inside `metricsOf` (`compose.ts:50`) | yes |
| S1 → S5 | | the generator list in `reader.ts:80` | S5 is terminal — nothing consumes a `Reading` |

### 1.2 The one closed loop

`S1 → S4 → S1` is the only round trip the code performs, and it is **lossy in
one specific way that matters**: `wordFromLetters` (`text.ts:112`) calls
`parseWord(letters.join(""))`, and a bare letter string has no diacritics, so
`voweled` comes back `false` and `glyphs[].marks` comes back empty.

Every kernel `Transform` rebuilds its output with `wordFromLetters`
(`band1.ts:256,264`, `band3.ts:291,300,157,164`). **Therefore no transform can
ever preserve tashkīl**, and the Layer 11 `pulse` observable — which returns
`null` unless `word.voweled` (`band3.ts:271`) — is structurally unable to be
measured across any transform. Verified `[E9]`:

```
scan(parseWord("كَتَبَ"))                        = "111"
scan(wordFromLetters(parseWord("كَتَبَ").letters)) = null
```

This is a **boundary of the substrate**, not a bug report. Consequence in
`observables-invariants.md` §3 and `architecture-stoppers.md` S-4.

---

## 2. The objects the brief asks about, located

| Object | Exists as | Where | Evidence |
|---|---|---|---|
| **letters** | `string` of length 1, validated against `HIJAI_INDEX` by `isLetter` (`alphabet.ts:347`) | `alphabet.ts:16` | IMPLEMENTED |
| **strings** | `Word.letters: string[]` and bare `string` — both, interchangeably | — | IMPLEMENTED |
| **skeletons** | `Word.skeleton: string`, built by joining `Glyph.skeleton` (`text.ts:106`) | | IMPLEMENTED |
| **slots** | `Glyph.domain: string[]` with `length > 1`; enumerated by `slots()` (`text.ts:129`) | | IMPLEMENTED |
| **candidate sets** | the return of `expand()` — a plain `string[]` plus a `truncated` flag | `text.ts:152` | IMPLEMENTED, **bounded and biased** — §4 |
| **roots** | three incompatible forms: `string[3]` (`patterns.ts`), `string` (`PassageWord.lex.root`), `RootEntry` (`lexdata.ts:15`) | | IMPLEMENTED ×3 |
| **patterns** | `Pattern` with a digit template (`patterns.ts:15`) | | IMPLEMENTED |
| **compositions** | two unrelated kinds: `Passage` (parsed from text) and `Piece[]` (built by function application). Neither converts to the other | `passage.ts:89`, `compose.ts:26` | IMPLEMENTED ×2 |
| **addresses** | four kinds, see §3 | | IMPLEMENTED |
| **weights** | `number` from `weightOf` (`band3.ts:185`); also `PassageWord.weight`, `PieceMetrics.weight` | | IMPLEMENTED |
| **pulses** | `string \| null` from `scan` (`band3.ts:270`) | | IMPLEMENTED, unreachable after any transform |
| **transformations** | `Transform` (6) and `Operation` (13) — see `operations-inventory.md` | | IMPLEMENTED ×2 |
| **intermediate states** | `FilterStep.before/after/removed` inside a `Collapse`, and `Stop.surface` inside a `timeline` | `types.ts:162`, `timeline.ts:22` | IMPLEMENTED, not addressable |
| **final states** | `Terminal` = `determined` \| `corrupt` \| `intended` (`types.ts:176`) | | IMPLEMENTED — but see §5 |

---

## 3. Addresses — four unrelated address spaces

The word "address" is used for four different things, and only one of them is a
state identity.

| Address kind | Type | Source | Addresses what | Is it a state identity? |
|---|---|---|---|---|
| letter address | `number` 1–28 | `hijaiAddress`, `abjadiAddress` (`band1.ts:173,250`) | a letter within an ordering | no |
| articulation address | `number` 0–16 | `ARTICULATION` (`alphabet.ts:279`) → `POINTS` | a letter within the mouth | no |
| teleport address | `string` | `addressOf` (`teleport.ts:40`) | an equivalence class of *words* under one observable | **closest thing that exists** |
| slot address | `number` | `Glyph.index` | a position within a word | no |

`addressOf(channel, word)` is the only function in the repository that maps a
state to a canonical key. It supports five channels — `skeleton`, `weight`,
`profile`, `multiset`, `root` — and returns `string[]` because the `root`
channel is one-to-many (`teleport.ts:46`).

**It is not a state identity.** It is deliberately many-to-one: its purpose is
that many words share one address. There is no function anywhere that answers
"is this the same state as that one" for `Word`, `Passage`, or `Piece`.
`MISSING` — logged in `architecture-gaps.md` G-2.

---

## 4. The candidate space, bounded

`expand(word, cap = 5000)` (`text.ts:152`) is the substrate's only set-valued
operation. Three separate numbers describe it and they are routinely conflated:

| Quantity | Function | File:line | Meaning |
|---|---|---|---|
| `arity` | `arity(word)` | `text.ts:136` | how many positions are open (`domain.length > 1`) |
| `degree` | `degree(word)` | `text.ts:139` | `∏ domain.length` — the **true** cardinality of the candidate space |
| `candidates.length` | `expand(word, cap)` | `text.ts:152` | `min(degree, cap)` — what was **actually enumerated** |

Measured `[E2]`, `[E8]`:

```
word        degree   expand(5000)  truncated
مال              1             1   false
كتب             15            15   false
كهيعص           20            20   false
بين             25            25   false
يديه            50            50   false
نبين           125           125   false
استكتب         150           150   false
تبيين          625           625   false
تبيينيين    78,125         5,000   TRUE
بتثنيبتثني 1,953,125        5,000   TRUE
```

### 4.1 Truncation is prefix-biased, not a sample

`expand` accumulates the product prefix-first and `break`s out of **both** loops
the moment `next.length >= cap` (`text.ts:158-168`). Later positions then extend
only the prefixes already accumulated. The result is the lexicographically
earliest `cap` candidates in domain order — not a uniform sample, not a random
one.

Measured `[E8]` for `تبيينيين` (degree 78,125, cap 5,000):

```
first candidate : بببببببن
last  candidate : بتثيييين
true word تبيينيين present in the set : FALSE
```

Every candidate in the truncated set begins with ب, because ب is the first
member of the tooth class. The true word begins with ت.

### 4.2 Who reads the `truncated` flag

| Call site | Reads `truncated`? |
|---|---|
| `collapse.ts:46` | yes — stored on the `Collapse` |
| `timeline.ts:89` | yes — returned by `futures` |
| `band2.ts:110` | yes — used in a Layer 5 note |
| `reader.ts:192` (L5 expand) | **no** |
| `reader.ts:208` (L6 filter) | **no** |
| `reader.ts:296` (L10 solve) | **no** |
| `Walkthrough.tsx:350` | **no** |
| `collapse.ts:143` (`solveByWeight`) | **no** |

Four of eight call sites discard the one signal that says the enumeration was
incomplete. `IMPLEMENTED` (the flag exists) + `CONTRADICTED` (its absence is
read as exhaustiveness downstream).

---

## 5. Terminal states, and the distinction that is missing

`Terminal` (`types.ts:176`) has three values. The brief asks for four distinct
concepts. Mapping them onto what the code can actually express:

| Concept the brief names | Representable? | How |
|---|---|---|
| **EXHAUSTED** — the space was enumerated completely | **partially** — `Collapse.truncated === false` says it, but nothing consumes that to qualify the terminal | `types.ts:184` |
| **NO RESULT** — enumerated completely, nothing survived | `terminal: "corrupt"` **when `truncated` is false** | `collapse.ts:121` |
| **INVALID** — this candidate is excluded by a rule | `FilterStep.removed[]` — capped at 40 entries (`collapse.ts:73`) | partially |
| **NOT EXPLORED** — never generated, so never judged | **not representable** | — |

The collapse of NOT EXPLORED into NO RESULT is demonstrated, not argued.
Measured `[E8]`:

```
تبيينيين   degree 78,125   initial 5,000 (truncated)   terminal "corrupt"   targetSurvived false
كهيعص      degree 20       initial 20   (complete)     terminal "corrupt"   targetSurvived false
```

Both return `corrupt`. In the first case the true reading was **never
generated**; in the second it was generated and **eliminated**. The type cannot
tell them apart, and `CollapseView.tsx:43` renders both as
*"true reading was filtered out"*.

There is a second, unrelated conflation at the filter level. The **lexical**
filter has an explicit self-ignorance fallback (`collapse.ts:84-91`): if it
would empty the set, it un-runs itself and records
`skipReason: "…the filter would be reporting its own coverage, not the text"`.
The **morphological** filter has no such fallback. Measured `[E2b]`, `[E12]`:

```
كهيعص  morphological 20 → 0   skipped=false   abstractWord alignments: 0
طه     morphological  2 → 0   skipped=false   alignments: 0
حم     morphological  3 → 0   skipped=false   alignments: 0
يس     morphological 10 → 0   skipped=false   alignments: 0
```

So "no template in a 35-entry library aligns" is reported with the same terminal
value as "this text is corrupt" — even though `band4.ts:103` and `reader.ts:332`
both state the correct reading in prose ("outside the library's coverage, or …
not built the way words are built"). The honest statement exists as narrative
and not as computation. `CONTRADICTED`.

---

## 6. Normalisation — three implementations, one concept

| Implementation | File:line | Method | Used by |
|---|---|---|---|
| `fold` + `stripMarks` | `text.ts:25,33` | table lookup (`HAMZA_FOLD`, `variants.ts:15`) + `TASHKIL` set | the kernel |
| `normalizeForLookup` / `spelledVariant` | `passage.ts:34,37` | regex character-class replaces | the passage layer and lexicon lookup |
| `normalize` / `variants` | `scripts/build-lexicon.mjs:48,61` | regex, with explicit unicode escapes | the build that produces `lib/data/*.json` |

`passage.ts:19` states the constraint explicitly: *"must match
`scripts/build-lexicon.mjs` exactly"*. That is a coupling maintained **by
comment**, not by a shared function or a test. The kernel's `fold` is a fourth
variant again: it maps bare hamza `ء` → `ا` (`variants.ts:22`) whereas
`passage.ts:32` deletes any character outside `ء-ي` and keeps `ء` itself.

Consequence for the substrate: **the same written word can produce two different
`letters[]` arrays depending on which door it came through.** No test covers the
agreement of the three. `IMPLEMENTED` ×3, agreement `HYPOTHESIZED`.

---

## 7. Mutation

The kernel is functionally pure: every `Transform` returns a fresh `Word`, every
`Observable.compute` reads only. Three exceptions exist, all outside the kernel:

| Site | What mutates |
|---|---|
| `resolve.ts:100-107` | writes `lex`, `taqlib`, `sameSkeleton`, `sameWeight` onto existing `PassageWord` objects; then `p.stats` is **replaced** at `:302` |
| `teleport.ts:50,70` | module-level `CACHE` accumulates indexes, keyed `${lexicon.name}:${channel}` |
| `lexicon.ts:176,181` | module-level `active` lexicon, swapped by `setLexicon` |
| `resolve.ts:18,44`, `lexdata.ts:50,55` | lazily-built module-level indexes |

`setLexicon` and the teleport cache interact: the cache key includes
`lex.name`, so swapping to a differently-named lexicon invalidates correctly,
but swapping to one with the **same name** returns stale buckets.
`clearIndexCache` (`teleport.ts:104`) exists for this and **has no caller**.
`IMPLEMENTED`, unused.

---

## 8. What a "computational object" is here, stated plainly

Reading the code rather than the vocabulary:

> The system's computational object is **a written word, projected to a skeleton
> that declares per-position domains**. Everything else in the repository is
> either (a) a reading taken off that object, (b) a rewriting of it that returns
> another one, (c) a set generated from its domains, or (d) a composition-level
> container that holds many of them and re-derives (a) for each.

The substrate is `Glyph.domain` — the per-position set of admissible letters,
computed at parse time from `classesFor(position)` (`text.ts:95-97`). Every
candidate space, every degree, every arity, every bit-count and every collapse in
the repository is derived from that one field. It is the single load-bearing
data structure. `IMPLEMENTED`, `text.ts:97`.
