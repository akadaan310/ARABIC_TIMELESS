# Architecture stoppers

**These are not implementation requirements. They are negative guards.**

Each entry is a condition that must **stop** a future implementation pass until
it is explicitly resolved by a person. Nothing here is a bug report and nothing
here was fixed during this pass.

Two kinds appear:

- **S-n — found in this repository**, with evidence. A future pass that builds on
  the named premise inherits a false one.
- **X-n — general guards** from the brief, kept because they apply here.

Reproduction for every `[E…]` tag:
`npx vitest run lib/engine/__tests__/archaeology.diagnostic.test.ts`

---

## S-1 — STOP if a capped enumeration is treated as an exhaustive one

**Severity: highest. This one invalidates downstream conclusions silently.**

`expand(word, cap = 5000)` (`text.ts:152`) returns *the lexicographically
earliest `cap` candidates in domain order*, not a sample. It `break`s out of both
loops at the cap (`text.ts:158-168`), so later positions extend only the prefixes
already accumulated.

Measured `[E8]`, `تبيينيين`, degree 78,125:

```
candidates.length 5,000   truncated true
first  بببببببن     last  بتثيييين
true word in the set: FALSE
```

Every retained candidate begins with ب. The true word begins with ت.

**Stop conditions:**

- any count derived from `expand` is reported without checking `truncated`;
- `degree(word)` and `candidates.length` appear in the same sentence as though
  they were the same quantity;
- a search over a truncated set returns "none" and that is read as "no such
  candidate exists";
- a new caller of `expand` is added that does not read the second return field.

**Known call sites that already discard the flag**: `reader.ts:192`,
`reader.ts:208`, `reader.ts:296`, `collapse.ts:143` (`solveByWeight`),
`Walkthrough.tsx:350`.

---

## S-2 — STOP if NOT EXPLORED is represented with the same value as INVALID

`Terminal` (`types.ts:176`) has exactly three values —
`determined | corrupt | intended` — and none of them means "the space was not
searched".

Measured `[E8]` / `[E12]`:

```
تبيينيين   degree 78,125   initial 5,000 (truncated)   terminal "corrupt"   targetSurvived false
كهيعص      degree     20   initial    20 (complete)    terminal "corrupt"   targetSurvived false
```

The first was never generated; the second was generated and eliminated. The
type cannot express the difference, and `CollapseView.tsx:43` renders both as
*"true reading was filtered out"*.

**Stop conditions:**

- a future frontier, traversal or discovery record reuses `Terminal` as-is;
- `survivors.length === 0` is read as "no candidate satisfies the constraints"
  without checking `truncated`;
- `targetSurvived === false` is reported to a user as a fact about the text.

---

## S-3 — STOP if a filter's coverage limit is reported as a property of the text

The **lexical** filter has an explicit self-ignorance fallback
(`collapse.ts:84-91`): if it would empty the candidate set it un-runs itself and
records *"no candidate is in the seed lexicon — the filter would be reporting its
own coverage, not the text"*.

The **morphological** filter has no equivalent. Measured `[E12]`:

```
word   degree  alignments  morph before→after  skipped  terminal
كهيعص      20           0        20→   0        false   corrupt
طه          2           0         2→   0        false   corrupt
حم          3           0         3→   0        false   corrupt
يس         10           0        10→   0        false   corrupt
```

