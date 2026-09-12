# Observables and invariants

**An observable is something measured. An invariant is something demonstrated to
remain unchanged under a declared transformation.** This document keeps them
apart, and marks every case where the repository's prose treats a measurement as
a demonstration.

Reproduction: `npx vitest run lib/engine/__tests__/archaeology.diagnostic.test.ts`

---

## 1. The registered observables — 25

All 25 are declared on a `Layer` and collected by `registry.ts:40`. Every one
has `compute`, `serialize`, `display`, `cost` and a `discards` string
(`types.ts:96`). The `discards` field is unusual and worth naming: **every
observable in this repository states its own loss**.

| id | Layer | File:line | Input | Output type | Domain | Deterministic | `discards` |
|---|---|---|---|---|---|---|---|
| `classCount` | 0 | `band1.ts:29` | `Word` (ignored) | `number` | constant `15` | yes | which letters fall in which class |
| `strokeCount` | 1 | `band1.ts:67` | `Word` | `number` | ℕ | yes | which strokes |
| `liftCount` | 1 | `band1.ts:77` | `Word` | `number` | = letter count (`MOTION[l].lifts` is 1 for all 28) | yes | where the hand lifted |
| `dotCount` | 1 | `band1.ts:87` | `Word` | `number` | 0–3 per letter | yes | which letters carry the dots |
| `valence` | 2 | `band1.ts:137` | `Word` | `number[]` | each ∈ {1,2} | yes | the shape |
| `faces` | 2 | `band1.ts:147` | `Word` | `string[]` | each ∈ 4 positions | yes | nothing — the map is total |
| `hijaiAddresses` | 3 | `band1.ts:229` | `Word` | `number[]` | each 1–28 | yes | nothing — a bijection |
| `intervals` | 3 | `band1.ts:240` | `Word` | `number[]` | each −27…+27 | yes | one letter's worth |
| `skeleton` | 4 | `band2.ts:24` | `Word` | `string` | rasm strings | yes | every i'jām distinction |
| `arity` | 4 | `band2.ts:34` | `Word` | `number` | 0…len | yes | which positions are open |
| `degree` | 4 | `band2.ts:44` | `Word` | `number` | ∏ domain sizes | yes | which bindings |
| `cardinality` | 5 | `band2.ts:91` | `Word` | `number` | = `degree` | yes | which candidates |
| `profile` | 7 | `band2.ts:151` | `Word` | `number[]` | run lengths | yes | every distinction among open letters |
| `chunkCount` | 7 | `band2.ts:163` | `Word` | `number` | = `profile.length` | yes | the run lengths |
| `multiset` | 9 | `band3.ts:140` | `Word` | `string` (sorted) | — | yes | order |
| `weight` | 10 | `band3.ts:201` | `Word` | `number` | Σ abjad, 1…1000 per letter | yes | order |
| `reduction` | 10 | `band3.ts:213` | `Word` | `number` | 1–9 | yes | all but the digit sum |
| `pulse` | 11 | `band3.ts:97` | `Word` | `string \| null` | binary strings, or `null` | yes | every letter |
| `residue` | 12 | `band4.ts:43` | `Word` | `string` | letters minus ا و ي | yes | the long vowels |
| `alignments` | 13 | `band4.ts:87` | `Word` | `number` | 0–35 | yes | which patterns |
| `fixedUnder` | 15 | `band4.ts:155` | `Word` | `string` | a label list, or `"none"` | yes | nothing — a test, not a projection |
| `expansionMarks` | 16 | `band5.ts:33` | `Word` | `number` | `degree × length` | yes | nothing — a measurement |
| `path` | 17 | `band5.ts:74` | `Word` | `number[]` | each 0–16 | yes | everything about the written letter |
| `bitsWithheld` | 18 | `band5.ts:109` | `Word` | `number` | `log₂ degree` | yes | which bindings |
| `length` | 20 | `band5.ts:216` | `Word` | `number` | ℕ | yes | everything but the count |

### 1.1 Redundancy inside the registry

Four pairs compute the same quantity under two names:

| | |
|---|---|
| `degree` (L4) and `cardinality` (L5) | both `degree(w)` — `band2.ts:46` and `band2.ts:95` |
| `liftCount` (L1) and `length` (L20) | every letter has `lifts: 1` (`alphabet.ts:204-231`), so `liftCount === letters.length` |
| `bitsWithheld` (L18) | `log₂(degree)` — a monotone reparameterisation of `degree` |
| `chunkCount` (L7) | `profile.length` — a projection of `profile` |

The invariance table sorts three of these four into the same channel
automatically (§2.2), which is exactly what `invariance.ts:118` `channels()` is
for. `IMPLEMENTED`, and it works.

