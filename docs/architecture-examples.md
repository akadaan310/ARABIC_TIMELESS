# Architecture examples — six existing computations traced end to end

Every example below is an **existing** computation on **existing** input. No
example was manufactured for this document; each uses inputs already present in
`lib/engine/examples.ts`, `lib/engine/corpus.ts`, or the existing test suite.

Two of the six are **negative examples** — they fail to demonstrate the property
they appear to demonstrate, and that failure is the finding.

Reproduction: `npx vitest run lib/engine/__tests__/archaeology.diagnostic.test.ts`

---

## §1 — `كتب` through weight: a transformation, a candidate space, a constraint

**Demonstrates: A, B, C** (a transformation, a candidate space, a constraint).
Source of the input: `examples.ts:30` (`kataba`, "Three letters, fifteen
readings, and weight alone cuts it to two"). Asserted at `engine.test.ts:140`.

```
INPUT
  كتب                                      parseWord (text.ts:65)
  → Word { letters: [ك,ت,ب]
           glyphs[0].domain = [ك]          singleton — ك is alone in its class
           glyphs[1].domain = [ب,ت,ث,ن,ي]  medial tooth
           glyphs[2].domain = [ب,ت,ث]      final tooth: ن and ي leave it
           skeleton: "كٮٮ"
           voweled: false }
  arity 2, degree 1 × 5 × 3 = 15

EXISTING MECHANISM
  expand(word, 5000)                       text.ts:152

INTERMEDIATE STATE
  15 candidates, truncated = false          ← complete, degree == length

OBSERVATION
  weightOf([ك,ت,ب]) = 20 + 400 + 2 = 422    band3.ts:185

DECISION / FILTER
  solveByWeight(word, 422)                  collapse.ts:142
  predicate: Σ ABJAD_VALUE(c) === 422

OUTPUT
  { كبت, كتب }   — 2 of 15
  the true reading is in the survivor set
```

Measured `[E1]`. Everything in this trace is existing machinery; the only thing
this document contributed was calling three exported functions in sequence.

**Why this one is architecturally load-bearing.** The two survivors are
anagrams. Weight cannot separate them — it is invariant under permutation
(`observables-invariants.md` §2.2, row `000011`) — and the skeleton cannot
either, since both are written `كٮٮ`. Separating them needs a third channel.
That is the complementarity claim of `spec/14 §14.1`, appearing as an actual
residue rather than as a table.

---

## §2 — `كتب` through `collapse()`: the full pipeline with its audit

**Demonstrates: C, F** (a constraint, and a terminal state).

```
INPUT      Word("كتب"), lexicon "seed" (lexicon.ts:170)
MECHANISM  collapse(word)                   collapse.ts:42

INTERMEDIATE STATES — each filter's own record
  rank  filter          before → after   note
   1    lexical            15  →   1     removed 14, all recorded
   2    segmental           1  →   1     profile (3) must match
   3    morphological       1  →   1     abstractWord(c).length > 0
   4    prosodic            1  →   1     SKIPPED — "the input carries no tashkīl…"
   5    syntactic           1  →   1     SKIPPED — "needs the surrounding words"
   6    semantic            1  →   1     SKIPPED — "needs the surrounding text"
   7    intentional         1  →   1     SKIPPED — "needs a model of the writer"

OBSERVATION
  totalCost { marks: 0, counts: 18, held: 4 }

OUTPUT
  survivors      [كتب]
  terminal       "determined"              types.ts:176
  targetSurvived true                      ← the procedure checks itself
```

Measured `[E1b]`. Asserted at `engine.test.ts:226,234,241,248`.

**What makes it auditable rather than a verdict.** Three properties, all
present: the ground truth is carried on the result and tested (`target`,
`targetSurvived`); each filter records its own before/after and what it removed;
and a filter with no data reports *skipped with a reason* rather than passing
everything through silently.

---

## §3 — `العلم نور والجهل ظلام` under silent substitution: an invariant

**Demonstrates: D** (an invariant, demonstrated rather than asserted).
Input from `corpus.ts:168` (`ilm`, "Knowledge is light").

```
INPUT       العلم نور والجهل ظلام
            buildPassage (passage.ts:136) — no lexicon needed
MECHANISM   OP_BY_ID.silent.apply(passage)  operations.ts:226
            draws a permutation of each CLASSES_UNIVERSAL class with
            mulberry32(0x5eed) — a fixed seed, so the draw is reproducible

INTERMEDIATE
            letter map applied to every letter of every word

OBSERVATION skeleton of the passage, before and after
            before:  العلم ٮور والحهل طلام
            after :  العلم ٮور والحهل طلام

DECISION    identical? → yes, byte for byte

OUTPUT      الغلم نور والحهل ظلام
            preserved: the skeleton, the segment profile, word lengths
            lost:      every word's identity, the weight
            coverage:  { acted: 2, total: 4 }
```

Measured `[E10]`. The kernel-level version of the same invariant is asserted
over 40 seeds × 5 words at `engine.test.ts:116`, and explained by a **proved**
structural theorem: `closedIsUnionOfClasses()` (`band2.ts:193`) returns `true`,
so a within-class permutation can never move a letter between open and closed,
so the profile survives too (`spec/14 §14.2`, asserted `engine.test.ts:184`).

This is the strongest example in the repository: an invariance that is
**computed** (the table row `001000`), **tested** (40 seeds), **proved**
(the union theorem), and **demonstrated at two scopes** (word and passage).

**One discrepancy, recorded.** The result's own summary opens *"Every letter
replaced…"* while `coverage` reports 2 of 4 words changed — two words were fixed
points of the drawn substitution. Prose and computation disagree by a little.
See `architecture-stoppers.md` S-7.

---

## §4 — `isNewChannel` on a candidate observable: discrimination with evidence

**Demonstrates: B, C** (a candidate space and a constraint), at the meta level.

```
INPUT       an Observable NOT in the registry:
              id "firstLetter", compute: w => w.letters[0]
            + the built invariance table (25 × 6 = 150 cells)
            + sampleWords(150)

MECHANISM   isNewChannel(table, candidate, sample)   invariance.ts:134

INTERMEDIATE
            for each of the 6 transforms, compare the candidate's reading
            before and after over the sample; emit "1" (never differed),
            "0" (differed), or "?" (threw)

OBSERVATION signature "000000"

DECISION    is any registered observable's rowSignature equal to it?

OUTPUT      { novel: false,
              signature: "000000",
              matches: ["hijaiAddresses","intervals","residue","alignments","path"] }
```

Measured `[E4b]`. The verdict is correct: the first letter of a word is
destroyed by all six transforms, so it occupies the fragile channel and adds no
distinction the registry does not already have.

**This is the repository's only mechanism that returns evidence rather than a
boolean.** `matches` names the observables that already cover the candidate. It
is the direct answer to the Furqān question — see
`architecture-experimental-results.md` §F.

---

## §5 — NEGATIVE EXAMPLE: teleport does not compose into a walk

**Intended to demonstrate: E** (a composition of operations). **It does not.**

```
STATE A     parseWord("كتب")

MECHANISM   allExits(A)                     teleport.ts:98
OBSERVED    profile@"3" → 47 destinations
            root@"كتب"  →  5 destinations
            (skeleton, weight and multiset channels: 0 destinations
             for this word against the seed lexicon)

STEP 1      كتب --profile--> علم

STATE B     parseWord("علم")     ← re-parse required; NOT returned by teleport

MECHANISM   allExits(B)
STEP 2      علم --weight--> سليم
```

Measured `[E3]`. Two steps were taken, so *something* traversal-shaped is
reachable. Four specific things make it fall short, each verifiable:

1. **The types do not close.** `teleport(word: Word) → Jump[]`, and
   `Jump.destinations` is `string[]` (`teleport.ts:74-82`). Step 2 required an
   out-of-band `parseWord`. The engine does not perform it; this document did.
2. **No path object.** Nothing accumulates `[كتب, علم, سليم]`. Each `teleport`
   call is independent and stateless apart from the module cache.
3. **No visited set, so no termination.** `علم --weight--> سليم --weight--> علم`
   is not prevented, detected, or noticed.
4. **Cost does not accumulate.** `Jump.scanCost`/`indexCost` (`teleport.ts:80`)
   price one hop. Nothing sums them.

The only place two steps are actually taken in the running application is
`Workspace.tsx:152` — `onJump={(d) => setText(d)}` — where the loop is closed by
a React `setState`, not by the engine. **The traversal lives in the UI, not in
the architecture.**

This negative example is more useful than a positive one would have been: it
establishes that the *edges* exist (`Jump` is a real, priced, many-to-one edge
over five address spaces) and the *walk* does not.

---

## §6 — NEGATIVE EXAMPLE: `تبيينيين` shows a bound reported as a result

**Intended to demonstrate: G** (an existing exhaustive computation). **It
demonstrates the opposite**, and this is the single most consequential finding
of the pass.

`تبيينيين` is a tooth-dense word of the kind `corpus.ts:62` (`teeth`, "Nothing
but teeth") was built to exercise.

```
INPUT       تبيينيين                        8 letters, every one a tooth-class member
            degree = 5 × 5 × 5 × 5 × 5 × 5 × 5 × 1 = 78,125

MECHANISM   expand(word, cap = 5000)         text.ts:152

INTERMEDIATE STATE — and here it goes wrong
            candidates.length = 5,000
            truncated         = true
            first candidate   = بببببببن
            last  candidate   = بتثيييين
            true word present = FALSE

  expand accumulates the product prefix-first and `break`s out of BOTH loops
  once next.length >= cap (text.ts:158-168). The retained set is therefore the
  lexicographically-earliest 5,000 candidates in domain order — every one of
  them beginning with ب, the first member of the tooth class. تبيينيين begins
  with ت. It was never generated.

OBSERVATION collapse(word)                   collapse.ts:42
            initial 5,000, degree 78,125, truncated true

DECISION    the filters run over the biased 5,000

OUTPUT      survivors      0
            terminal       "corrupt"
            targetSurvived false
```

Measured `[E8]`. Compare the honest case from the same diagnostic `[E12]`:

```
كهيعص      degree 20, initial 20 (complete)    → terminal "corrupt", targetSurvived false
تبيينيين   degree 78,125, initial 5,000 (cut)  → terminal "corrupt", targetSurvived false
```

**Identical terminals for opposite situations.** In the first the candidate was
generated and eliminated; in the second it was never generated. `CollapseView`
renders both as *"true reading was filtered out"* (`CollapseView.tsx:43`).

### The same bound reaching the user as a false sentence

`reader.ts:292-300` (the Layer 10 "solve" generator) computes `d = degree(word)`
but filters over `expand(word, 3000)`, then narrates the difference. Measured
`[E8b]` for this same word:

```
title: "weight alone cuts 78,125 to 0"
body : "Tell a reader nothing but the total — 542 — and arithmetic removes 78125
        of the 78,125 candidates in one pass … What survives: ."
```

Nothing was cut to zero. 3,000 prefix-biased candidates were tested, none of
which happened to weigh 542. The sentence is false, it is user-facing, and it is
produced by mixing a true cardinality with a capped enumeration.

**This is not fixed here.** It is the first entry in
`architecture-stoppers.md`.

---

## What the six examples establish

| Property | Example | Result |
|---|---|---|
| A — a transformation | §1, §3 | **demonstrated** |
| B — a candidate space | §1, §4 | **demonstrated**, bounded, and biased above the bound (§6) |
| C — a constraint | §1, §2, §4 | **demonstrated**, in three unrelated forms |
| D — an invariant | §3 | **demonstrated** — computed, tested, proved, at two scopes |
| E — a composition of operations | §5 | **not demonstrated** — edges exist, the walk does not |
| F — a terminal/fixed state | §2 | **demonstrated** — three named terminals, plus `fixedUnder` at `band4.ts:155` |
| G — an exhaustive computation | §6 | **not demonstrated** for `expand`. It *is* demonstrated elsewhere: `taqlibOf` over S₃ (`resolve.ts:50`), `orderPermutation` over 28 letters (`band1.ts:197`), `footOrbits` over 8 feet (`band3.ts:252`), `closedIsUnionOfClasses` (`band2.ts:193`) |

Four of seven properties are demonstrated cleanly. One (G) is demonstrated in
four small closed spaces and fails in the one large open space that the whole
candidate architecture rests on. One (E) is absent.
