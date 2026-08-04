# Layer 3 — The Order (الترتيب)

> **Band I — The Alphabet Alone.**

## Core statement

**The alphabet is not a bag. It is an addressable ring.**

The alphabet is a sequence, so every letter has an address. And it has **two**
canonical sequences, so every letter has **two** addresses.

| Order | | Sequence |
|---|---|---|
| **Abjadī** | الترتيب الأبجدي | ا ب ج د ه و ز ح ط ي ك ل م ن س ع ف ص ق ر ش ت ث خ ذ ض ظ غ |
| **Hijāʾī** | الترتيب الهجائي | ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي |

The first is the inherited order. The second orders by kinship of shape — it is
the alphabet sorted by its own skeleton, which makes it a Layer 0 fact promoted
into an ordering.

Two orders means every letter is a **pair of coordinates**: a twenty-eight point
set embedded in a two-dimensional address space.

---

## 3.1 The permutation between the orders

The map from one order to the other is a fixed permutation of twenty-eight
elements. It is a hand-tabulable object with its own structure, and that structure
is a constant of the alphabet:

| Property | Value |
|---|---|
| Cycle type | 1, 1, 5, 21 |
| Number of cycles | 4 |
| Fixed letters | **ا** and **ب** |
| Order of the permutation | **105** |

Read the last row carefully. Apply the abjadī↔hijāʾī map to the alphabet
repeatedly and **every letter returns to where it began after 105 applications**,
and not before. That number is not decreed by anyone. It is a fact about the two
orders, discoverable by a person with a table and patience, identical in any
century.

Two letters never move at all: **ا** and **ب**, which head both orders. The
remaining twenty-six divide into a cycle of five and a cycle of twenty-one.

---

## 3.2 Operations

### Address
The index of a letter, in either order. Two integers per letter, 1 to 28.

### Step
Move n places, wrapping at twenty-eight. The alphabet is a **cycle**: there is no
last letter, only a letter whose successor is the first.

### Reflect
Send position *n* to position 29 − *n*. This is an **involution** — applied twice
it returns every letter home — and applied to the whole alphabet it is a complete,
self-inverse substitution of the alphabet onto itself.

It has **no fixed points**. Twenty-eight is even, so no letter sits at its own
mirror; the reflection moves everything. An alphabet of odd size would have a
still centre. This one does not, and that is a structural fact about the number
twenty-eight, not about any letter.

### Distance
The gap between two letters, measured directly or around the wrap. This makes the
alphabet a **metric space**: letters have distances from one another that have
nothing to do with sound or meaning.

### Interval
The sequence of steps between successive letters of a word — the word's shape in
address space, independent of which letters it uses.

Shift every letter of a word equally and the interval sequence is unchanged.

> **Letters transpose the way music transposes.**

A word and its shift are different words with identical interval structure. The
interval sequence is what survives shifting, and it is therefore the word's
address-space signature.

### Cycle
Apply the order-permutation repeatedly and count. Every letter returns after 105
steps (§3.1).

---

## 3.3 Worked example

Take the reflection in the hijāʾī order. Position 1 is **ا** and position 28 is
**ي**, so reflection exchanges them. Position 2 is **ب**, position 27 is **و** —
exchanged. And so on inward, fourteen exchanges covering all twenty-eight
letters, no letter left over, no letter fixed.

Applied to a word, reflection produces another string of the same length with the
same interval structure reversed in sign. It is total, cheap, and exactly
invertible — apply it twice and the original returns. A person needs one table of
fourteen pairs, written once, to perform it for life.

---

## 3.4 Position is upstream of value

This layer assigns **positions**: 1 to 28, one per letter, in each of two orders.
Layer 10 will assign **magnitudes**: 1, 2, 3 … 400, 500 … 1000.

Position is the more primitive fact. It requires only that the letters be laid in
a line and counted. Magnitude requires a decision about what each letter is worth
— a decision that is coherent and useful, but a decision.

Today's definition begins at value: it introduces the alphabet and immediately
tells you that ا is one and ت is four hundred. This architecture begins at
position, and derives value later as **one interpretation among several** of a
structure that is already there. The alphabet is ordered before it is valued, and
ordering alone is enough to support shifting, reflection, distance, intervals and
the entire substitution algebra of Layer 8.

---

## 3.5 Contract check

| # | Condition | Verdict |
|---|---|---|
| 1 | Substrate independence | **Pass.** Ordering and wrapping need nothing but counting. Twenty-eight pebbles in a line reproduce the entire layer. |
| 2 | Closure | **Pass.** Step and reflect map letters to letters. Address, distance and interval map letters and strings to integers. |
| 3 | Independence | **Pass.** Layers 1 and 2 describe letters individually and in contact. Neither carries any notion of sequence — a letter's motion and its faces are unchanged by where it falls in an ordering. Sequence is new information. |
| 4 | Accounted loss | **Pass.** Reflection is an involution; step inverts by stepping back. Interval is a projection and its loss is exactly one letter's worth: given the intervals and any single letter, the whole word returns. |
| 5 | Hand-verifiability | **Pass.** Every figure in §3.1 is reachable by tabulation. The 105 is a count, not an authority. |

---

## 3.6 Relation to neighbouring layers

- **Below (Layer 2):** letters as context-sensitive functions. This layer ignores
  context entirely and attends to sequence, which is why the two are independent.
- **Above (Layer 4):** Band I closes here. From Layer 4 the alphabet becomes text,
  and the questions change from *what is a letter* to *what is a skeleton*.
- **Forward (Layer 8):** step and reflect are the two generators the substitution
  algebra is built from. Layer 8 is this layer's arithmetic, applied to strings
  and closed into a group.
- **Forward (Layer 17):** a **third** ordering of the alphabet, by point of
  articulation in the body. Unlike these two, that one is not conventional at all.

---

**Previous:** [Layer 2 — The Face](02-face.md) · **Next:** [Layer 4 — The Void](04-void.md)