### 1.2 Observables outside the registry

Computed and displayed, but invisible to Layer 14:

| Name | File:line | Scope |
|---|---|---|
| `PassageStats` (`words`, `letters`, `sentences`, `resolved`, `roots`, `bits`, `weight`, `determined`) | `passage.ts:175` | passage |
| `PieceMetrics` (`skeleton`, `weight`, `degree`, `arity`, `profile`, `unmoved`) | `compose.ts:49` | composed word |
| `CompositionStats` (adds `roots`, `allUnmoved`) | `compose.ts:109` | composed line |
| `overview()` (`jointDegree`, `bits`) | `reader.ts:575` | text |
| `marksSpent()` (`ijam`, `tashkil`) | `timeline.ts:94` | word |
| `Jump.scanCost` / `indexCost` | `teleport.ts:80` | a lookup |
| `HandCost` on every observable and transform | `types.ts:24` | any |

`marksSpent` is notable: it is the only observable that measures the **written
surface** against the skeleton (`timeline.ts:101` counts glyphs whose skeleton
differs from the letter). Nothing else in the repository measures marking
directly. `IMPLEMENTED`.

---

## 2. The invariance table — the one place invariance is *demonstrated*

`buildInvarianceTable` (`invariance.ts:52`) computes `observables() ×
transforms()` = **25 × 6 = 150 cells**, verified `[E4]`.

### 2.1 What a cell actually means

For each `(observable, transform)` pair it walks the sample and, for each word,
compares `o.serialize(o.compute(w))` against
`o.serialize(o.compute(t.apply(w, rng)))`. It **`break`s on the first
difference** (`invariance.ts:74-86`).

Therefore:

- `verdict: "changes"` means **∃ one witness** in the sample. It is a genuine
  existence proof and it is sound.
- `verdict: "invariant"` means **∄ a witness in this sample**. It is *not* a
  proof; it is a failure to refute over 400 pseudo-random words of length 3–7
  drawn with `mulberry32(7)` (`invariance.ts:41`).
- `Cell.trials` counts words tried **before the break**, so for a `changes` cell
  it is usually `1`. It is a counter, not a sample size. Measured `[E11b]`:
  `intervals × shift1 → {verdict:"changes", trials:1}`.

This is the correct asymmetry for a refutation-based test and the code is honest
about it. What is *not* stated anywhere is that "invariant" is the weaker of the
two verdicts. `IMPLEMENTED`, with the epistemic status recorded here.

### 2.2 The computed table, in full

Columns, in registry order: `reflect`(L3) · `shift1`(L3) · `silent`(L8) ·
`shift3`(L8) · `permute`(L9) · `reverse`(L9). `1` = invariant, `0` = changes.
Measured `[E4]`, identical across two independent builds.

```
observable        layer   row
classCount          0     111111
strokeCount         1     001011
liftCount           1     111111
dotCount            1     000011
valence             2     001000
faces               2     001000
hijaiAddresses      3     000000
intervals           3     000000
skeleton            4     001000
arity               4     001000
degree              4     001000
cardinality         5     001000
profile             7     001000
chunkCount          7     001000
multiset            9     000011
weight             10     000011
reduction          10     000011
pulse              11     111111
residue            12     000000
alignments         13     000000
fixedUnder         15     001011
expansionMarks     16     001000
path               17     000000
bitsWithheld       18     001000
length             20     111111
```

**Five distinct channels** are found by `channels()` `[E4]`:

| Signature | Observables | Reading |
|---|---|---|
| `001000` | valence, faces, skeleton, arity, degree, cardinality, profile, chunkCount, expansionMarks, bitsWithheld | the **shape channel** — survives silent substitution only |
| `000011` | dotCount, multiset, weight, reduction | the **arithmetic channel** — survives reordering only |
| `000000` | hijaiAddresses, intervals, residue, alignments, path | **fragile** — survives nothing tested |
| `111111` | classCount, liftCount, pulse, length | **trivial or degenerate** — see §3 |
| `001011` | strokeCount, fixedUnder | a **mixed** channel |

The two large channels are exact complements on the columns that matter
(`silent` vs `permute`/`reverse`). That is the repository's central architectural
claim and **the computation supports it**. `IMPLEMENTED`.

### 2.3 The novelty detector

`isNewChannel(table, candidate, sample)` (`invariance.ts:134`) computes a
candidate observable's row and reports whether any registered observable already
has it. Run on a probe observable "first letter" `[E4b]`:

```
{ "novel": false, "signature": "000000",
  "matches": ["hijaiAddresses","intervals","residue","alignments","path"] }
```

Correct: the first letter changes under every transform tested, so it lands in
the fragile channel and adds nothing. **This is a working, executable
discovery test.** `IMPLEMENTED`.

