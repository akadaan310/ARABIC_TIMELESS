# Layer 14 — Composition (التركيب)

> **Band IV — Structure.** This is the layer *about* layers.

## Core statement

**Which operations commute, and which do not.**

Every layer above defines operations. This layer asks what happens when they are
run together — in which order, with what interference, and what each one is blind
to. The answer is a table, and the table is what makes the architecture a system
rather than a list of twenty good ideas.

---

## 14.1 The invariance table

Rows are **observables** — the readings the layers produce. Columns are
**transformations** — the operations that act on a string. A cell says whether
the observable survives the transformation.

| Observable | Silent substitution | Reflection | Permutation | Reversal |
|---|---|---|---|---|
| **Skeleton** (L4) | invariant | changes | changes | changes |
| **Profile** (L7) | invariant | changes | changes | changes |
| **Weight** (L10) | changes | changes | **invariant** | **invariant** |
| **Letter multiset** (L9) | changes | changes | **invariant** | **invariant** |
| **Length** | invariant | invariant | invariant | invariant |

Read the table by its columns and the architecture's shape appears.

**Silent substitution** — the skeleton-preserving subgroup of Layer 8 — leaves the
skeleton and the profile untouched and destroys weight and multiset. It is
invisible to the eye and loud to arithmetic.

**Permutation** does the reverse exactly. It leaves weight and multiset untouched
and destroys skeleton and profile. It is invisible to arithmetic and loud to the
eye.

> **The two channels are blind to opposite things.**

That is not a pleasing symmetry noticed after the fact. It is the reason the
architecture works. Two filters that see the same distinctions are redundant; two
that see complementary distinctions multiply. Layer 6 stacks its filters in cost
order and gets more than the sum of their parts because this table is shaped the
way it is.

---

## 14.2 A theorem the table exposes

The profile row and the skeleton row are identical, and the reason is not obvious:

> **The six closed letters form a union of complete shape classes.**

Closed = ا د ذ ر ز و. The shape classes involved are ا = {ا}, د = {د ذ},
ر = {ر ز}, و = {و} — and their union is exactly the closed set, with nothing left
over and nothing missing.

Therefore a silent substitution, which permutes letters *within* their classes,
can never move a letter from open to closed or back. Closedness is a class
property, so it survives every skeleton-preserving substitution, so **the profile
survives too.**

This is checkable in a minute — list the closed letters, list their classes,
compare the union — and it explains why Layer 7's filter is safe to apply before
any binding has been decided. The profile is a fact about the skeleton, not about
the letters underneath it.

---

## 14.3 Order matters: non-commuting pairs

### Substitution and weight
`weight(substitute(w)) ≠ substitute(weight(w))` — the second is not even
well-formed, and the first depends entirely on which substitution ran. Substitution
and weight do not commute, which is exactly why weight detects substitution
(Layer 19).

### Permutation and weight
These **do** commute, in the strong sense that permutation acts trivially on
weight. A sum does not care about order. Every string in an orbit has one value,
so weight can never distinguish an anagram from its source.

### Application and abstraction
Layer 13's two operations are strict inverses: `abstract(apply(p, r)) = p` and
`apply(abstract(w), root(w)) = w`. They compose to the identity in both
directions, the only pair in the architecture that does.

### Binding and everything
Binding (Layer 4) is monotonic and one-way. It commutes with nothing, because
every other operation is defined on a fixed set of letters and binding changes
which letters there are. Binding must run last or be accounted for explicitly —
which is why Layer 6's procedure filters candidates rather than modifying the
skeleton.

---

## 14.4 Shared machinery across unshared subjects

Some layers use the same mathematics on different material, and noticing this is
part of this layer's work:

| Machinery | Layer | Acting on |
|---|---|---|
| Cyclic group | 3 | positions in the alphabet (step, wrap) |
| Cyclic group | 9 | positions in a string (rotation) |
| Cyclic group | 11 | bits in a binary word (metre orbits) |
| Involution | 3 | reflection of addresses |
| Involution | 9 | reversal of strings |
| Projection with stated loss | 7, 10, 11, 12 | profile, weight, pulse, root |

The same group appears three times on three different sets. A person who learns
rotation once can apply it in all three places, and this is a large part of why
the whole system fits in one head.

---

## 14.5 The stacking rule

From the table, the rule for combining filters:

> **Stack filters whose invariance rows differ. Skip filters whose rows match.**

Profile after skeleton adds little — their rows are identical, so they are
sensitive to the same transformations and will often remove the same candidates.
Weight after skeleton adds enormously — their rows are opposite.

This is the justification for Layer 6's cost ordering, stated structurally rather
than empirically. The cheap filters come first, but among filters of similar cost,
the one to run next is the one whose blindnesses least resemble what has already
run.

---

## 14.6 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** Every cell of §14.1 is settled by taking a word, performing the transformation by hand, and comparing the two readings. |
| 2 | Closure | **Pass.** The layer's output is a relation on (observable, transformation) pairs — a finite table over the architecture's own objects. |
| 3 | Independence | **Pass.** No layer below can state a fact about *another* layer. Each one defines its own operations and is silent about interference. Cross-layer invariance is information that exists nowhere else. |
| 4 | Accounted loss | **Pass.** The table is exhaustive over the observables and transformations it names, and it asserts nothing about pairs it does not list. |
| 5 | Hand-verifiability | **Pass.** §14.2's theorem is confirmed by comparing two short lists of letters. |

---

## 14.7 Relation to neighbouring layers

- **Below (all of 1–13):** this layer indexes them. It should be read last among
  Band IV, because every row depends on a definition made earlier.
- **Below (Layer 6):** supplies the structural justification for the filter
  ordering that layer uses.
- **Forward (Layer 19):** the table *is* the error-detection map. An observable
  that changes under a transformation detects that transformation as damage; an
  observable that survives is blind to it. Layer 19 reads this table as a list of
  which channel catches which corruption.
- **Forward (Layer 20):** the bottom row — length, invariant under everything — is
  the first entry in the list of true invariants.

---

**Previous:** [Layer 13 — Pattern](13-pattern.md) · **Next:** [Layer 15 — Symmetry](15-symmetry.md)
