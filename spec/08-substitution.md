# Layer 8 — Substitution (الإبدال)

> **Band III — Transformation.** What can be done to a string.

## Core statement

**Change which letters, keep the order.**

A substitution is a bijection of the alphabet onto itself, applied letter by
letter to a string. Order is untouched; identity is replaced. This is one of
exactly two independent moves available to a string, and Layer 9 is the other.

---

## 8.1 The algebra

Substitutions compose, every substitution has an inverse, and the identity is a
substitution. They therefore form a **group** — the full symmetric group on
twenty-eight letters. Every substitution in it has:

- an **order**: the number of applications that return every letter home;
- a set of **fixed points**: letters it leaves alone;
- a **cycle structure**, which determines both of the above.

Layer 3 supplies the two generators worth naming:

- **Reflect** — position *n* to position 29 − *n*. An involution (order 2). It
  has **no fixed points**, because twenty-eight is even.
- **Shift by k** — position *n* to *n + k*, wrapping. Order 28 / gcd(28, k). A
  shift has no fixed points unless it is the identity.

---

## 8.2 The silent subgroup

This is the layer's real object, and it exists only because the script has
skeletons.

**Class-swap**: map each letter to another letter sharing its shape class. Such a
substitution changes letters and leaves the written skeleton **identical**.

> A substitution that cannot be seen is a real object in this language.

The skeleton-preserving substitutions form a subgroup — the **silent subgroup**.
It is the direct product of the symmetric groups on each shape class:

```
S₅ × S₃ × (S₂)⁷ × (S₁)⁶
```

one factor per class from Layer 0: the five-letter tooth class, the three-letter
ح class, seven two-letter classes, and six singletons.

Its order:

```
5! · 3! · (2!)⁷ = 120 · 6 · 128 = 92,160
```

**92,160 substitutions rewrite every text in the language and leave every page
looking exactly as it did.**

> **A distinction worth stating.** 92,160 is the number of skeleton-preserving
> *bijections* of the alphabet. It is not the same as 1,920 — the product of the
> class sizes — which counts the ways to choose one letter from each class. The
> first is a group order; the second is a selection count. They answer different
> questions and only the first is the size of the subgroup.

### Why this matters

The silent subgroup is the precise measure of what the skeleton does not
determine, expressed as symmetry rather than as loss. Layer 4 states the same
fact in bits; this layer states it as a group, and the group form is the more
useful one, because groups act. Each element of the silent subgroup carries a
word to another word in its own candidate set (Layer 5) — the subgroup *is* the
symmetry group of the lattice's top level.

---

## 8.3 Operations

- **Apply** — rewrite a string under a substitution. One table lookup per letter.
- **Compose** — combine two substitutions into one table.
- **Invert** — read the table backward.
- **Order** — apply repeatedly and count until the identity returns.
- **Fixed points** — read off the letters the table sends to themselves.
- **Silence test** — does this substitution preserve the skeleton? Check whether
  every letter maps within its own class. Twenty-eight comparisons.

---

## 8.4 Worked example

Apply reflection in the hijāʾī order to a three-letter string. Each letter is
replaced by its mirror; the string's length, its interval structure (up to sign),
and its position count are all preserved. Apply it a second time and the original
returns exactly — no bookkeeping, no residue, because the operation is an
involution.

Now apply a class-swap that sends **ت → ب** and leaves everything else fixed.
The string كتب becomes كبب. On the surface, **nothing has changed** — both are
written كٮٮ. A reader consulting the page cannot detect that the substitution
occurred. A reader consulting the *candidate set* cannot either, because both
words were always in it.

This is the sharpest statement of what a skeleton is: the skeleton is the
invariant of the silent subgroup.

---

## 8.5 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** A substitution is a table of twenty-eight pairs, written once and applied by hand thereafter. |
| 2 | Closure | **Pass.** Substitutions map strings over the alphabet to strings over the alphabet, and compose within the group. |
| 3 | Independence | **Pass.** Layer 3 gives the alphabet an order and defines step and reflect on single letters. It does not close them into a group, does not compose them, and has no notion of a transformation acting on a *string*. |
| 4 | Accounted loss | **Pass.** Every substitution is a bijection and therefore exactly invertible. There is no loss anywhere in this layer. |
| 5 | Hand-verifiability | **Pass.** The order 92,160 is a product of six small factorials. The silence test is twenty-eight comparisons. |

---

## 8.6 Relation to neighbouring layers

- **Below (Layer 3):** reflect and shift come from the address ring. This layer
  closes them into a group and lets them act on strings.
- **Below (Layers 4, 5):** the silent subgroup is the group-theoretic form of the
  void. What Layer 4 counts in bits and Layer 5 arranges in a lattice, this layer
  expresses as a symmetry.
- **Beside (Layer 9):** permutation is the orthogonal move — same letters,
  different order. The two together generate everything that can be done to a
  string without adding or removing material.
- **Forward (Layer 14):** substitution does **not** commute with weight. Layer 14
  catalogues that.
- **Forward (Layer 19):** a substitution error is the damage class that weight
  detects and the skeleton does not.

---

**Previous:** [Layer 7 — Segment](07-segment.md) · **Next:** [Layer 9 — Permutation](09-permutation.md)