---

## 3. Invariants: which rows are demonstrations and which are artefacts

This is the section the brief's warning is about. Applying the rule *"do not
infer invariance merely because a property appears conceptually related"* to the
`111111` and other suspicious rows:

| Row | Observable | Is it a demonstrated invariant? | Why |
|---|---|---|---|
| `111111` | `length` | **yes** | all six transforms are length-preserving by construction; `permute`/`reverse` reorder, `reflect`/`shift`/`silent` are per-letter maps |
| `111111` | `liftCount` | **yes, but trivially** — it is `length` under another name (§1.1) |
| `111111` | `classCount` | **no — vacuous.** `compute: () => Object.keys(CLASSES_MEDIAL).length` (`band1.ts:33`) ignores the word entirely. A constant function is invariant under everything, including transformations not yet written |
| `111111` | `pulse` | **no — artefact.** See §3.1 |
| `001000` | `skeleton`, `profile` | **yes** — and independently asserted at `engine.test.ts:116` over 40 seeds × 5 words, and explained by a proved structural theorem (`closedIsUnionOfClasses`, `band2.ts:193`, asserted `engine.test.ts:184`) |
| `000011` | `weight`, `multiset` | **yes** — a sum and a sorted multiset cannot see order; asserted `engine.test.ts:188` |
| `000011` | `dotCount` | **yes**, for the same reason as `weight`: it is a per-letter sum |
| `001011` | `strokeCount` | **yes** — a per-letter sum (order-blind) that `silent` preserves because substitution stays within a universal shape class, and every universal class shares one stroke decomposition in `MOTION` (`alphabet.ts:204-231`) |
| `001011` | `fixedUnder` | **no — near-miss artefact.** See §3.3 |

### 3.1 The `pulse` row is an artefact, not an invariance

`scan` (`band3.ts:270`) returns `null` unless `word.voweled`. Its `serialize`
maps `null → "∅"` (`band3.ts:301`).

Measured `[E9]`:

```
sampleWords() voweled flags        : false,false,false,false,false,false,false,false,false,false
scan() over the first five         : null | null | null | null | null
scan(parseWord("كَتَبَ"))            : "111"
scan(wordFromLetters(same letters)) : null
reported pulse row                 : 111111
```

Two independent causes, either of which alone is sufficient:

1. **`sampleWords` never produces a voweled word.** It builds words from bare
   `HIJAI` letters (`invariance.ts:45-47`), so `voweled` is always `false`.
2. **No transform could preserve marks even if it did.** Every transform rebuilds
   via `wordFromLetters` (`text.ts:112`), which re-parses a bare letter string —
   see `state-substrate-model.md` §1.2.

So the cell compares `"∅"` with `"∅"` and reports `invariant`. The table is
literally correct — the reading did not change — and architecturally misleading:
nothing about the pulse channel has been demonstrated.

`CONTRADICTED`. The `undefined` verdict already exists in the type
(`invariance.ts:21`) and is only reachable via a thrown exception
(`invariance.ts:70`); an observable returning "unavailable" does not reach it.
**Not fixed here** — logged as `architecture-stoppers.md` S-4.

### 3.2 The interval row is correct but is not what the prose claims

Measured `[E11]`: 39 of 200 sample words change their interval sequence under
`shift1`, and **all 39 contain a letter at hijāʾī address 28**; **0** change
without one.

```
كتب  -19,-1 → -19,-1    unchanged
كتي  -19,25 → -19,-3    changed
```

`shiftLetter` wraps modulo 28 (`band1.ts:186`); `intervals` (`band1.ts:190`)
takes plain integer differences and does not. Transposition-invariance holds on
the ring and the implemented observable does not measure the ring. Details and
the affected prose sites: `operations-inventory.md` §4.1.

### 3.3 `fixedUnder` under permutation is a sample artefact

`fixedUnder` (`band4.ts:155`) reports `"reversal"` for palindromes and
`"silent substitution"` for words drawn only from the unmoved six, else
`"none"`. Permuting a palindrome generally destroys the palindrome, so the
observable **is** sensitive to `permute` — yet the table reports it invariant.

Measured `[E13]`:

```
sampleWords(400): palindromes 3 | unmovable 1 | reading "none" on both: 396
كتك is a palindrome; permuting it: ككت=false تكك=false تكك=false تكك=false كتك=true ككت=false
```

396 of 400 sample words read `"none"` both before and after any transform, so
the comparison is `"none" === "none"` almost every time. With three palindromes
in the sample and one `rng` draw each, no witness happened to be found.

This is a weaker failure than `pulse` (§3.1) — the channel *is* measurable, the
sample is simply too thin for a rare property — but it has the same shape:
**`invariant` here means "not refuted", and the sample was not designed to
refute it.** `CONTRADICTED` as an invariance claim; `IMPLEMENTED` as a
measurement. Not fixed here.

