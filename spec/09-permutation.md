# Layer 9 — Permutation (التقليب)

> **Band III — Transformation.**

## Core statement

**Change the order, keep the letters.**

This is the exact orthogonal complement of Layer 8. Substitution replaces
identities and preserves positions; permutation replaces positions and preserves
identities. Between them they exhaust what can be done to a string without adding
or removing material.

> That the two are complements is why both earn slots under Contract condition 3.
> Neither is derivable from the other: no sequence of substitutions reorders a
> string, and no sequence of permutations changes which letters it contains.

---

## 9.1 Operations

### Orbit
All orderings of a given multiset of letters. For three distinct letters, six.

### Used and neglected
Mark which orderings are realized in the language (مستعمل) and which are not
(مهمل). The realized set is **sparse** — a small fraction of each orbit.

> **The pattern of the sparsity is itself data.**

This is the point most easily missed. That some orderings are used and others are
not looks like an accident of vocabulary. It is not: the neglected orderings are
neglected for reasons — phonotactic, morphological, historical — and the *shape*
of the neglect is a structural fact about the language, recoverable by anyone who
enumerates an orbit and checks its members. Enumeration turns a lexicon from a
list into a map with holes in it, and the holes have contours.

### Density
Realized over possible, one ratio per orbit. A single number saying how much of
its own combinatorial space a letter-set actually occupies.

### The nested groups
Three groups of reordering, each contained in the next:

```
cyclic  ⊂  dihedral  ⊂  symmetric
```

- **Cyclic** — rotations only. Order *n* for a string of length *n*.
- **Dihedral** — rotations and reversal. Order 2*n*.
- **Symmetric** — all reorderings. Order *n*!.

For three letters: 3 ⊂ 6 ⊂ 6. For four: 4 ⊂ 8 ⊂ 24. The gap between dihedral and
symmetric opens at length four and widens fast, which is why the reordering of
three-radical roots is exhaustively tabulable by hand and the reordering of longer
strings is not.

---

## 9.2 The root space

Applied to roots, enumeration gives the size of the language's generative base
directly. For roots of *k* distinct radicals drawn from twenty-eight letters, the
number of **ordered** roots is the falling factorial, and the number of
**unordered** letter-sets — each the seed of one orbit — is that divided by *k*!:

| *k* | Ordered roots | Orbits (letter-sets) |
|---|---|---|
| 2 | 28 · 27 = 756 | 378 |
| 3 | 28 · 27 · 26 = 19,656 | 3,276 |
| 4 | 491,400 | 20,475 |
| 5 | 11,793,600 | 98,280 |

Every figure is a product of small integers divided by a small factorial. A person
with no instrument computes the whole table, and the table bounds the language:
**the generative base is finite, countable, and countable by hand.**

---

## 9.3 Worked example

Take three distinct radicals and enumerate the orbit: six orderings.

Now ask, of each, whether it is used. Some will be; several will not. Record the
answer as a six-bit verdict. That verdict is a complete description of how the
language occupies this particular corner of its space, it took six questions to
obtain, and it is stable — the same six questions asked in any era return an
answer about that era, and the *differences* between the answers are themselves
the history of the language, measured rather than narrated.

---

## 9.4 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** Rearranging tokens. Three pebbles suffice for the three-letter case, and the general procedure is the same. |
| 2 | Closure | **Pass.** Permutations map strings to strings of the same length over the same letters; density and orbit size map letter-sets to integers. |
| 3 | Independence | **Pass.** Explicitly orthogonal to Layer 8, and invisible to every layer below it: Layers 1–3 have no notion of a string at all, and Layers 4–7 treat position as fixed by the writing. |
| 4 | Accounted loss | **Pass.** Every permutation is a bijection and inverts exactly. Density is a projection whose loss is stated: it keeps how many orderings are used, discards which. |
| 5 | Hand-verifiability | **Pass.** Every figure in §9.2 is a product of small integers. Six orderings of three letters are written out in under a minute. |

---

## 9.5 Relation to neighbouring layers

- **Beside (Layer 8):** the complement. Together they generate all
  material-preserving transformations of a string.
- **Below (Layer 0):** the inherited account permutes *roots*. This layer permutes
  strings, and recovers the root case as one application among many.
- **Forward (Layer 10):** **weight is invariant under permutation** — a sum does
  not care about order. So the entire orbit of a string shares one value, and
  weight can never distinguish an anagram from its source.
- **Forward (Layer 7, contrast):** profile is **not** invariant under permutation.
  Reordering moves the closed letters and changes where the word breaks. Two
  layers, two different blindnesses.
- **Forward (Layer 15):** the strings fixed by reversal are the palindromes — the
  fixed-point set of the dihedral group's reflection.

---

**Previous:** [Layer 8 — Substitution](08-substitution.md) · **Next:** [Layer 10 — Weight](10-weight.md)
