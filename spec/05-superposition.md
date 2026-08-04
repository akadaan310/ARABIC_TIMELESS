# Layer 5 — Superposition (الاحتمال)

> **Band II — The Skeleton.**

## Core statement

**A skeleton denotes a set of words, never one. Multiplicity is a value, not a
defect.**

Layer 4 established that a skeleton carries free variables. It follows
immediately that a skeleton does not name a word. It names **every word
consistent with it** — and that set is the skeleton's meaning, in full, with
nothing missing.

The habit of treating this as a problem is a habit imported from scripts that
cannot do it. A skeleton that denotes fifteen words has not failed to denote one.
It has succeeded in denoting fifteen.

---

## 5.1 Operations

### Expansion
Generate the full candidate set from a skeleton — the Cartesian product of its
slot domains, laid back into the skeleton's positions.

### Cardinality
The size of that set. It is exactly Layer 4's degree, now realized rather than
predicted. Degree is computed without writing anything down; cardinality is what
you count when you have.

### Containment
One skeleton's set may contain another's. Bind a slot and the set shrinks; the
new set is a subset of the old. Containment is therefore the relation induced by
binding, and it orders the whole space.

### Meet and join
Two partially-bound skeletons over the same shape have a greatest lower bound
(bind everything both agree on) and a least upper bound (unbind wherever they
disagree). The space is closed under both.

---

## 5.2 The lattice

Because binding only ever shrinks the candidate set, and because partial bindings
compose, the objects of this layer form a **lattice**.

```
                    كٮٮ                    ← bare skeleton, 15 words
                  /     \
              كٮت         كبٮ              ← one slot bound
             /   \       /   \
          كتت    كبت   كبت    كبب          ← both slots bound: singletons
```

- **Top:** the bare skeleton. Maximum openness, maximum candidate set.
- **Bottom:** fully marked words. Singletons.
- **Between:** every partial binding, each a legitimate expression.

> **The skeletons form a lattice, and to write is to choose a height in it.**

The writer selects how determinate to be. Marking every distinction puts the text
at the bottom of the lattice. Marking none puts it at the top. Marking some — the
ones that matter, in the places where the reader would otherwise go wrong — puts
it exactly where the writer intends, and that is the normal case rather than the
exception.

**A language in which precision is a free parameter is doing something no
fully-specified script can do.** In a script without slots, every act of writing
is forced to the bottom of a lattice with one level. Determinacy is not chosen
there; it is compulsory. Here it is an authorial decision, made per position, at
no cost in apparatus.

---

## 5.3 Worked example

The skeleton **كٮٮ** expands to fifteen candidates:

```
كبب  كبت  كبث      كتب  كتت  كتث      كثب  كثت  كثث
كنب  كنت  كنث      كيب  كيت  كيث
```

Bind the second position to **ت** and the set drops to three — {كتب, كتت, كتث} —
a strict subset, reached by one mark. Bind the third to **ب** instead and the set
drops to five — {كبب, كتب, كثب, كنب, كيب}. Both are single marks; they prune by
different amounts, because the slots have different domain sizes.

**Which mark to make is therefore an optimization**, and it is one a writer
performs intuitively: mark the position that removes the most confusion for the
least ink. The tooth with the five-way domain is worth marking; a position with a
two-way domain often is not.

---

## 5.4 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** Expansion is enumeration; containment is comparison. Both are pure combinatorics on marks already present. |
| 2 | Closure | **Pass.** Expansion maps a skeleton to a set of strings over the alphabet; cardinality maps it to an integer; meet and join map pairs of skeletons to skeletons. |
| 3 | Independence | **Pass.** Layer 4 counts the free variables. It does not construct what they range over jointly, and it has no notion of one skeleton *containing* another. The lattice is not visible from Layer 4. |
| 4 | Accounted loss | **Pass.** Expansion is exactly invertible — the skeleton is recovered from the candidate set by keeping what all members share. Cardinality is a projection whose loss is stated: it keeps how many, discards which. |
| 5 | Hand-verifiability | **Pass.** The fifteen candidates above were written out. Anyone can write them out again. |

---

## 5.5 Relation to neighbouring layers

- **Below (Layer 4):** slots and their sizes. This layer takes the product and
  looks at what it produces.
- **Above (Layer 6):** a set is not yet a reading. Layer 6 supplies the operators
  that reduce it, and the criteria for stopping.
- **Forward (Layer 8):** the silent subgroup consists of exactly those
  substitutions that move a word within its own candidate set — they change the
  letters and leave the skeleton, and therefore the set, untouched.
- **Forward (Layer 19):** damage moves a text *up* the lattice, enlarging the
  candidate set. Recovery is descent. The lattice is the space damage and repair
  both move through.

---

**Previous:** [Layer 4 — The Void](04-void.md) · **Next:** [Layer 6 — Collapse](06-collapse.md)
