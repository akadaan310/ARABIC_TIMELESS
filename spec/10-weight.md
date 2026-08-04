# Layer 10 — Weight (الوزن العددي)

> **Band III — Transformation.**

## Core statement

**Every string carries a number; every number carries back to strings.**

Layer 3 gave each letter a position. This layer gives each letter a **magnitude**,
and a string its sum. The map runs in both directions, and the backward direction
is the one that does work.

---

## 10.1 The values

The abjad order assigns magnitudes in four registers:

| | | |
|---|---|---|
| **Units** | ا ب ج د ه و ز ح ط | 1 – 9 |
| **Tens** | ي ك ل م ن س ع ف ص | 10 – 90 |
| **Hundreds** | ق ر ش ت ث خ ذ ض ظ | 100 – 900 |
| **Thousand** | غ | 1000 |

Twenty-eight letters, twenty-seven regular slots and one cap. The structure is
positional: the alphabet is laid across three decades, and a letter's register is
as informative as its value.

---

## 10.2 The load-bearing fact

Look at the five letters that share the tooth skeleton:

| Letter | ب | ت | ث | ن | ي |
|---|---|---|---|---|---|
| **Value** | 2 | 400 | 500 | 50 | 10 |

They collapse to one shape and separate into five values — and not merely five
different values, but values in **four different registers**. The skeleton merges
them totally; the weight distinguishes them maximally.

> **Weight recovers precisely what shape discards.**

This is not a coincidence and it is not a mystical correspondence. Both systems
partition the same twenty-eight letters, and they were built on independent
principles — one on the motion of the hand, one on the order of counting — so
their partitions are unrelated. Two unrelated partitions of the same set are
*jointly* far more discriminating than either alone. The architecture gets a
second channel for free, and the channel is precisely complementary to the first.

**Skeleton and weight are two lossy channels that are jointly sufficient.**

---

## 10.3 Operations

### Value
Sum the letters. One addition per letter.

### Inverse
Given a total, find the strings that reach it. A partition problem — hand-solvable
at the sizes that arise, and heavily constrained because the summands come from a
fixed set of twenty-eight.

### Reduction
Collapse a value digit-wise to a single figure. A many-to-one map onto 1–9,
cheap, and useful as a checksum precisely because it is lossy in a known way.

### Constrained solve
Given a skeleton **and** a total, find the bindings that satisfy both. This is the
operation the layer exists for, and §10.4 works it.

---

## 10.4 Worked example

Skeleton **كٮٮ**. Fifteen candidates (Layer 5). Suppose the total is known to be
**422**.

ك is fixed at 20, so the two open slots must sum to 402. The tooth domains supply:

- slot 2 ∈ {ب 2, ت 400, ث 500, ن 50, ي 10}
- slot 3 ∈ {ب 2, ت 400, ث 500}

Pairs summing to 402: (2, 400) and (400, 2). Two solutions.

> **كبت** and **كتب** — fifteen candidates cut to two by arithmetic alone.

No lexical knowledge was used. No context, no grammar, no meaning. Addition did
the work, and it removed thirteen of fifteen candidates in one pass.

The remaining ambiguity is then settled by the cheapest filter in Layer 6: one of
the two is the common word, the other is not. **Weight then lexicon: fifteen to
two to one.**

Note honestly what happened and what did not. Weight did not produce a unique
answer by itself — it produced two, because the tooth values happen to admit two
orderings of the same pair. That is the normal case, and it is why the
architecture stacks channels rather than relying on any one. A filter that cuts a
space by 87% in a single arithmetic pass has more than earned its place without
having to be infallible.

---

## 10.5 Bidirectionality

Value is a function; inverse is a relation. The pair makes the layer a **two-way
bridge** between text and number, and both directions are used:

- **Forward**, weight is a *checksum*: compute it, carry it, and any substitution
  error changes it (Layer 19).
- **Backward**, weight is a *constraint*: know the total, and the letters are
  narrowed before they are read (§10.4).

A system with only the forward direction would be a verification device. With
both, it is a solving device, and the backward direction is what makes the
skeleton computationally tractable rather than merely ambiguous.

---

## 10.6 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** Addition. Nothing else is required at any step, in either direction. |
| 2 | Closure | **Pass.** Value maps strings to integers; inverse maps integers to sets of strings. |
| 3 | Independence | **Pass.** Layer 3 orders the alphabet but assigns no magnitudes, and no operation available there — step, reflect, distance, interval — can express a *sum over a string*. Position does not imply value; the two partitions are unrelated, which §10.2 depends on. |
| 4 | Accounted loss | **Pass.** Value is a projection and its loss is exactly characterized: it is invariant under permutation (Layer 9), so it discards order and nothing else about which letters are present. Reduction's loss is stated and deliberate. |
| 5 | Hand-verifiability | **Pass.** 20 + 400 + 2 = 422, and the solve in §10.4 is two additions checked against a table of five values. |

---

## 10.7 Relation to neighbouring layers

- **Below (Layer 3):** position is upstream of value. That layer supplies the
  ordering; this one lays magnitudes over it, as one interpretation among several.
- **Below (Layers 4, 5):** supplies Layer 6's most powerful cheap filter, acting
  directly on the candidate set.
- **Beside (Layer 9):** **weight is invariant under permutation.** Every string in
  an orbit has the same value. This is the architecture's cleanest invariance and
  Layer 14 opens with it.
- **Beside (Layer 8):** weight is **not** invariant under substitution — that is
  exactly why it detects substitution errors.
- **Forward (Layer 18):** the inverse direction encodes numbers as letters, which
  is how the alphabet becomes storage.
- **Forward (Layer 19):** the forward direction is a checksum over the one damage
  class the skeleton is blind to.

---

**Previous:** [Layer 9 — Permutation](09-permutation.md) · **Next:** [Layer 11 — Pulse](11-pulse.md)