---

---

## 4. Invariants asserted elsewhere, and their status

| Claim | Where asserted | Executable check | Status |
|---|---|---|---|
| silent substitution fixes the skeleton in every position | `spec/08`, `band3.ts:36` | `engine.test.ts:116`, 40 seeds × 5 words; and `[E10]` at passage scope on a 4-word line | **IMPLEMENTED, demonstrated** |
| the profile survives every silent substitution | `spec/14 §14.2` | `closedIsUnionOfClasses()` returns `true` (`band2.ts:193`), asserted `engine.test.ts:184`; plus the computed `profile` row `001000` | **IMPLEMENTED, demonstrated and proved** |
| weight is invariant under permutation | `spec/10`, `band3.ts:30` | computed row + `engine.test.ts:188`; and `[E10]` at passage scope (427 → 427 under `reverse`) | **IMPLEMENTED, demonstrated** |
| reflection is an involution with no fixed points | `spec/03` | `engine.test.ts:52` over all 28 letters | **IMPLEMENTED, proved exhaustively** |
| application and abstraction are inverse | `spec/13 §13.2` | `engine.test.ts:173` for 4 patterns × 1 root | **IMPLEMENTED, demonstrated on a sample** |
| the abjadī↔hijāʾī permutation has order 105, fixing only ا and ب | `spec/03`, `band1.ts:197` | `engine.test.ts:45` | **IMPLEMENTED, computed exhaustively** |
| the silent subgroup has order 4,608; the medial-only one 92,160 | `spec/08`, `band3.ts:30,243` | `engine.test.ts:93,99` | **IMPLEMENTED, computed** |
| the eight feet fall into 3 rotation orbits | `spec/11`, `band3.ts:252` | `engine.test.ts:148` | **IMPLEMENTED, computed exhaustively** |
| the triliteral root space is 19,656 ordered / 3,276 orbits | `spec/09`, `band3.ts:127` | `engine.test.ts:129` | **IMPLEMENTED, closed form** |
| length is invariant under every transformation in the architecture | `band5.ts:229` | the computed `length` row `111111` | **IMPLEMENTED over the six registered transforms**; the phrase "in the architecture" is broader than what is tested |
| "every operation either inverts, or its loss is exactly quantifiable" (Layer Contract 4) | `README.md` | none — no inverse is implemented for any `Transform` | **DOCUMENTED only** |
| the interval sequence survives a shift | `operations.ts:399`, `reader.ts:144`, `spec/03` | computed row `000000` | **CONTRADICTED as stated** — §3.2 |
| the pulse channel is independent of every other | `band3.ts:317`, `reader.ts:~530` | the computed row is an artefact | **HYPOTHESIZED** — untestable with the current substrate |

---

## 5. `spec/14 §14.1`'s documented table, verified

The specification tabulates five observables against four transformations. Each
is checked against the computed table `[E4]`:

| Observable | spec: silent | spec: reflection | spec: permutation | spec: reversal | computed row | agrees? |
|---|---|---|---|---|---|---|
| Skeleton (L4) | invariant | changes | changes | changes | `001000` | **yes** |
| Profile (L7) | invariant | changes | changes | changes | `001000` | **yes** |
| Weight (L10) | changes | changes | invariant | invariant | `000011` | **yes** |
| Letter multiset (L9) | changes | changes | invariant | invariant | `000011` | **yes** |
| Length | invariant | invariant | invariant | invariant | `111111` | **yes** |

**All five documented rows are reproduced by the engine.** `DOCUMENTED` → moved
to `IMPLEMENTED`, verified. This is the one place in the repository where the
document and the code were checked against each other and agreed completely.

---

## 6. Cost as an observable of observables

Every `Observable` and every `Transform` carries a `cost(word) → HandCost`
(`types.ts:107,117`), and `analyzeWith` (`helpers.ts:18`) sums them per layer.
`addCost` (`types.ts:37`) sums `marks` and `counts` but takes the **maximum** of
`held` — a working-memory bound, not an accumulation.

This is a second, parallel cross-product: every reading in the system is priced.
It is `IMPLEMENTED`, it is displayed (`components/ui.tsx` `Cost`,
`CollapseView.tsx:34`), and **nothing consumes it** — no filter ordering, no
suggestion ranking, no traversal reads a `HandCost` to make a decision. The
ordering of the seven collapse filters is hardcoded as the literal sequence of
`run(...)` calls with hand-written `rank` values (`collapse.ts:78-118`), not
derived from the costs the same file computes.

`IMPLEMENTED` as a measurement; `MISSING` as a control input.