"Zero of 35 templates align" is reported identically to "this text is corrupt" —
even though `band4.ts:103` and `reader.ts:332` both state the correct disjunction
in prose ("outside the library's coverage, **or** not built the way words are
built").

**Stop conditions:**

- a new filter is added without deciding what it does when it has no data;
- the `skipped`/`skipReason` channel is dropped from any result type;
- a "corrupt" verdict is used as evidence about a text rather than about a
  filter set.

---

## S-4 — STOP if an "invariant" verdict is treated as a demonstrated invariance

`buildInvarianceTable` `break`s on the first differing word
(`invariance.ts:74-86`). Therefore `changes` is an **existence proof** and
`invariant` is a **failure to refute over a specific sample** — the two verdicts
have opposite epistemic strength, and nothing in the code or the UI says so.

Two rows in the current table are artefacts, not invariances:

**(a) `pulse` = `111111`.** Measured `[E9]`:

```
sampleWords() voweled flags        : false ×10
scan(parseWord("كَتَبَ"))            : "111"
scan(wordFromLetters(same letters)) : null
reported pulse row                 : 111111
```

Two independent causes, either sufficient: `sampleWords` (`invariance.ts:41`)
never produces a voweled word, and every transform rebuilds via
`wordFromLetters` (`text.ts:112`), which cannot carry marks. The cell compares
`"∅"` with `"∅"`. The `undefined` verdict exists in the type
(`invariance.ts:21`) but is reachable only from a thrown exception
(`invariance.ts:70`).

**(b) `fixedUnder` invariant under `permute`.** Measured `[E13]`:

```
sampleWords(400): palindromes 3 | unmovable 1 | reading "none" on both: 396
كتك permuted → ككت=false تكك=false تكك=false تكك=false كتك=true ككت=false
```

Permuting a palindrome generally destroys it, so the observable *is* sensitive;
396 of 400 sample words simply read `"none"` before and after.

**(c) `classCount` = `111111` is vacuous** — `compute: () => 15`
(`band1.ts:33`) ignores its argument.

**Stop conditions:**

- an invariance row is cited as a property of the language rather than of the
  sample;
- a new observable is registered whose value is `null`/constant over
  `sampleWords`;
- `Cell.trials` is read as a sample size (for a `changes` cell it is usually 1 —
  `[E11b]`).

---

## S-5 — STOP if a passing test is assumed to have exercised its subject

`compose.test.ts:24` ("does not let one root fill the palette") calls
`suggest(roots, "determined", { pieces: [] }, 20)` and loops over the result
asserting a per-root cap.

Measured `[E6]`: that call returns **0** suggestions, because none of the 35
patterns applied to ك-ت-ب, د-ر-س, ع-ل-م, ح-ك-م or ن-ظ-ر yields a degree-1 word.
The assertion body never executes. The test passes and the cap is untested.

**Stop conditions:**

- the per-root cap in `suggest` (`compose.ts:263,269`) is changed on the
  assumption a test covers it;
- any future assertion loops over a collection without first asserting the
  collection is non-empty.

---

## S-6 — STOP if `invertible: true` is read as "an inverse is available"

All six transforms declare `invertible: true` (`band1.ts:254,263`,
`band3.ts:89,299,155,163`), verified `[E4]`. No inverse function exists
anywhere in `lib/` — grep for `invert` returns only the flag declarations and
the interface field (`types.ts:114`).

For `permute` the inverse is not merely unimplemented but **unrecoverable**: the
permutation drawn from the injected `rng` is not returned with the result
(`band3.ts:157`).

The Layer Contract's condition 4 — *"every operation either inverts, or its loss
is exactly quantifiable"* (`README.md`) — is therefore `DOCUMENTED`, not
`IMPLEMENTED`, at the `Transform` level.

**Stop conditions:**

- a reversible-path or undo mechanism is built on the `invertible` flag;
- `invertible` is used to decide that a step is safe to take.

---

## S-7 — STOP if an authored `preserved`/`lost` string is read as a measurement

`Operation.preserved[]` and `lost[]` (`operations.ts:46,48`) are **human-written
strings**, not computed facts. Compare with the registry side, where invariance
is computed.

Concretely, `silent`'s summary begins *"Every letter replaced…"* while the same
`OpResult` reports `coverage { acted: 2, total: 4 }` `[E10]` — two of four words
were fixed points of the drawn substitution.

`Observable.discards` (`types.ts:101`) has the same character: authored, not
derived.

**Stop conditions:**

- `preserved[]` is consumed as an invariance claim by any future mechanism;
- a capability inventory reports what an operation preserves by reading these
  strings.

---

## S-8 — STOP if "shift preserves the interval sequence" is assumed

Claimed at `operations.ts:399`, `reader.ts:144`, and `spec/03-order.md`. The
registered observable `intervals` has computed row `000000` — reported as
**changing** under `shift1`.

Measured cause `[E11]`: over 200 sample words, 39 differ and **all 39 contain a
letter at hijāʾī address 28**; **0** differ without one.

```
كتب  -19,-1 → -19,-1   unchanged
كتي  -19,25 → -19,-3   changed
```

`shiftLetter` wraps modulo 28 (`band1.ts:186`); `intervals` (`band1.ts:190`)
takes plain integer differences and does not reduce them. The claim is true of
the ring; the observable measures a line.

**Stop conditions:**

- transposition-invariance is used as a channel, a filter or an address without
  first deciding which of the two definitions is meant;
- the discrepancy is "fixed" in either direction without a decision recorded —
  changing `intervals` changes a channel row and therefore the channel grouping.

---

## S-9 — STOP if the three normalisations are assumed to agree

Three independent implementations of one fold exist:

| Implementation | File:line | Method |
|---|---|---|
| `fold` + `stripMarks` | `text.ts:25,33` | table lookup + `TASHKIL` set |
| `normalizeForLookup` | `passage.ts:34` | regex character classes |
| `normalize` | `scripts/build-lexicon.mjs:48` | regex with unicode escapes |

`passage.ts:19` states the coupling as a **comment**: *"must match
`scripts/build-lexicon.mjs` exactly"*. No shared function, no test.

They already differ in at least one case: `variants.ts:22` maps bare hamza
`ء → ا`, while `passage.ts:32` strips everything outside `ء-ي` and keeps `ء`.

**Stop conditions:**

- a state identity or address is derived from "the normalised form" without
  specifying which of the three;
- the lexicon bundles are rebuilt without re-checking agreement;
- text enters the engine through a new door.

---

## S-10 — STOP if the collapse pipeline is assumed to iterate

`spec/06-collapse.md` and `band2.ts:135` both say *"apply in order and iterate to
a fixed point"*. The implementation runs each filter **exactly once**, in a
straight line (`collapse.ts:78-118`). There is no loop and no fixed-point test.

**Stop condition:** any claim about convergence, stability or fixed points of the
reading procedure that cites the existing implementation.

---

## S-11 — STOP if `HandCost` is assumed to drive anything

Every observable and transform computes a `HandCost` (`types.ts:107,117`) and
`analyzeWith` (`helpers.ts:18`) sums them. **Nothing reads a cost to make a
decision.** The seven-filter ordering is the literal sequence of `run(...)` calls
with hand-written `rank` values (`collapse.ts:78-118`), not derived from the
costs computed in the same file.

**Stop condition:** a future ordering, ranking or budget presented as "the
existing cost model", when the existing cost model is display-only.

---

## S-12 — STOP if `Piece.id` is used as an identity

`compose.ts:68` builds it as
`` `${root}:${patternId}:${Math.random().toString(36).slice(2,7)}` ``. It is a
React list key. Two structurally identical pieces get different ids; the same
piece gets a different id on every rebuild.

**Stop condition:** any deduplication, memoisation, caching or provenance keyed
on `Piece.id`.

---

## S-13 — STOP if the lexicon is treated as part of a result

`getLexicon()` (`lexicon.ts:178`) reads a module-level mutable global
(`lexicon.ts:176`), swappable by `setLexicon`. `collapse()` depends on it and
**does not record which lexicon it used**. The same `collapse(parseWord("كتب"))`
returns different survivors under a different lexicon, with nothing on the result
to say so.

Related: the teleport cache is keyed `${lex.name}:${channel}`
(`teleport.ts:55`), so swapping to a lexicon with the **same name** serves stale
buckets, and `clearIndexCache` (`teleport.ts:104`) has no caller.

**Stop conditions:**

- a `Collapse` is compared against another without establishing both used the
  same lexicon;
- a result is cached, persisted or cited across a `setLexicon` call.

---

## General guards, retained

| # | Guard |
|---|---|
| X-1 | STOP if a proposed operation has no existing implementation. |
| X-2 | STOP if a proposed rule cannot be traced to an existing mechanism by file and line. |
| X-3 | STOP if "discovery" depends on semantic interpretation rather than computation. In this repository the boundary is sharp and already drawn: the kernel operations (skeleton, weight, profile, openness, symmetry) need no lexicon, and every lexicon-dependent operation reports `unresolved` with a reason rather than guessing (`operations.ts:87`, `[E10]`). |
| X-4 | STOP if a candidate relationship cannot be reproduced — no seed, no `(text, n)`, no recorded parameters. |
| X-5 | STOP if a traversal has no declared bound. Note that a declared bound is not enough here: S-1 is a case where the bound was declared and the result was still reported as exhaustive. |
| X-6 | STOP if no distinction exists between untested and invalid. → S-2. |
| X-7 | STOP if provenance cannot reconstruct the result. See `architecture-experimental-results.md` §P: of five audited result types, two reconstruct, one partially, two do not. |
| X-8 | STOP if an apparent invariant has not actually been tested. → S-4. |
| X-9 | STOP if a number is treated as meaningful merely because it is numerically interesting. The repository is disciplined here — every constant in `constants()` (`band5.ts:187`) carries a `method` field naming how it was derived, and all thirteen are asserted at `engine.test.ts:255`. Preserve that. |
| X-10 | STOP if an operation is being invented because it produces a desired result. |
| X-11 | STOP if an architectural abstraction is being introduced only because it sounds elegant. |
| X-12 | STOP if a name from the conceptual vocabulary is attached to existing code that does not behave that way. Look for the behaviour first; the repository already contains discrimination and edges under other names, and does not contain traversal under any name. |

---

## Priority order

If a future pass can only respect some of these, this is the order the evidence
supports:

1. **S-1 / S-2** — a bound reported as a result, and unexplored reported as
   invalid. Everything built on candidate sets inherits these.
2. **S-4** — invariance verdicts, because the channel structure is the
   repository's central architectural claim and two rows of it are artefacts.
3. **S-3** — filter coverage reported as text corruption.
4. **S-13 / S-9** — hidden global inputs (lexicon, normalisation) that no result
   records.
5. Everything else.
