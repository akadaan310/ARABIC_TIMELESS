# Layer 15 — Symmetry (التناظر)

> **Band IV — Structure.**

## Core statement

**Fixed points under every transformation defined above.**

Layer 14 asked what survives a transformation. This layer asks what does not
*move* under it. Every transformation has a set of strings it leaves exactly as
they were, and those sets are the architecture's distinguished objects.

---

## 15.1 The fixed-point sets

| Transformation | Fixed strings | |
|---|---|---|
| **Reversal** (L9) | palindromes | strings identical read either way |
| **Rotation by k** (L9, L11) | periodic strings | strings repeating with period dividing k |
| **Reflection** (L3, L8) | none among single letters | 28 is even, so no letter is its own mirror |
| **Silent substitution** (L8) | strings drawn only from singleton classes | ا ك ل م ه و — the six letters with no class-mates |
| **Binding** (L4) | fully bound strings | words with no open slots |

Each row is a different kind of specialness, and none of them is a matter of
taste. A string either is fixed or is not, and the question is settled by
performing the transformation and looking.

---

## 15.2 The unmoved alphabet

The silent-substitution row deserves separate statement.

The letters **ا ك ل م ه و** are alone in their shape classes. No skeleton-
preserving substitution can touch them, because there is nothing within their
class to exchange them for. A string written entirely from these six letters is
**fully determined by its own skeleton**: it has arity zero (Layer 4), degree one
(Layer 5), and a candidate set of size one.

> There is a six-letter sub-alphabet in which the dotless script has no ambiguity
> whatsoever.

This is a real and checkable property of the system, and it is the exact
complement of the tooth. Where the tooth is the point of maximum openness — five
letters to one shape — these six are points of zero openness. The alphabet
contains both extremes, and a writer who needs certainty at a position has a
vocabulary available in which certainty is structural rather than added by
marking.

---

## 15.3 Intersecting the sets

The fixed-point sets can be intersected, and the intersections are the layer's
real subject.

A string that is **both** a palindrome **and** written only from the six unmoved
letters is fixed under reversal and under every silent substitution at once. It is
immune to the two transformations that Layer 14 identified as blind to opposite
things — which means it is immune to both blindnesses simultaneously.

Such strings are rare. They are also maximally robust: Layer 19 will note that a
string fixed under a transformation cannot be *corrupted* by that transformation,
because corruption is displacement and there is nowhere for it to be displaced to.

> **Symmetry is redundancy that costs nothing to store.**

A palindrome carries its own check: read it backward and compare. No external
value, no separate record, no additional apparatus. The check is the string.

---

## 15.4 Operations

- **Test** — apply a transformation and compare with the original. One pass.
- **Enumerate** — generate the fixed-point set of a transformation, for a given
  length.
- **Intersect** — find strings fixed under several transformations at once.
- **Orbit size** — for a string not fixed, count how many distinct images the
  transformation produces before returning. Fixed strings have orbit size 1, which
  is the definition restated as a count.

---

## 15.5 Worked example

Take rotation on binary words, from Layer 11.

The word 1010101 has period 2 — rotating it twice returns it unchanged — so its
orbit under rotation is smaller than its length. Compare a word with no internal
repetition, whose orbit is as large as its length allows.

Layer 11 found that the eight feet fall into three rotation orbits, and the orbit
sizes are unequal for exactly this reason: **the more symmetric a binary word is,
the fewer distinct metres it generates.** Symmetry and productivity trade off
directly, and the trade is visible as a count.

This is the general shape of the layer's finding. A symmetric object is a stable
object, and stability is bought with variety.

---

## 15.6 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** Testing a symmetry is performing a transformation and comparing. Both were already certified substrate-independent in the layers that defined them. |
| 2 | Closure | **Pass.** Fixed-point sets are sets of strings over the alphabet; orbit size maps strings to integers. |
| 3 | Independence | **Pass.** Layer 14 records whether an *observable* survives a transformation. That is a different question from whether a *string* is fixed by it — an observable can survive while every string moves, and §15.1's reflection row is exactly that case. |
| 4 | Accounted loss | **Pass.** No loss. Testing and enumeration are non-destructive; the layer only observes. |
| 5 | Hand-verifiability | **Pass.** The six unmoved letters are found by reading Layer 0's class table and taking the singletons. Palindromy is checked by reading backward. |

---

## 15.7 Relation to neighbouring layers

- **Below (Layer 14):** the complement question. Layer 14 asks what a
  transformation preserves *about* a string; this layer asks which strings it
  preserves *entirely*.
- **Below (Layers 3, 8, 9, 11):** every transformation examined here was defined
  in one of those layers. This layer contributes the fixed-point analysis they do
  not perform on themselves.
- **Forward (Layer 18):** a palindrome stores its own checksum, so symmetric
  material is cheaper to hold in memory than asymmetric material of the same
  length.
- **Forward (Layer 19):** a string fixed under a transformation is immune to that
  transformation as a damage mode. Symmetry is error-correction obtained for free.
- **Forward (Layer 20):** fixed points under *all* transformations are the true
  invariants, and finding them is what Layer 20 does.

---

**Previous:** [Layer 14 — Composition](14-composition.md) · **Next:** [Layer 16 — The Hand](16-hand.md)
